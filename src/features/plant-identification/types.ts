export type PlantCandidate = {
  scientificName: string;
  commonName: string;
  confidence: number;
};

export type PlantSpecies = {
  scientificName: string;
  commonName: string;
  source: 'catalog' | 'plantnet';
  confidence?: number;
  identifiedAt?: string;
};

export function isPlantCandidate(value: unknown): value is PlantCandidate {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.scientificName === 'string' && candidate.scientificName.trim().length > 0 && candidate.scientificName.length <= 200 &&
    typeof candidate.commonName === 'string' && candidate.commonName.trim().length > 0 && candidate.commonName.length <= 200 &&
    typeof candidate.confidence === 'number' && Number.isFinite(candidate.confidence) && candidate.confidence >= 0 && candidate.confidence <= 1;
}
