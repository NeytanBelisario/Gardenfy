import { calendarDaysBetween, type WaterStatus } from './watering';

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

export type CycleSegment = { state: 'used' | 'current' | 'left'; start: Date };

/** Above this many days, each segment stands for a week so the timer stays readable. */
const MAX_DAY_SEGMENTS = 31;

/**
 * Countdown timer: one segment per day between the last watering and the next one.
 * Days already lived are 'used', today is 'current', the rest are 'left'. Overdue cycles are fully used.
 */
export function getCycleSegments(cycle: NonNullable<ReturnType<typeof getWateringCycle>>, lastWateredAt: string) {
  const unitDays = cycle.intervalDays > MAX_DAY_SEGMENTS ? 7 : 1;
  const count = Math.ceil(cycle.intervalDays / unitDays);
  const current = Math.floor(cycle.elapsedDays / unitDays);
  const first = new Date(lastWateredAt);
  const segments: CycleSegment[] = Array.from({ length: count }, (_, index) => {
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index * unitDays);
    return { state: index < current ? 'used' : index === current ? 'current' : 'left', start };
  });
  return { unitDays, segments };
}

/** "hoje", "ontem", "amanhã" or "13 nov". */
export function relativeDay(date: Date, now = new Date()) {
  const diff = calendarDaysBetween(now, date);
  if (diff === 0) return 'hoje';
  if (diff === -1) return 'ontem';
  if (diff === 1) return 'amanhã';
  return date.getDate() + ' ' + date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}
