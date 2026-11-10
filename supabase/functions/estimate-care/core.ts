// Pure logic for estimate-care: request validation, Gemini call and strict parsing.
// Only the species name ever leaves the server; no photo, no user data.

export type LightFit = 'ideal' | 'ok' | 'poor';
export type LightSpot = 'sun' | 'bright' | 'shade';

export type CareEstimateErrorCode = 'configuration' | 'invalid-request' | 'invalid-response' | 'rate-limit' | 'unavailable';

export class CareEstimateError extends Error {
  constructor(public readonly code: CareEstimateErrorCode, public readonly status: number, public readonly retryAfter?: number) {
    super(code);
    this.name = 'CareEstimateError';
  }
}

export type CareRequest = { scientificName: string; commonName?: string };

export type CareEstimatePayload =
  | { scientificName: string; known: true; wateringDays: { min: number; max: number }; lightFit: Record<LightSpot, LightFit>; model: string; generatedAt: string }
  | { scientificName: string; known: false; model: string; generatedAt: string };

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
export const MIN_WATERING_DAYS = 1;
export const MAX_WATERING_DAYS = 60;

const NAME_PATTERN = /^[\p{L}][\p{L}\s.'×-]*$/u;
const lightFits: readonly LightFit[] = ['ideal', 'ok', 'poor'];

function cleanName(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') return undefined;
  const name = value.normalize('NFC').replace(/\s+/g, ' ').trim();
  return name.length >= min && name.length <= max && NAME_PATTERN.test(name) ? name : undefined;
}

export function parseCareRequest(value: unknown): CareRequest {
  const body = value as { scientificName?: unknown; commonName?: unknown } | null;
  const scientificName = cleanName(body?.scientificName, 3, 120);
  if (!scientificName || scientificName.split(' ').length > 6) throw new CareEstimateError('invalid-request', 400);
  const commonName = body?.commonName === undefined ? undefined : cleanName(body.commonName, 1, 120);
  return commonName ? { scientificName, commonName } : { scientificName };
}

/** Cache key shared by every installation: one Gemini call per species, not per user. */
export function speciesKey(scientificName: string) {
  return scientificName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function buildCarePrompt(species: CareRequest) {
  const name = species.commonName ? `${species.scientificName} (nome popular: ${species.commonName})` : species.scientificName;
  return [
    `Espécie: ${name}.`,
    'Considere a planta cultivada em vaso, dentro de casa, em clima tropical ou subtropical.',
    'Responda com a faixa típica de dias entre regas (wateringDaysMin e wateringDaysMax, inteiros de 1 a 60) e quão adequado é cada local:',
    'lightSun = sol direto por parte do dia; lightBright = claridade perto de janela, sem sol direto; lightShade = pouca luz, longe de janelas.',
    'Use "ideal", "ok" ou "poor", com pelo menos um "ideal".',
    'Se você não reconhecer a espécie com segurança, responda known=false e não invente valores.',
  ].join('\n');
}

export const careResponseSchema = {
  type: 'OBJECT',
  properties: {
    known: { type: 'BOOLEAN' },
    wateringDaysMin: { type: 'INTEGER' },
    wateringDaysMax: { type: 'INTEGER' },
    lightSun: { type: 'STRING', enum: lightFits },
    lightBright: { type: 'STRING', enum: lightFits },
    lightShade: { type: 'STRING', enum: lightFits },
  },
  required: ['known'],
} as const;

function isDays(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_WATERING_DAYS && value <= MAX_WATERING_DAYS;
}

function isFit(value: unknown): value is LightFit {
  return lightFits.some((fit) => fit === value);
}

/** Validates the model output; anything outside the contract is rejected, never repaired. */
export function parseCareModelOutput(value: unknown): { known: false } | { known: true; wateringDays: { min: number; max: number }; lightFit: Record<LightSpot, LightFit> } {
  const data = value as Record<string, unknown> | null;
  if (!data || typeof data !== 'object' || typeof data.known !== 'boolean') throw new CareEstimateError('invalid-response', 502);
  if (!data.known) return { known: false };
  const { wateringDaysMin: min, wateringDaysMax: max, lightSun: sun, lightBright: bright, lightShade: shade } = data;
  if (!isDays(min) || !isDays(max) || min > max || !isFit(sun) || !isFit(bright) || !isFit(shade) ||
    ![sun, bright, shade].includes('ideal')) throw new CareEstimateError('invalid-response', 502);
  return { known: true, wateringDays: { min, max }, lightFit: { sun, bright, shade } };
}

export function extractGeminiText(value: unknown) {
  const parts = (value as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((part) => typeof part?.text === 'string' ? part.text : '').join('').trim() : '';
  if (!text) throw new CareEstimateError('invalid-response', 502);
  return text;
}

export function mapGeminiStatus(status: number) {
  if ([400, 401, 402, 403, 404].includes(status)) return new CareEstimateError('configuration', 500);
  if (status === 429) return new CareEstimateError('rate-limit', 429);
  return new CareEstimateError('unavailable', 503);
}

export async function requestCareEstimate(species: CareRequest, apiKey: string, model: string, signal: AbortSignal, request: typeof fetch = fetch, now = () => new Date()): Promise<CareEstimatePayload> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let output: unknown;
  try {
    const response = await request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildCarePrompt(species) }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: careResponseSchema },
      }),
      signal,
    });
    if (!response.ok) throw mapGeminiStatus(response.status);
    output = JSON.parse(extractGeminiText(await response.json()));
  } catch (error) {
    if (error instanceof CareEstimateError) throw error;
    if (error instanceof SyntaxError) throw new CareEstimateError('invalid-response', 502);
    // Never propagate the key, URL or provider body to the caller/logs.
    throw new CareEstimateError('unavailable', 503);
  }
  const parsed = parseCareModelOutput(output);
  return { scientificName: species.scientificName, ...parsed, model, generatedAt: now().toISOString() };
}

export type CareEstimateRow = {
  species_key: string;
  scientific_name: string;
  known: boolean;
  watering_min: number | null;
  watering_max: number | null;
  light_sun: LightFit | null;
  light_bright: LightFit | null;
  light_shade: LightFit | null;
  model: string;
  generated_at: string;
};

export function toCareEstimateRow(payload: CareEstimatePayload): CareEstimateRow {
  const known = payload.known;
  return {
    species_key: speciesKey(payload.scientificName),
    scientific_name: payload.scientificName,
    known,
    watering_min: known ? payload.wateringDays.min : null,
    watering_max: known ? payload.wateringDays.max : null,
    light_sun: known ? payload.lightFit.sun : null,
    light_bright: known ? payload.lightFit.bright : null,
    light_shade: known ? payload.lightFit.shade : null,
    model: payload.model,
    generated_at: payload.generatedAt,
  };
}

/** Cached rows are re-validated so a manual edit in the table can never reach the app malformed. */
export function fromCareEstimateRow(row: CareEstimateRow, scientificName: string): CareEstimatePayload {
  const base = { scientificName, model: row.model, generatedAt: row.generated_at };
  if (!row.known) return { ...base, known: false };
  const parsed = parseCareModelOutput({
    known: true, wateringDaysMin: row.watering_min, wateringDaysMax: row.watering_max,
    lightSun: row.light_sun, lightBright: row.light_bright, lightShade: row.light_shade,
  });
  if (!parsed.known) throw new CareEstimateError('invalid-response', 502);
  return { ...base, ...parsed };
}
