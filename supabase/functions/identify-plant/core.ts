export const MAX_IDENTIFICATION_BASE64 = 8 * 1024 * 1024;
export type IdentificationErrorCode = 'configuration' | 'image' | 'invalid-response' | 'rate-limit' | 'unavailable' | 'not-found';

export class IdentificationError extends Error {
  constructor(public readonly code: IdentificationErrorCode, public readonly status: number, public readonly retryAfter?: number) {
    super(code);
  }
}

export function parseIdentificationRequest(value: unknown) {
  const photo = value as { base64?: unknown; mimeType?: unknown } | null;
  if (typeof photo?.base64 !== 'string' || typeof photo.mimeType !== 'string' ||
    !['image/jpeg', 'image/png'].includes(photo.mimeType) || !photo.base64.length ||
    photo.base64.length > MAX_IDENTIFICATION_BASE64 || photo.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(photo.base64)) {
    throw new IdentificationError('image', typeof photo?.base64 === 'string' && photo.base64.length > MAX_IDENTIFICATION_BASE64 ? 413 : 400);
  }
  const bytes = Uint8Array.from(atob(photo.base64), (char) => char.charCodeAt(0));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (photo.mimeType === 'image/jpeg' ? !isJpeg : !isPng) throw new IdentificationError('image', 400);
  return { bytes: stripImageMetadata(bytes, photo.mimeType), mimeType: photo.mimeType };
}

type Bytes = Uint8Array<ArrayBuffer>;

// JPEG segments that can carry location, device, dates or text: APP1 (Exif/XMP), APP13 (IPTC) and comments.
const JPEG_METADATA_MARKERS = new Set([0xe1, 0xed, 0xfe]);
const PNG_METADATA_CHUNKS = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);

/**
 * Removes metadata (GPS, device, dates, comments) before the photo leaves our server.
 * Pixels are untouched; a structure that cannot be walked safely is returned as is.
 */
export function stripImageMetadata(bytes: Bytes, mimeType: string): Bytes {
  return (mimeType === 'image/png' ? stripPng(bytes) : stripJpeg(bytes)) ?? bytes;
}

function stripJpeg(bytes: Bytes): Bytes | null {
  const kept: Bytes[] = [bytes.subarray(0, 2)];
  let removed = false;
  let pos = 2;
  while (pos + 1 < bytes.length) {
    if (bytes[pos] !== 0xff) return null;
    const marker = bytes[pos + 1];
    if (marker === 0xff) { pos++; continue; }
    if (marker === 0xda) { kept.push(bytes.subarray(pos)); return removed ? concat(kept) : bytes; }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { kept.push(bytes.subarray(pos, pos + 2)); pos += 2; continue; }
    if (pos + 3 >= bytes.length) return null;
    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    const end = pos + 2 + length;
    if (length < 2 || end > bytes.length) return null;
    if (JPEG_METADATA_MARKERS.has(marker)) removed = true;
    else kept.push(bytes.subarray(pos, end));
    pos = end;
  }
  return null;
}

function stripPng(bytes: Bytes): Bytes | null {
  const kept: Bytes[] = [bytes.subarray(0, 8)];
  let removed = false;
  let pos = 8;
  while (pos + 12 <= bytes.length) {
    const length = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0;
    const end = pos + 12 + length;
    if (end > bytes.length) return null;
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    if (PNG_METADATA_CHUNKS.has(type)) removed = true;
    else kept.push(bytes.subarray(pos, end));
    pos = end;
    if (type === 'IEND') return removed ? concat(kept) : bytes;
  }
  return null;
}

function concat(parts: Bytes[]): Bytes {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

export function parsePlantNetResponse(value: unknown) {
  const results = (value as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) throw new IdentificationError('invalid-response', 502);
  if (results.length === 0) throw new IdentificationError('not-found', 422);
  const candidates = results.map((result: unknown) => {
    const item = result as { score?: unknown; species?: { scientificNameWithoutAuthor?: unknown; commonNames?: unknown } } | null;
    const scientificName = item?.species?.scientificNameWithoutAuthor;
    const score = item?.score;
    if (typeof scientificName !== 'string' || !scientificName.trim() || scientificName.length > 200 ||
      typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new IdentificationError('invalid-response', 502);
    }
    const names = item?.species?.commonNames;
    const commonName = Array.isArray(names) ? names.find((name) => typeof name === 'string' && name.trim() && name.length <= 200) : undefined;
    return { scientificName: scientificName.trim(), commonName: typeof commonName === 'string' ? commonName.trim() : scientificName.trim(), confidence: score };
  }).sort((a, b) => b.confidence - a.confidence);
  return { candidates: candidates.filter((candidate, index) => candidates.findIndex((item) => item.scientificName === candidate.scientificName) === index).slice(0, 3) };
}

export function mapPlantNetStatus(status: number) {
  if ([401, 403].includes(status)) return new IdentificationError('configuration', 500);
  if (status === 429) return new IdentificationError('rate-limit', 429);
  if (status === 404) return new IdentificationError('not-found', 422);
  if ([400, 413, 415, 422].includes(status)) return new IdentificationError('image', 400);
  return new IdentificationError('unavailable', 503);
}

export async function requestPlantNet(photo: ReturnType<typeof parseIdentificationRequest>, apiKey: string, signal: AbortSignal, request: typeof fetch = fetch) {
  const form = new FormData();
  form.append('images', new Blob([photo.bytes], { type: photo.mimeType }), photo.mimeType === 'image/png' ? 'plant.png' : 'plant.jpg');
  form.append('organs', 'auto');
  const url = new URL('https://my-api.plantnet.org/v2/identify/all');
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('lang', 'pt');
  url.searchParams.set('nb-results', '3');
  url.searchParams.set('include-related-images', 'false');
  try {
    const response = await request(url, { method: 'POST', body: form, signal });
    if (!response.ok) throw mapPlantNetStatus(response.status);
    return parsePlantNetResponse(await response.json());
  } catch (error) {
    if (error instanceof IdentificationError) throw error;
    // Never propagate URL, API key, provider body or photo to the caller/logs.
    throw new IdentificationError('unavailable', 503);
  }
}
