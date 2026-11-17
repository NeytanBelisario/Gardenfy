import * as Sentry from '@sentry/react-native';

import { ENV } from '../../constants/env';
import { filterBreadcrumb, isMonitoringEnabled } from './filters';

/** Liga o relatório de falhas. Sem DSN ou em desenvolvimento, não faz nada. */
export function initMonitoring() {
  const dsn = ENV.sentryDsn;
  if (!isMonitoringEnabled(dsn, __DEV__)) return;
  Sentry.init({
    dsn,
    // Só falhas: sem IP, sem replay de tela e sem medição de desempenho.
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb: (breadcrumb) => filterBreadcrumb(breadcrumb),
  });
}

/** Ponto único de relato de falhas capturadas pelo app (ex.: tela de erro). */
export function reportError(error: unknown) {
  if (__DEV__) console.error('[Gardenfy] erro na tela', error);
  Sentry.captureException(error);
}

/** Envolve o layout raiz para capturar falhas de renderização fora das rotas. */
export const withMonitoring = Sentry.wrap;
