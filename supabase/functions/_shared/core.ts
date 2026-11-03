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
