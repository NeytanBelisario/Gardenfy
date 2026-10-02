import { PlantAnalysisError, type AnalysisErrorCode } from './analysisErrors';
import type { AnalysisTransport } from './analysisService';

type AnalysisEndpointConfig = {
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
]);

function getEndpoint(config: AnalysisEndpointConfig) {
  const url = config.url?.trim().replace(/\/+$/, '');
  const publishableKey = config.publishableKey?.trim();
  if (!url || !publishableKey) throw new PlantAnalysisError('configuration');
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new PlantAnalysisError('configuration');
  }
  return { endpoint: `${url}/functions/v1/analyze-plant`, publishableKey };
}

export function createSupabaseAnalysisTransport(
  config: AnalysisEndpointConfig,
  request: FetchLike = fetch,
): AnalysisTransport {
  return async (photo, signal) => {
    const { endpoint, publishableKey } = getEndpoint(config);
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
    if (typeof payload?.text !== 'string' || !payload.text.trim()) {
      throw new PlantAnalysisError('invalid-response');
    }
    return payload.text;
  };
}
