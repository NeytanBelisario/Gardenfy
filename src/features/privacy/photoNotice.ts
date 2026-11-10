import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Texto completo, versionado no repositório. Trocar para a `main` quando a 1.6 for promovida. */
export const PRIVACY_POLICY_URL = 'https://github.com/NeytanBelisario/Gardenfy/blob/develop/docs/PRIVACY.md';

// Mudou o que acontece com a foto? Suba a versão da chave para mostrar o aviso de novo.
const STORAGE_KEY = 'gardenfy.privacy.photo-notice.v1';

type State = { loaded: boolean; accepted: boolean };
let state: State = { loaded: false, accepted: false };
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function load() {
  loading ??= AsyncStorage.getItem(STORAGE_KEY)
    .then((value) => publish({ loaded: true, accepted: value === '1' }))
    .catch(() => publish({ loaded: true, accepted: false }));
  return loading;
}

/** Registra que a pessoa leu o aviso. Se a gravação falhar, vale para esta sessão e o aviso volta na próxima. */
export function acceptPhotoNotice() {
  publish({ loaded: true, accepted: true });
  AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void load();
  return () => { listeners.delete(listener); };
}

const getSnapshot = () => state;

/** Se o aviso sobre o envio da foto já foi aceito neste aparelho. */
export function usePhotoNotice() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
