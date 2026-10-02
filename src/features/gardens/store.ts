import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { plantPhotos } from './photoStorage';
import { createGardensStore } from './storeCore';
import type { GardenDetails, GardenSummary } from './types';

const store = createGardensStore(AsyncStorage, plantPhotos);

export const hydrateGardensStore = store.hydrate;
export const createGarden = store.createGarden;
export const addPlantToGarden = store.addPlantToGarden;
export const addAnalyzedPlantToGarden = store.addAnalyzedPlantToGarden;
export const updatePlantAnalysis = store.updatePlantAnalysis;

function toSummary(garden: GardenDetails): GardenSummary {
  const { averageHydration: _averageHydration, plants: _plants, ...summary } = garden;
  return { ...summary, imageUrl: plantPhotos.resolve(summary.imageUrl) };
}

export function useGardensState() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useGardenSummaries() {
  return useGardensState().gardens.map(toSummary);
}

export function useGardenDetails(id?: string) {
  const garden = useGardensState().gardens.find((item) => item.id === id);
  if (!garden) return undefined;
  return {
    ...garden,
    plants: garden.plants.map((plant) => ({
      ...plant,
      imageUrl: plantPhotos.resolve(plant.imageUrl),
      lastAnalyzedPhotoUri: plant.lastAnalyzedPhotoUri ? plantPhotos.resolve(plant.lastAnalyzedPhotoUri) : undefined,
    })),
  };
}
