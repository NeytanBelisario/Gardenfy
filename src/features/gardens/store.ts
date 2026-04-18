import { useSyncExternalStore } from 'react';

import {
  CreateGardenDraft,
  GardenDetails,
  GardenPlant,
  GardenSummary,
  PlantCatalogItem,
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

      return {
        ...garden,
        plants: nextPlants,
        plantCount: nextPlants.length,
      };
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
