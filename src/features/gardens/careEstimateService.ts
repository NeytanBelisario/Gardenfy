import { normalizePlantName } from './careProfiles';
import { needsCareEstimate, parseCareEstimatePayload, type CareEstimate } from './careEstimate';
import type { GardenDetails } from './types';

export type CareEstimateRequest = { scientificName: string; commonName?: string };

export type CareEstimateErrorCode = 'configuration' | 'invalid-request' | 'invalid-response' | 'rate-limit' | 'unavailable' | 'network';

export class CareEstimateClientError extends Error {
  constructor(public readonly code: CareEstimateErrorCode) {
    super(code);
    this.name = 'CareEstimateClientError';
  }
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const serverCodes = new Set<CareEstimateErrorCode>(['configuration', 'invalid-request', 'invalid-response', 'rate-limit', 'unavailable']);

export function createCareEstimateClient(config: { url?: string; publishableKey?: string }, request: FetchLike = fetch) {
  return async (species: CareEstimateRequest, signal?: AbortSignal): Promise<CareEstimate> => {
    const url = config.url?.trim().replace(/\/+$/, '');
    const publishableKey = config.publishableKey?.trim();
    if (!url || !publishableKey || !/^https?:\/\//.test(url)) throw new CareEstimateClientError('configuration');
    let response: Response;
    try {
      response = await request(`${url}/functions/v1/estimate-care`, {
        method: 'POST',
        headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
        // Only the species name goes to the server.
        body: JSON.stringify(species.commonName ? { scientificName: species.scientificName, commonName: species.commonName } : { scientificName: species.scientificName }),
        signal,
      });
    } catch {
      throw new CareEstimateClientError('network');
    }
    const payload = await response.json().catch(() => null) as { error?: unknown } | null;
    if (!response.ok) {
      const code = typeof payload?.error === 'string' && serverCodes.has(payload.error as CareEstimateErrorCode) ? payload.error as CareEstimateErrorCode : 'unavailable';
      throw new CareEstimateClientError(code);
    }
    try {
      const estimate = parseCareEstimatePayload(payload);
      if (normalizePlantName(estimate.scientificName) !== normalizePlantName(species.scientificName)) throw new Error('mismatch');
      return estimate;
    } catch {
      throw new CareEstimateClientError('invalid-response');
    }
  };
}

export function careSpeciesKey(scientificName: string) {
  return normalizePlantName(scientificName);
}

/** Distinct species, across all gardens, that have no curated profile and no estimate yet. */
export function speciesNeedingEstimates(gardens: GardenDetails[]): CareEstimateRequest[] {
  const found = new Map<string, CareEstimateRequest>();
  for (const garden of gardens) {
    for (const plant of garden.plants) {
      if (!needsCareEstimate(plant) || !plant.species) continue;
      const key = careSpeciesKey(plant.species.scientificName);
      if (!found.has(key)) found.set(key, { scientificName: plant.species.scientificName.trim(), commonName: plant.species.commonName.trim() || undefined });
    }
  }
  return [...found.values()];
}
