/**
 * Regras do que o relatório de falhas pode levar. Ficam sem dependência do SDK
 * para serem testadas; `monitoring.ts` só as entrega ao Sentry.
 */

type Crumb = { category?: string; data?: Record<string, unknown> };

/** Sem DSN ou em desenvolvimento, nada é enviado. */
export function isMonitoringEnabled(dsn: string | undefined, isDev: boolean): dsn is string {
  return !isDev && typeof dsn === 'string' && dsn.trim().length > 0;
}

/** Tira consulta e fragmento de um endereço; o caminho basta para entender a falha. */
export function stripUrlQuery(url: string) {
  return url.replace(/[?#].*$/, '');
}

/**
 * Logs do console podem conter nomes de jardins e plantas, então não viram rastro.
 * Em requisições, fica só o endereço sem consulta.
 */
export function filterBreadcrumb<T extends Crumb>(breadcrumb: T): T | null {
  if (breadcrumb.category === 'console') return null;
  const url = breadcrumb.data?.url;
  if (typeof url === 'string') return { ...breadcrumb, data: { ...breadcrumb.data, url: stripUrlQuery(url) } };
  return breadcrumb;
}
