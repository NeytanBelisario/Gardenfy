import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useGardensState } from '../gardens/store';
import { buildReminderSchedule } from './reminderPlan';
import { remindersSupported, replaceReminderSchedule } from './scheduler';
import { useReminderSettings, useReminderSettingsLoaded } from './settings';

const DEBOUNCE_MS = 800;

/** Keeps the scheduled reminders in step with plants, waterings, settings and the current day. */
export function ReminderSync() {
  const { gardens, status } = useGardensState();
  const settings = useReminderSettings();
  const settingsLoaded = useReminderSettingsLoaded();
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    if (!remindersSupported) return;
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') setForegroundTick((tick) => tick + 1); });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!remindersSupported || status !== 'ready' || !settingsLoaded) return;
    const timer = setTimeout(() => {
      replaceReminderSchedule(buildReminderSchedule(gardens, settings)).catch(() => undefined);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [gardens, status, settings, settingsLoaded, foregroundTick]);

  return null;
}
