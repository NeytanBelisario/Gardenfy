import { useSyncExternalStore } from 'react';

type ShellUiState = {
  menuOpen: boolean;
};

let state: ShellUiState = {
  menuOpen: false,
};

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

export function setShellMenuOpen(menuOpen: boolean) {
  if (state.menuOpen === menuOpen) {
    return;
  }

  state = {
    ...state,
    menuOpen,
  };
  emitChange();
}

export function useShellUi() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
