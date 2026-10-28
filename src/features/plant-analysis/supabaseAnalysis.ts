import { PlantAnalysisError, type AnalysisErrorCode } from './analysisErrors';
import type { AnalysisPhoto } from './analysisService';

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

function getEndpoint(config: AnalysisEndpointConfig, functionName: 'identify-plant') {
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
  functionName: 'identify-plant',
  parse: (payload: unknown) => T,
  request: FetchLike = fetch,
) {
  return async (photo: AnalysisPhoto, signal: AbortSignal) => {
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
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    if (!response.ok) {
      if (typeof payload?.error === 'string' && serverErrorCodes.has(payload.error as AnalysisErrorCode)) {
        throw new PlantAnalysisError(payload.error as AnalysisErrorCode);
      }
      throw { status: response.status };
    }
    return parse(payload);
  };
}
