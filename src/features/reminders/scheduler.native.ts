import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { ScheduledReminder } from './reminderPlan';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export const remindersSupported = true;

const CHANNEL_ID = 'watering-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

function toPermission(response: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes de rega',
    description: 'Um resumo por dia das plantas que precisam de água.',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function getNotificationPermission() {
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission() {
  // Android 13+ only shows the system prompt once a channel exists.
  await ensureChannel();
  return toPermission(await Notifications.requestPermissionsAsync());
}

let queue: Promise<unknown> = Promise.resolve();

/** Replaces every scheduled reminder; serialized so overlapping syncs never duplicate them. */
export function replaceReminderSchedule(reminders: ScheduledReminder[]) {
  const task = queue.then(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!reminders.length || (await getNotificationPermission()) !== 'granted') return;
    await ensureChannel();
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body, data: { kind: reminder.kind } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID },
      });
    }
  });
  queue = task.catch(() => undefined);
  return task;
}
