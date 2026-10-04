import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { consumeQuota } from '../_shared/quota.ts';
import { FunctionError } from '../analyze-plant/core.ts';
import { IdentificationError, parseIdentificationRequest, requestPlantNet } from './core.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { ...cors, ...headers } });

const identify = withSupabase({ auth: 'publishable' }, async (request) => {
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, { Allow: 'POST, OPTIONS' });
  try {
    const apiKey = Deno.env.get('PLANTNET_API_KEY')?.trim();
    const salt = Deno.env.get('ANALYSIS_RATE_LIMIT_SALT')?.trim();
    if (!apiKey || !salt) throw new IdentificationError('configuration', 500);
    const contentLength = Number(request.headers.get('content-length'));
    if (contentLength > 8 * 1024 * 1024 + 1024) throw new IdentificationError('image', 413);
    const photo = parseIdentificationRequest(await request.json().catch(() => null));
    await consumeQuota(request, salt, 450);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (request.signal.aborted) abort();
    request.signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 25_000);
    try { return json(await requestPlantNet(photo, apiKey, controller.signal)); }
    finally { clearTimeout(timer); request.signal.removeEventListener('abort', abort); }
  } catch (error) {
    const safe = error instanceof IdentificationError || error instanceof FunctionError ? error : new IdentificationError('unavailable', 503);
    return json({ error: safe.code }, safe.status, safe.retryAfter ? { 'Retry-After': String(safe.retryAfter) } : {});
  }
});

export default { fetch(request: Request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  return identify(request);
} };
