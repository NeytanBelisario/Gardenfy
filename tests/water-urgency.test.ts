import assert from 'node:assert/strict';
import test from 'node:test';
import { compareWaterUrgency, type WaterStatus } from '../src/features/gardens/watering';

const status = (state: WaterStatus['state'], daysUntil?: number): WaterStatus => ({ state, daysUntil, level: 0 });

test('garden list puts the most urgent watering first', () => {
  const sorted = [status('unknown'), status('ok', 5), status('overdue', -1), status('never'), status('ok', 2), status('due', 0), status('overdue', -4), status('soon', 1)]
    .sort(compareWaterUrgency).map((item) => item.state + (item.daysUntil ?? ''));
  assert.deepEqual(sorted, ['overdue-4', 'overdue-1', 'due0', 'soon1', 'never', 'ok2', 'ok5', 'unknown']);
});
