import type { GardenDetails, GardenPlant, PlantAnalysisResult, PlantCatalogItem, PlantHealthTone } from './types';
import { createId } from './ids';
import { buildAnalysisRecord } from './plantHistory';

export function buildPlaceholderPlant(item: PlantCatalogItem): GardenPlant {
  return {
    id: createId('plant'),
    name: item.name,
    subtitle: item.subtitle,
    imageUrl: item.imageUrl,
    status: {
      label: 'Sem análise',
      tone: 'stable',
    },
    history: [],
    metrics: [
      {
        kind: 'light',
        label: 'Luz',
        value: null,
      },
      {
        kind: 'water',
        label: 'Água',
        value: null,
      },
    ],
  };
}

export function buildAnalyzedPlant(analysis: PlantAnalysisResult, photoUri: string): GardenPlant {
  const plant: GardenPlant = {
    id: createId('plant'),
    history: [],
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
        label: 'Luz',
        value: clampPercent(analysis.light * 10),
      },
      {
        kind: 'water',
        label: 'Água',
        value: clampPercent(analysis.water * 10),
      },
    ],
  };
  plant.history = [buildAnalysisRecord(plant, createId('analysis'))];
  return plant;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
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

export function recalculateGardenStats(garden: GardenDetails): GardenDetails {
  const analyzedPlants = garden.plants.filter((plant) => typeof plant.vitality === 'number');
  const waterValues = garden.plants
    .map((plant) => plant.metrics.find((metric) => metric.kind === 'water')?.value)
    .filter((value): value is number => typeof value === 'number');
  const lightValues = garden.plants
    .map((plant) => plant.metrics.find((metric) => metric.kind === 'light')?.value)
    .filter((value): value is number => typeof value === 'number');

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
