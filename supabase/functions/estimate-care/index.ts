import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { consumeQuota, createAdminClient } from '../_shared/quota.ts';
import { FunctionError } from '../_shared/core.ts';
import {
  CareEstimateError,
  DEFAULT_GEMINI_MODEL,
  fromCareEstimateRow,
  parseCareRequest,
  requestCareEstimate,
  speciesKey,
  toCareEstimateRow,
  type CareEstimateRow,
} from './core.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { ...cors, ...headers } });

// Below the Flash-Lite free daily quota; the shared cache keeps real usage far lower.
const GEMINI_DAILY_BUDGET = 400;

const estimate = withSupabase({ auth: 'publishable' }, async (request) => {
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, { Allow: 'POST, OPTIONS' });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    const salt = Deno.env.get('ANALYSIS_RATE_LIMIT_SALT')?.trim();
    const model = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_GEMINI_MODEL;
    if (!apiKey || !salt) throw new CareEstimateError('configuration', 500);
    if (Number(request.headers.get('content-length')) > 4096) throw new CareEstimateError('invalid-request', 413);
    const species = parseCareRequest(await request.json().catch(() => null));
    const admin = createAdminClient();
    const key = speciesKey(species.scientificName);

    const cached = await admin.from('care_estimates').select('*').eq('species_key', key).maybeSingle<CareEstimateRow>();
    if (cached.error) throw new CareEstimateError('unavailable', 503);
    if (cached.data) {
      try { return json(fromCareEstimateRow(cached.data, species.scientificName)); }
      catch { /* A malformed cached row is replaced by a fresh estimate below. */ }
    }

    await consumeQuota(request, salt, { scope: 'care', perClientLimit: 30, dailyBudget: { key: 'gemini-global', limit: GEMINI_DAILY_BUDGET } });
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (request.signal.aborted) abort();
    request.signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 20_000);
    try {
      const payload = await requestCareEstimate(species, apiKey, model, controller.signal);
      // Caching is best effort: a failed write only means the next request asks Gemini again.
      await admin.from('care_estimates').upsert(toCareEstimateRow(payload), { onConflict: 'species_key' });
      return json(payload);
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener('abort', abort);
    }
  } catch (error) {
    const safe = error instanceof CareEstimateError || error instanceof FunctionError ? error : new CareEstimateError('unavailable', 503);
    return json({ error: safe.code }, safe.status, safe.retryAfter ? { 'Retry-After': String(safe.retryAfter) } : {});
  }
});

export default { fetch(request: Request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  return estimate(request);
} };
