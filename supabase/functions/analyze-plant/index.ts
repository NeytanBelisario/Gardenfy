import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { createClient } from '@supabase/supabase-js';

import {
  FunctionError,
  extractGeminiText,
  getClientAddress,
  hashQuotaKey,
  mapGeminiStatus,
  parseAnalysisRequest,
} from './core.ts';

const prompt = `Analise uma foto de uma única planta. Identificação e indicadores são estimativas visuais, não medições de sensores. Se não houver planta ou não for possível analisar, não invente dados.
Retorne exatamente seis linhas, sem Markdown ou comentários:
Nome: [nome comum mais provável em português]
Saude: [Excelente, Boa, Regular, Ruim ou Critica]
Vitalidade: [inteiro de 0 a 100]%
Rega: [inteiro de 0 a 10]
Luz: [inteiro de 0 a 10]
Crescimento: [inteiro de dias estimados]
Rega e Luz representam estimativas visuais de água e exposição à luz de 0 (mínimo) a 10 (máximo), sem afirmar medições reais. Use apenas um nome comum; não inclua o científico entre parênteses.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...corsHeaders, ...headers } });
}

function getSecretKey() {
  const namedKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (namedKeys) {
    try {
      const keys = Object.values(JSON.parse(namedKeys));
      if (typeof keys[0] === 'string' && keys[0]) return keys[0];
    } catch {
      // The configuration error below is intentionally generic.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

async function consumeQuota(request: Request, salt: string) {
  const url = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();
  if (!url || !secretKey) throw new FunctionError('configuration', 500);
  const clientHash = await hashQuotaKey(getClientAddress(request), salt);
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc('consume_analysis_quota', {
    p_client_hash: clientHash,
    p_limit: 10,
    p_window_seconds: 3600,
  });
  if (error) {
    console.error('Analysis quota check failed', error.code);
    throw new FunctionError('unavailable', 503);
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result.allowed !== 'boolean') throw new FunctionError('unavailable', 503);
  if (!result.allowed) {
    const retryAfter = Number.isInteger(result.retry_after_seconds) ? result.retry_after_seconds : 3600;
    throw new FunctionError('rate-limit', 429, Math.max(1, retryAfter));
  }
}

async function callGemini(base64: string, mimeType: string, apiKey: string, model: string, requestSignal: AbortSignal) {
  if (!/^[A-Za-z0-9._-]+$/.test(model)) throw new FunctionError('configuration', 500);
  const controller = new AbortController();
  const abort = () => controller.abort();
  requestSignal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 25_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { data: base64, mime_type: mimeType } }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error('Analysis provider response failed', { status: response.status, model });
      throw mapGeminiStatus(response.status);
    }
    return extractGeminiText(await response.json());
  } catch (error) {
    if (error instanceof FunctionError) throw error;
    console.error('Analysis provider transport failed', {
      model,
      aborted: controller.signal.aborted,
      name: error instanceof Error ? error.name : 'unknown',
    });
    throw new FunctionError('unavailable', 503);
  } finally {
    clearTimeout(timer);
    requestSignal.removeEventListener('abort', abort);
  }
}

const analyze = withSupabase({ auth: 'publishable' }, async (request) => {
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, { Allow: 'POST, OPTIONS' });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    const salt = Deno.env.get('ANALYSIS_RATE_LIMIT_SALT')?.trim();
    const model = Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-3.5-flash-lite';
    if (!apiKey || !salt) throw new FunctionError('configuration', 500);
    const photo = parseAnalysisRequest(await request.json().catch(() => null));
    await consumeQuota(request, salt);
    const text = await callGemini(photo.base64, photo.mimeType, apiKey, model, request.signal);
    return json({ text });
  } catch (error) {
    if (!(error instanceof FunctionError)) {
      console.error('Analysis unexpected failure', error instanceof Error ? error.name : 'unknown');
    }
    const safe = error instanceof FunctionError ? error : new FunctionError('unavailable', 503);
    const headers = safe.retryAfter ? { 'Retry-After': String(safe.retryAfter) } : {};
    return json({ error: safe.code }, safe.status, headers);
  }
});

export default {
  fetch(request: Request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    return analyze(request);
  },
};
