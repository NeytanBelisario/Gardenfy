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
  return { bytes, mimeType: photo.mimeType };
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
