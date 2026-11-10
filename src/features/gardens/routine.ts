import { calendarDaysBetween, getWateringPlan } from './watering';
import type { GardenPlant, PlantCareRecord } from './types';

export const ROUTINE_WINDOW_DAYS = 30;

export type RoutineStatus =
  | { state: 'none'; level: 0 }
  | { state: 'good' | 'fair' | 'behind'; level: number; onTimeDays: number; trackedDays: number };

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Share of the last days (since the first watering, up to 30) in which watering was within the
 * chosen frequency. Built only from the user's own records; never a health reading.
 */
export function getRoutineStatus(plant: GardenPlant, now = new Date()): RoutineStatus {
  const plan = getWateringPlan(plant);
  const today = startOfLocalDay(now);
  const waterDays = plant.history
    .filter((entry): entry is PlantCareRecord => entry.kind === 'care' && entry.careType === 'water')
    .map((entry) => calendarDaysBetween(today, new Date(entry.occurredAt)))
    .filter((offset) => offset <= 0)
    .sort((a, b) => a - b);
  if (!plan || !waterDays.length) return { state: 'none', level: 0 };

  const firstTracked = Math.max(waterDays[0], -(ROUTINE_WINDOW_DAYS - 1));
  let onTimeDays = 0;
  let trackedDays = 0;
  let pointer = 0;
  let lastWatered = waterDays[0];
  for (let day = firstTracked; day <= 0; day++) {
    while (pointer < waterDays.length && waterDays[pointer] <= day) lastWatered = waterDays[pointer++];
    trackedDays++;
    if (day - lastWatered <= plan.intervalDays) onTimeDays++;
  }
  const level = onTimeDays / trackedDays;
  return { state: level >= 0.9 ? 'good' : level >= 0.6 ? 'fair' : 'behind', level, onTimeDays, trackedDays };
}

export function describeRoutineStatus(status: RoutineStatus) {
  if (status.state === 'none') return 'Comece pela rega';
  if (status.state === 'good') return 'Rotina em dia';
  if (status.state === 'fair') return 'Quase em dia';
  return 'Rotina atrasada';
}

export function describeRoutineDetail(status: RoutineStatus) {
  if (status.state === 'none') return 'Com a frequência de rega e a primeira rega registrada, acompanhamos como está a rotina.';
  const days = status.trackedDays === 1 ? 'dia' : 'dias';
  return status.onTimeDays + ' de ' + status.trackedDays + ' ' + days + ' com a rega em dia';
}
