import { useSyncExternalStore } from 'react';

export type SuccessToast = {
  id: number;
  title: string;
  message?: string;
};

let state: SuccessToast | null = null;
let nextId = 1;

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function showSuccessToast(title: string, message?: string) {
  state = { id: nextId++, title, message };
  emitChange();
}

export function dismissSuccessToast(id?: number) {
  if (!state || (id !== undefined && state.id !== id)) {
    return;
  }

  state = null;
  emitChange();
}

export function getSuccessToast() {
  return state;
}

export function useSuccessToast() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
