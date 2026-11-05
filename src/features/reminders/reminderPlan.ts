import { getWaterStatus } from '../gardens/watering';
import type { GardenDetails } from '../gardens/types';

export type ReminderSettings = { enabled: boolean; hour: number };

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: false, hour: 9 };
export const REMINDER_HORIZON_DAYS = 14;
export const REMINDER_HOURS = [7, 8, 9, 12, 18, 20] as const;

export type ScheduledReminder = { date: Date; title: string; body: string; kind: 'water' | 'refresh'; plantCount: number };

export function isReminderSettings(value: unknown): value is ReminderSettings {
  if (typeof value !== 'object' || value === null) return false;
  const { enabled, hour } = value as Record<string, unknown>;
  return typeof enabled === 'boolean' && typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

function listNames(names: string[]) {
  if (names.length <= 2) return names.join(' e ');
  return names.slice(0, 2).join(', ') + ' e mais ' + (names.length - 2);
}

/**
 * One digest per day at the chosen hour, only on days when a plant is due or late, projected from
 * the current records (as if nothing else were watered). Rebuilt whenever data or settings change.
 */
export function buildReminderSchedule(gardens: GardenDetails[], settings: ReminderSettings, now = new Date(), horizonDays = REMINDER_HORIZON_DAYS): ScheduledReminder[] {
  if (!settings.enabled) return [];
  const plants = gardens.flatMap((garden) => garden.plants);
  const reminders: ScheduledReminder[] = [];
  let tracked = false;
  for (let offset = 0; offset < horizonDays; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, settings.hour, 0, 0, 0);
    const statuses = plants.map((plant) => ({ plant, status: getWaterStatus(plant, at) }));
    if (statuses.some(({ status }) => status.lastWateredAt && status.plan)) tracked = true;
    if (at <= now) continue;
    const due = statuses.filter(({ status }) => status.state === 'due' || status.state === 'overdue')
      .sort((a, b) => (a.status.daysUntil ?? 0) - (b.status.daysUntil ?? 0));
    if (!due.length) continue;
    const names = due.map(({ plant }) => plant.name);
    const single = due.length === 1 ? due[0] : undefined;
    reminders.push({
      date: at, kind: 'water', plantCount: due.length,
      title: single ? '💧 Hora de regar ' + single.plant.name : '💧 ' + due.length + ' plantas precisam de água',
      body: single
        ? single.status.state === 'overdue' ? 'A rega está atrasada há ' + -(single.status.daysUntil ?? 0) + (single.status.daysUntil === -1 ? ' dia.' : ' dias.') : 'Hoje é dia de rega. Confira o solo antes.'
        : listNames(names) + '.',
    });
  }
  if (tracked) {
    reminders.push({
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + horizonDays, settings.hour, 0, 0, 0), kind: 'refresh', plantCount: 0,
      title: '🌿 Seus lembretes estão pausando',
      body: 'Abra o Gardenfy para continuar recebendo os lembretes de rega.',
    });
  }
  return reminders;
}
