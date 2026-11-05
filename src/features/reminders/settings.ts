import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_REMINDER_SETTINGS, isReminderSettings, type ReminderSettings } from './reminderPlan';

const STORAGE_KEY = 'gardenfy.reminders.v1';

let state: ReminderSettings = DEFAULT_REMINDER_SETTINGS;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: ReminderSettings) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function loadReminderSettings() {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isReminderSettings(parsed)) publish(parsed);
    })
    .catch(() => undefined)
    .finally(() => { loaded = true; listeners.forEach((listener) => listener()); });
  return loading;
}

export async function saveReminderSettings(next: ReminderSettings) {
  if (!isReminderSettings(next)) throw new Error('Configuração de lembrete inválida.');
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  publish(next);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadReminderSettings();
  return () => { listeners.delete(listener); };
}

const getSnapshot = () => state;
const getLoaded = () => loaded;

export function useReminderSettings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useReminderSettingsLoaded() {
  return useSyncExternalStore(subscribe, getLoaded, getLoaded);
}
