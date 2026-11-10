import { calendarDaysBetween, getWateringPlan } from './watering';
import type { GardenDetails, PlantCareRecord } from './types';

/** How far back the best streak is searched. */
export const STREAK_LOOKBACK_DAYS = 365;

export type StreakStatus = {
  /** Consecutive days, ending today, with no tracked plant late on watering. */
  current: number;
  best: number;
  /** Plants with a watering frequency and at least one watering. */
  trackedPlants: number;
  /** Names of plants late today, which break the streak. */
  lateToday: string[];
};

type TrackedPlant = { name: string; interval: number; waterDays: number[] };

/**
 * Derived from the care history only, so editing or deleting a record fixes the streak by itself.
 * A day counts when every plant already being tracked was within its watering frequency.
 */
export function getStreak(gardens: GardenDetails[], now = new Date()): StreakStatus {
  const tracked: TrackedPlant[] = [];
  for (const plant of gardens.flatMap((garden) => garden.plants)) {
    const plan = getWateringPlan(plant);
    const waterDays = plant.history
      .filter((entry): entry is PlantCareRecord => entry.kind === 'care' && entry.careType === 'water')
      .map((entry) => calendarDaysBetween(now, new Date(entry.occurredAt)))
      .filter((offset) => offset <= 0)
      .sort((a, b) => a - b);
    if (plan && waterDays.length) tracked.push({ name: plant.name, interval: plan.intervalDays, waterDays });
  }
  if (!tracked.length) return { current: 0, best: 0, trackedPlants: 0, lateToday: [] };

  const start = Math.max(Math.min(...tracked.map((plant) => plant.waterDays[0])), -STREAK_LOOKBACK_DAYS);
  const pointers = tracked.map(() => 0);
  const last = tracked.map(() => Number.NEGATIVE_INFINITY);
  let run = 0;
  let best = 0;
  let lateToday: string[] = [];
  for (let day = start; day <= 0; day++) {
    const late: string[] = [];
    tracked.forEach((plant, index) => {
      while (pointers[index] < plant.waterDays.length && plant.waterDays[pointers[index]] <= day) last[index] = plant.waterDays[pointers[index]++];
      if (last[index] !== Number.NEGATIVE_INFINITY && day - last[index] > plant.interval) late.push(plant.name);
    });
    run = late.length ? 0 : run + 1;
    best = Math.max(best, run);
    if (day === 0) lateToday = late;
  }
  return { current: run, best, trackedPlants: tracked.length, lateToday };
}

export function describeStreak(days: number) {
  return days === 1 ? '1 dia seguido' : days + ' dias seguidos';
}
