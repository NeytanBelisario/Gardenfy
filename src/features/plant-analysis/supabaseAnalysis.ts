import { PlantAnalysisError, type AnalysisErrorCode } from './analysisErrors';
import type { AnalysisTransport } from './analysisService';

export type AnalysisEndpointConfig = {
  url?: string;
  publishableKey?: string;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const serverErrorCodes = new Set<AnalysisErrorCode>([
  'configuration',
  'image',
  'invalid-response',
  'rate-limit',
  'unavailable',
  'not-found',
]);

function getEndpoint(config: AnalysisEndpointConfig, functionName: 'analyze-plant' | 'identify-plant') {
  const url = config.url?.trim().replace(/\/+$/, '');
  const publishableKey = config.publishableKey?.trim();
  if (!url || !publishableKey) throw new PlantAnalysisError('configuration');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new PlantAnalysisError('configuration');
  }
  return { endpoint: `${url}/functions/v1/${functionName}`, publishableKey };
}

export function createSupabasePhotoTransport<T>(
  config: AnalysisEndpointConfig,
  functionName: 'analyze-plant' | 'identify-plant',
  parse: (payload: unknown) => T,
  request: FetchLike = fetch,
) {
  return async (photo: Parameters<AnalysisTransport>[0], signal: AbortSignal) => {
    const { endpoint, publishableKey } = getEndpoint(config, functionName);
    const response = await request(endpoint, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64: photo.base64, mimeType: photo.mimeType }),
      signal,
    });
    const payload = await response.json().catch(() => null) as { text?: unknown; error?: unknown } | null;
    if (!response.ok) {
      if (typeof payload?.error === 'string' && serverErrorCodes.has(payload.error as AnalysisErrorCode)) {
        throw new PlantAnalysisError(payload.error as AnalysisErrorCode);
      }
      throw { status: response.status };
    }
    return parse(payload);
  };
}

export function createSupabaseAnalysisTransport(config: AnalysisEndpointConfig, request: FetchLike = fetch): AnalysisTransport {
  return createSupabasePhotoTransport(config, 'analyze-plant', (payload) => {
    const text = (payload as { text?: unknown } | null)?.text;
    if (typeof text !== 'string' || !text.trim()) throw new PlantAnalysisError('invalid-response');
    return text;
  }, request);
}
