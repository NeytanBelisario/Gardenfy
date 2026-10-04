import { createClient } from '@supabase/supabase-js';
import { FunctionError, getClientAddress, hashQuotaKey } from '../analyze-plant/core.ts';

function getSecretKey() {
  const namedKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (namedKeys) {
    try {
      const keys = Object.values(JSON.parse(namedKeys));
      if (typeof keys[0] === 'string' && keys[0]) return keys[0];
    } catch { /* Fall through to the generic configuration check. */ }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

export async function consumeQuota(request: Request, salt: string, dailyBudget?: number) {
  const url = Deno.env.get('SUPABASE_URL');
  const secret = getSecretKey();
  if (!url || !secret) throw new FunctionError('configuration', 500);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  async function consume(key: string, limit: number, seconds: number) {
    const { data, error } = await admin.rpc('consume_analysis_quota', {
      p_client_hash: await hashQuotaKey(key, salt), p_limit: limit, p_window_seconds: seconds,
    });
    if (error) throw new FunctionError('unavailable', 503);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result.allowed !== 'boolean') throw new FunctionError('unavailable', 503);
    if (!result.allowed) throw new FunctionError('rate-limit', 429, Math.max(1, Number.isInteger(result.retry_after_seconds) ? result.retry_after_seconds : seconds));
  }
  await consume(getClientAddress(request), 10, 3600);
  // A single UTC day budget across installations leaves margin below the free provider quota.
  if (dailyBudget) await consume(`plantnet-global:${new Date().toISOString().slice(0, 10)}`, dailyBudget, 86400);
}
