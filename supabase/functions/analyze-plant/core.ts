export const MAX_BASE64_LENGTH = 8 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export type AnalysisRequest = { base64: string; mimeType: string };
export type FunctionErrorCode =
  | 'configuration'
  | 'image'
  | 'invalid-response'
  | 'rate-limit'
  | 'unavailable';

export class FunctionError extends Error {
  constructor(
    public readonly code: FunctionErrorCode,
    public readonly status: number,
    public readonly retryAfter?: number,
  ) {
    super(code);
    this.name = 'FunctionError';
  }
}

export function parseAnalysisRequest(value: unknown): AnalysisRequest {
  if (!value || typeof value !== 'object') throw new FunctionError('image', 400);
  const { base64, mimeType } = value as Record<string, unknown>;
  if (
    typeof base64 !== 'string'
    || typeof mimeType !== 'string'
    || !SUPPORTED_IMAGE_TYPES.has(mimeType)
    || base64.length === 0
    || base64.length > MAX_BASE64_LENGTH
    || base64.length % 4 !== 0
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  ) {
    const tooLarge = typeof base64 === 'string' && base64.length > MAX_BASE64_LENGTH;
    throw new FunctionError('image', tooLarge ? 413 : 400);
  }
  return { base64, mimeType };
}

export function getClientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return forwarded?.at(-1) || request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}

export async function hashQuotaKey(address: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${address}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function extractGeminiText(value: unknown): string {
  if (!value || typeof value !== 'object') throw new FunctionError('invalid-response', 502);
  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) throw new FunctionError('invalid-response', 502);
  const parts = candidates.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== 'object') return [];
    const contentParts = (content as { parts?: unknown }).parts;
    return Array.isArray(contentParts) ? contentParts : [];
  });
  const text = parts
    .map((part) => part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string'
      ? (part as { text: string }).text
      : '')
    .join('\n')
    .trim();
  if (!text) throw new FunctionError('invalid-response', 502);
  return text;
}

export function mapGeminiStatus(status: number): FunctionError {
  if (status === 400 || status === 401 || status === 402 || status === 403 || status === 404) {
    return new FunctionError('configuration', 500);
  }
  if (status === 429) return new FunctionError('rate-limit', 429);
  return new FunctionError('unavailable', 503);
}
