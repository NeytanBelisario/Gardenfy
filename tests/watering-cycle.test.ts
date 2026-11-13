import assert from 'node:assert/strict';
import test from 'node:test';
import { getCycleSegments, getWateringCycle, relativeDay } from '../src/features/gardens/wateringCycle';
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

test('countdown segments mark lived days, today and the days left', () => {
  const lastWateredAt = new Date(2026, 10, 13, 9).toISOString();
  const cycle = getWateringCycle({ ...status(0), lastWateredAt, plan: { source: 'custom', intervalDays: 7 } })!;
  const { unitDays, segments } = getCycleSegments(cycle, lastWateredAt);
  assert.equal(unitDays, 1);
  assert.deepEqual(segments.map((segment) => segment.state), ['current', 'left', 'left', 'left', 'left', 'left', 'left']);
  assert.equal(segments[6].start.getDate(), 19);

  const midCycle = getWateringCycle({ ...status(3), lastWateredAt, plan: { source: 'custom', intervalDays: 7 } })!;
  assert.deepEqual(getCycleSegments(midCycle, lastWateredAt).segments.map((segment) => segment.state).slice(0, 5), ['used', 'used', 'used', 'current', 'left']);

  const late = getWateringCycle({ ...status(9), lastWateredAt, plan: { source: 'custom', intervalDays: 7 } })!;
  assert.ok(getCycleSegments(late, lastWateredAt).segments.every((segment) => segment.state === 'used'));
});

test('long cycles are grouped by week', () => {
  const lastWateredAt = new Date(2026, 10, 1, 9).toISOString();
  const cycle = getWateringCycle({ ...status(10), lastWateredAt, plan: { source: 'custom', intervalDays: 60 } })!;
  const { unitDays, segments } = getCycleSegments(cycle, lastWateredAt);
  assert.equal(unitDays, 7);
  assert.equal(segments.length, 9);
  assert.equal(segments[1].state, 'current');
});

test('relative day reads hoje, ontem and amanhã before falling back to the date', () => {
  const now = new Date(2026, 10, 13, 15);
  assert.equal(relativeDay(new Date(2026, 10, 13, 8), now), 'hoje');
  assert.equal(relativeDay(new Date(2026, 10, 12, 23), now), 'ontem');
  assert.equal(relativeDay(new Date(2026, 10, 14, 1), now), 'amanhã');
  assert.equal(relativeDay(new Date(2026, 10, 20, 9), now), '20 nov');
});
