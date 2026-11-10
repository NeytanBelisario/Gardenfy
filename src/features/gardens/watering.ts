import { lastPlantCare } from './careActivity';
import { getCareReference, type CareReferenceSource } from './careEstimate';
import type { GardenPlant } from './types';

export type WateringPlan =
  | { source: 'custom'; intervalDays: number; reference?: { min: number; max: number }; referenceSource?: CareReferenceSource }
  | { source: 'species'; intervalDays: number; reference: { min: number; max: number }; referenceSource: CareReferenceSource };

/** 'unknown' = no frequency to compare with; 'never' = frequency known, no watering registered yet. */
export type WaterState = 'unknown' | 'never' | 'ok' | 'soon' | 'due' | 'overdue';

export type WaterStatus = {
  state: WaterState;
  plan?: WateringPlan;
  lastWateredAt?: string;
  daysSince?: number;
  /** Days until the next watering; negative when late. */
  daysUntil?: number;
  /** 1 = just watered, 0 = due or late. Calendar estimate, never a soil reading. */
  level: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function calendarDaysBetween(from: Date, to: Date) {
  return Math.round((startOfLocalDay(to) - startOfLocalDay(from)) / DAY_MS);
}

export function getWateringPlan(plant: GardenPlant): WateringPlan | undefined {
  const care = getCareReference(plant);
  const reference = care?.wateringDays;
  if (plant.wateringIntervalDays) return { source: 'custom', intervalDays: plant.wateringIntervalDays, reference, referenceSource: care?.source };
  // The shorter end of the range prompts a soil check before the plant dries too much.
  return care && reference ? { source: 'species', intervalDays: reference.min, reference, referenceSource: care.source } : undefined;
}

export function getWaterStatus(plant: GardenPlant, now = new Date()): WaterStatus {
  const plan = getWateringPlan(plant);
  const last = lastPlantCare(plant, 'water');
  if (!plan) return { state: 'unknown', lastWateredAt: last?.occurredAt, level: 0 };
  if (!last) return { state: 'never', plan, level: 0 };
  const daysSince = Math.max(0, calendarDaysBetween(new Date(last.occurredAt), now));
  const daysUntil = plan.intervalDays - daysSince;
  const level = Math.min(1, Math.max(0, daysUntil / plan.intervalDays));
  const state: WaterState = daysUntil < 0 ? 'overdue' : daysUntil === 0 ? 'due' : daysUntil === 1 ? 'soon' : 'ok';
  return { state, plan, lastWateredAt: last.occurredAt, daysSince, daysUntil, level };
}

export function wateredToday(plant: GardenPlant, now = new Date()) {
  return plant.history.some((entry) => entry.kind === 'care' && entry.careType === 'water' && calendarDaysBetween(new Date(entry.occurredAt), now) === 0);
}

function plural(count: number, one: string, many: string) {
  return count + ' ' + (count === 1 ? one : many);
}

export function describeWaterStatus(status: WaterStatus) {
  switch (status.state) {
    case 'unknown': return 'Defina a frequência de rega';
    case 'never': return 'Registre a primeira rega';
    case 'overdue': return 'Rega atrasada há ' + plural(-(status.daysUntil ?? 0), 'dia', 'dias');
    case 'due': return 'Regar hoje';
    case 'soon': return 'Regar amanhã';
    default: return 'Próxima rega em ' + plural(status.daysUntil ?? 0, 'dia', 'dias');
  }
}

export function describeWateringPlan(plan: WateringPlan) {
  const every = 'A cada ' + plural(plan.intervalDays, 'dia', 'dias');
  if (plan.source === 'custom') return every + ' · definido por você';
  return every + (plan.referenceSource === 'ai' ? ' · estimativa da IA para a espécie' : ' · referência da espécie');
}
