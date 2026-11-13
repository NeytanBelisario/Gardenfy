import assert from 'node:assert/strict';
import test from 'node:test';
import { getWateringCycle } from '../src/features/gardens/wateringCycle';
import type { WaterStatus } from '../src/features/gardens/watering';

function status(daysSince: number): WaterStatus {
  return { state: daysSince > 14 ? 'overdue' : 'ok', level: 0, daysSince,
    plan: { source: 'custom', intervalDays: 14 }, lastWateredAt: new Date(2026, 10, 4, 9).toISOString() };
}

test('cycle fills with elapsed days and keeps the original due date when overdue', () => {
  const cycle = getWateringCycle(status(9))!;
  assert.equal(cycle.progress, 9 / 14);
  assert.equal(cycle.due.getDate(), 18);
  const late = getWateringCycle(status(17))!;
  assert.equal(late.progress, 1);
  assert.equal(late.elapsedDays, 17);
  assert.equal(late.due.getDate(), 18);
  assert.equal(getWateringCycle(status(0))!.progress, 0);
});

test('cycle needs a frequency and a first watering, and rolls across month boundaries', () => {
  assert.equal(getWateringCycle({ state: 'unknown', level: 0 }), undefined);
  assert.equal(getWateringCycle({ state: 'never', level: 0, plan: { source: 'custom', intervalDays: 14 } }), undefined);
  const cycle = getWateringCycle({ ...status(3), lastWateredAt: new Date(2026, 11, 25, 9).toISOString() })!;
  assert.equal(cycle.due.getFullYear(), 2027);
  assert.equal(cycle.due.getMonth(), 0);
  assert.equal(cycle.due.getDate(), 8);
});
