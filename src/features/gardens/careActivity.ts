import type { GardenDetails, GardenPlant, PlantCareRecord, PlantCareType } from './types';

export function lastPlantCare(plant: GardenPlant, type?: PlantCareType): PlantCareRecord | undefined {
  return plant.history.filter((entry): entry is PlantCareRecord => entry.kind === 'care' && (!type || entry.careType === type))
    .reduce<PlantCareRecord | undefined>((latest, entry) => !latest || entry.occurredAt > latest.occurredAt ? entry : latest, undefined);
}

export function gardenCareCount(garden: GardenDetails) {
  return garden.plants.reduce((total, plant) => total + plant.history.filter((entry) => entry.kind === 'care').length, 0);
}

export function formatCareDay(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
