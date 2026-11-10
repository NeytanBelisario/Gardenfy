import type { ScheduledReminder } from './reminderPlan';

// Web: local notifications are not available; the native file replaces this one on Android/iOS.
export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export const remindersSupported = false;

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return 'denied';
}

export async function replaceReminderSchedule(_reminders: ScheduledReminder[]) {}
