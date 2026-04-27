import { useSyncExternalStore } from 'react';

import {
  CreateGardenDraft,
  GardenDetails,
  GardenPlant,
  GardenSummary,
  PlantAnalysisResult,
  PlantCatalogItem,
  PlantHealthTone,
} from './types';

type GardensState = {
  gardens: GardenDetails[];
};

type GardenCreateInput = CreateGardenDraft & {
  imageUrl: string;
};

let state: GardensState = {
  gardens: [],
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function initializeGardensStore(initialGardens: GardenDetails[]) {
  if (state.gardens.length > 0) {
    return;
  }

  state = {
    gardens: initialGardens,
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function toSummary(garden: GardenDetails): GardenSummary {
  const { averageHydration: _averageHydration, plants: _plants, ...summary } = garden;
  return summary;
}

function buildPlaceholderPlant(item: PlantCatalogItem): GardenPlant {
  return {
    id: `plant-${item.id}-${Date.now()}`,
    name: item.name,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    status: {
      label: 'Unknown',
      tone: 'stable',
    },
    metrics: [
      {
        kind: 'light',
        label: 'Light',
        value: 0,
      },
      {
        kind: 'water',
        label: 'Water',
        value: 0,
      },
    ],
  };
}

function buildAnalyzedPlant(analysis: PlantAnalysisResult, photoUri: string): GardenPlant {
  return {
    id: `plant-scan-${Date.now()}`,
    name: analysis.plantName || 'Planta identificada',
    subtitle: 'Identificada pela camera',
    imageUrl: photoUri,
    identifiedName: analysis.plantName,
    lastAnalyzedPhotoUri: photoUri,
    lastAnalyzedAt: new Date().toISOString(),
    vitality: clampPercent(analysis.vitality),
    growthDays: analysis.growthDays,
    status: {
      label: analysis.health,
      tone: healthTone(analysis.health),
    },
    metrics: [
      {
        kind: 'light',
        label: 'Light',
        value: clampPercent(analysis.light * 10),
      },
      {
        kind: 'water',
        label: 'Water',
        value: clampPercent(analysis.water * 10),
      },
    ],
  };
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return clampPercent(
    values.reduce((total, value) => total + value, 0) / values.length
  );
}

function healthTone(health: PlantAnalysisResult['health']): PlantHealthTone {
  if (health === 'Ruim' || health === 'Critica') {
    return 'dry';
  }

  if (health === 'Excelente') {
    return 'vital';
  }

  return 'stable';
}

function recalculateGardenStats(garden: GardenDetails): GardenDetails {
  const analyzedPlants = garden.plants.filter((plant) => typeof plant.vitality === 'number');
  const waterValues = garden.plants
    .map((plant) => plant.metrics.find((metric) => metric.kind === 'water')?.value)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const lightValues = garden.plants
    .map((plant) => plant.metrics.find((metric) => metric.kind === 'light')?.value)
    .filter((value): value is number => typeof value === 'number' && value > 0);

  const vitality = average(
    analyzedPlants.map((plant) => plant.vitality).filter((value): value is number => typeof value === 'number')
  );
  const averageHydration = average(waterValues);
  const averageLight = average(lightValues);

  return {
    ...garden,
    plantCount: garden.plants.length,
    vitality,
    averageHydration,
    metrics: garden.metrics.map((metric) => {
      if (metric.kind === 'water') {
        return { ...metric, value: averageHydration };
      }

      return { ...metric, value: averageLight };
    }),
  };
}

export function createMockGarden(input: GardenCreateInput) {
  const nextId = `garden-${Date.now()}`;

  const nextGarden: GardenDetails = {
    id: nextId,
    name: input.name.trim() || 'Novo Jardim',
    label: input.environment === 'indoor' ? 'Indoor Garden' : 'Outdoor Garden',
    plantCount: 0,
    vitality: 0,
    averageHydration: 0,
    environment: input.environment,
    imageUrl: input.imageUrl,
    icon: input.icon,
    metrics: [
      {
        kind: 'light',
        label: 'Light',
        value: 0,
      },
      {
        kind: 'water',
        label: 'Water',
        value: 0,
      },
    ],
    plants: [],
  };

  state = {
    gardens: [nextGarden, ...state.gardens],
  };
  emitChange();

  return nextGarden;
}

export function addPlantToGarden(gardenId: string, item: PlantCatalogItem) {
  state = {
    gardens: state.gardens.map((garden) => {
      if (garden.id !== gardenId) {
        return garden;
      }

      const nextPlants = [...garden.plants, buildPlaceholderPlant(item)];

      return recalculateGardenStats({
        ...garden,
        plants: nextPlants,
      });
    }),
  };
  emitChange();
}

export function addAnalyzedPlantToGarden(
  gardenId: string,
  analysis: PlantAnalysisResult,
  photoUri: string
) {
  state = {
    gardens: state.gardens.map((garden) => {
      if (garden.id !== gardenId) {
        return garden;
      }

      return recalculateGardenStats({
        ...garden,
        plants: [...garden.plants, buildAnalyzedPlant(analysis, photoUri)],
      });
    }),
  };
  emitChange();
}

export function updatePlantAnalysis(
  gardenId: string,
  plantId: string,
  analysis: PlantAnalysisResult,
  photoUri?: string
) {
  state = {
    gardens: state.gardens.map((garden) => {
      if (garden.id !== gardenId) {
        return garden;
      }

      const nextPlants = garden.plants.map((plant) => {
        if (plant.id !== plantId) {
          return plant;
        }

        const nextPlant: GardenPlant = {
          ...plant,
          imageUrl: photoUri ?? plant.imageUrl,
          identifiedName: analysis.plantName,
          lastAnalyzedPhotoUri: photoUri ?? plant.lastAnalyzedPhotoUri,
          lastAnalyzedAt: new Date().toISOString(),
          vitality: clampPercent(analysis.vitality),
          growthDays: analysis.growthDays,
          status: {
            label: analysis.health,
            tone: healthTone(analysis.health),
          },
          metrics: [
            {
              kind: 'light',
              label: 'Light',
              value: clampPercent(analysis.light * 10),
            },
            {
              kind: 'water',
              label: 'Water',
              value: clampPercent(analysis.water * 10),
            },
          ],
        };

        return nextPlant;
      });

      return recalculateGardenStats({
        ...garden,
        plants: nextPlants,
      });
    }),
  };
  emitChange();
}

export function useGardenSummaries() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snapshot.gardens.map(toSummary);
}

export function useGardenDetails(id?: string) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return snapshot.gardens.find((garden) => garden.id === id);
}
