import { GardenPlant, PlantAnalysisResult } from '../gardens/types';

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function plantMatchesCatalogChoice(
  plant: Pick<GardenPlant, 'name' | 'subtitle'>,
  analysis: PlantAnalysisResult
) {
  const expectedNames = [plant.name, plant.subtitle]
    .map(normalizeName)
    .filter(Boolean);
  const scannedName = normalizeName(analysis.plantName);

  if (!scannedName || expectedNames.length === 0) {
    return true;
  }

  return expectedNames.some(
    (expectedName) =>
      expectedName.includes(scannedName) || scannedName.includes(expectedName)
  );
}
