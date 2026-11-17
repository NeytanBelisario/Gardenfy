import assert from 'node:assert/strict';
import test from 'node:test';

import { filterBreadcrumb, isMonitoringEnabled, stripUrlQuery } from '../src/features/monitoring/filters';

test('monitoring stays off without DSN or in development', () => {
  assert.equal(isMonitoringEnabled(undefined, false), false);
  assert.equal(isMonitoringEnabled('  ', false), false);
  assert.equal(isMonitoringEnabled('https://key@o1.ingest.sentry.io/1', true), false);
  assert.equal(isMonitoringEnabled('https://key@o1.ingest.sentry.io/1', false), true);
});

test('console breadcrumbs are dropped because logs may carry garden and plant names', () => {
  assert.equal(filterBreadcrumb({ category: 'console', data: { arguments: ['Monstera da sala'] } }), null);
});

test('request breadcrumbs keep only the path of the URL', () => {
  assert.equal(stripUrlQuery('https://x.supabase.co/functions/v1/estimate-care?species=ficus#a'), 'https://x.supabase.co/functions/v1/estimate-care');
  const crumb = filterBreadcrumb({ category: 'fetch', data: { url: 'https://api.test/identify?lang=pt', status_code: 200 } });
  assert.deepEqual(crumb, { category: 'fetch', data: { url: 'https://api.test/identify', status_code: 200 } });
});

test('navigation breadcrumbs pass unchanged', () => {
  const crumb = { category: 'navigation', data: { from: '/', to: '/profile' } };
  assert.equal(filterBreadcrumb(crumb), crumb);
});
