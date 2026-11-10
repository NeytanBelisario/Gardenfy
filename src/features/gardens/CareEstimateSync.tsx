import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { ENV } from '../../constants/env';
import { plantSpeciesName } from './careEstimate';
import { careSpeciesKey, createCareEstimateClient, speciesNeedingEstimates, CareEstimateClientError } from './careEstimateService';
import { applyCareEstimate, getGardensSnapshot, useGardensState } from './store';
import type { GardenPlant } from './types';

export type CareEstimateStatus = 'loading' | 'failed';

const requestEstimate = createCareEstimateClient({ url: ENV.supabaseUrl, publishableKey: ENV.supabasePublishableKey });

// Session-only status: which species are being looked up or failed this time.
const statuses = new Map<string, CareEstimateStatus>();
const listeners = new Set<() => void>();
let version = 0;
let disabled = false;

function setStatus(key: string, status: CareEstimateStatus | undefined) {
  if (status) statuses.set(key, status); else statuses.delete(key);
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Status of the AI lookup for this plant's species, while it has no reference yet. */
export function useCareEstimateStatus(plant: GardenPlant | undefined): CareEstimateStatus | undefined {
  useSyncExternalStore(subscribe, () => version, () => version);
  const species = plant ? plantSpeciesName(plant) : undefined;
  return species ? statuses.get(careSpeciesKey(species)) : undefined;
}

const TIMEOUT_MS = 20_000;
let running = false;

/** Works through the species missing a reference, one request at a time, always from the latest gardens. */
async function runQueue() {
  if (running || disabled) return;
  running = true;
  try {
    while (!disabled) {
      const snapshot = getGardensSnapshot();
      if (snapshot.status !== 'ready') return;
      const next = speciesNeedingEstimates(snapshot.gardens).find((species) => !statuses.has(careSpeciesKey(species.scientificName)));
      if (!next) return;
      const key = careSpeciesKey(next.scientificName);
      setStatus(key, 'loading');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        await applyCareEstimate(await requestEstimate(next, controller.signal));
        setStatus(key, undefined);
      } catch (error) {
        setStatus(key, 'failed');
        const code = error instanceof CareEstimateClientError ? error.code : undefined;
        // Not deployed or misconfigured: stop for this session instead of trying every species.
        if (code === 'configuration') disabled = true;
        // Offline or limit reached: wait for the app to come back to the foreground.
        if (code === 'rate-limit' || code === 'network') return;
      } finally {
        clearTimeout(timer);
      }
    }
  } finally {
    running = false;
  }
}

/** Fetches AI care references for plants whose species has no curated profile. */
export function CareEstimateSync() {
  const { gardens, status } = useGardensState();
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      for (const [key, value] of [...statuses]) if (value === 'failed') setStatus(key, undefined);
      setForegroundTick((tick) => tick + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (status === 'ready') void runQueue();
  }, [gardens, status, foregroundTick]);

  return null;
}
