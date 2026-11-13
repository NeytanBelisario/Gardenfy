import type { WaterStatus } from './watering';

/** Calendar progress, distinct from the remaining-water indicator used in lists. */
export function getWateringCycle(status: WaterStatus) {
  if (!status.plan || !status.lastWateredAt || status.daysSince === undefined) return undefined;
  const due = new Date(status.lastWateredAt);
  due.setDate(due.getDate() + status.plan.intervalDays);
  return {
    due,
    elapsedDays: status.daysSince,
    intervalDays: status.plan.intervalDays,
    progress: Math.min(1, Math.max(0, status.daysSince / status.plan.intervalDays)),
  };
}
