import { getWaterStatus, type WaterStatus } from './watering';
import type { GardenDetails, GardenPlant } from './types';

export type TodayPlant = { garden: GardenDetails; plant: GardenPlant; status: WaterStatus };

export type TodayOverview = {
  /** Due today or late, most late first. */
  due: TodayPlant[];
  /** Plants with a known watering frequency. */
  tracked: number;
  /** Closest upcoming watering when nothing is due. */
  next?: TodayPlant;
};

export function getTodayOverview(gardens: GardenDetails[], now = new Date()): TodayOverview {
  const all = gardens.flatMap((garden) => garden.plants.map((plant) => ({ garden, plant, status: getWaterStatus(plant, now) })));
  const due = all.filter((item) => item.status.state === 'due' || item.status.state === 'overdue')
    .sort((a, b) => (a.status.daysUntil ?? 0) - (b.status.daysUntil ?? 0) || a.plant.name.localeCompare(b.plant.name, 'pt-BR'));
  const tracked = all.filter((item) => item.status.state !== 'unknown').length;
  const next = all.filter((item) => item.status.state === 'ok' || item.status.state === 'soon')
    .sort((a, b) => (a.status.daysUntil ?? 0) - (b.status.daysUntil ?? 0))[0];
  return { due, tracked, next };
}
