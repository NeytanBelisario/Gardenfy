import { getPlantCareProfile, normalizePlantName, type LightFit } from './careProfiles';
import type { GardenPlant, PlantLightSpot } from './types';

/**
 * AI reference for a species (Gemini, via the estimate-care function). It is a starting point
 * for species without a curated profile, never a measurement of the plant or its soil.
 */
export type CareEstimate =
  | { source: 'ai'; scientificName: string; known: true; wateringDays: { min: number; max: number }; lightFit: Record<PlantLightSpot, LightFit>; model: string; generatedAt: string }
  | { source: 'ai'; scientificName: string; known: false; model: string; generatedAt: string };

/** Where the species reference used by the meters comes from. */
export type CareReferenceSource = 'profile' | 'ai';

export type CareReference = {
  source: CareReferenceSource;
  wateringDays: { min: number; max: number };
  lightFit: Record<PlantLightSpot, LightFit>;
};

const fits: readonly LightFit[] = ['ideal', 'ok', 'poor'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDays(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 60;
}

function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function isCareEstimate(value: unknown): value is CareEstimate {
  if (!isRecord(value) || value.source !== 'ai' || !isText(value.scientificName, 120) || !isText(value.model, 80) ||
    !isText(value.generatedAt, 40) || !Number.isFinite(Date.parse(value.generatedAt))) return false;
  if (value.known === false) return value.wateringDays === undefined && value.lightFit === undefined;
  if (value.known !== true || !isRecord(value.wateringDays) || !isRecord(value.lightFit)) return false;
  const { min, max } = value.wateringDays;
  const light = value.lightFit;
  const spots = ['sun', 'bright', 'shade'] as const;
  return isDays(min) && isDays(max) && min <= max &&
    spots.every((spot) => fits.some((fit) => fit === light[spot])) && spots.some((spot) => light[spot] === 'ideal');
}

/** Parses the estimate-care response; anything outside the contract is rejected. */
export function parseCareEstimatePayload(payload: unknown): CareEstimate {
  const candidate = isRecord(payload) ? { ...payload, source: 'ai' } : payload;
  if (!isCareEstimate(candidate)) throw new Error('invalid-response');
  return candidate;
}

export function sameSpecies(a: string, b: string) {
  return normalizePlantName(a) === normalizePlantName(b);
}

/** The scientific name an estimate can be asked for: only a species the user confirmed. */
export function plantSpeciesName(plant: GardenPlant) {
  return plant.species?.scientificName.trim() || undefined;
}

/** The stored estimate, only while it still matches the plant's current species. */
export function currentCareEstimate(plant: GardenPlant) {
  const species = plantSpeciesName(plant);
  return plant.careEstimate && species && sameSpecies(plant.careEstimate.scientificName, species) ? plant.careEstimate : undefined;
}

/** Priority: curated profile first, then the AI estimate. User overrides are applied by each meter. */
export function getCareReference(plant: GardenPlant): CareReference | undefined {
  const profile = getPlantCareProfile(plant);
  if (profile) return { source: 'profile', wateringDays: profile.wateringDays, lightFit: profile.lightFit };
  const estimate = currentCareEstimate(plant);
  return estimate?.known ? { source: 'ai', wateringDays: estimate.wateringDays, lightFit: estimate.lightFit } : undefined;
}

export function needsCareEstimate(plant: GardenPlant) {
  return !!plantSpeciesName(plant) && !getPlantCareProfile(plant) && !currentCareEstimate(plant);
}
