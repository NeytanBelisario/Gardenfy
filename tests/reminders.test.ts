import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReminderSchedule, isReminderSettings } from '../src/features/reminders/reminderPlan';
import type { GardenDetails, GardenPlant } from '../src/features/gardens/types';

const now = new Date(2026, 10, 10, 10, 0);
const daysAgo = (days: number) => new Date(2026, 10, 10 - days, 8, 0).toISOString();

function plant(id: string, interval: number | undefined, wateredDaysAgo?: number): GardenPlant {
  return {
    id, name: id, subtitle: '', imageUrl: '', status: { label: '', tone: 'stable' }, metrics: [],
    wateringIntervalDays: interval,
    history: wateredDaysAgo === undefined ? [] : [{ id: 'care-' + id, kind: 'care', careType: 'water', occurredAt: daysAgo(wateredDaysAgo) }],
  };
}

function garden(plants: GardenPlant[]): GardenDetails {
  return { id: 'g', name: 'Sala', label: '', imageUrl: '', icon: 'potted-plant', environment: 'indoor', plantCount: plants.length, vitality: null, averageHydration: null, metrics: [], plants };
}

test('disabled reminders schedule nothing', () => {
  assert.deepEqual(buildReminderSchedule([garden([plant('Monstera', 2, 2)])], { enabled: false, hour: 9 }, now), []);
});

test('one digest per due day at the chosen hour, skipping hours already past today', () => {
  // Due today (2 days after watering) but 9h has passed: the first digest is tomorrow, when it is late.
  const reminders = buildReminderSchedule([garden([plant('Monstera', 2, 2), plant('Pilea', 5, 0)])], { enabled: true, hour: 9 }, now, 7);
  const water = reminders.filter((item) => item.kind === 'water');
  assert.equal(water[0].date.getTime(), new Date(2026, 10, 11, 9).getTime());
  assert.equal(water[0].title, '💧 Hora de regar Monstera');
  assert.equal(water[0].body, 'A rega está atrasada há 1 dia.');
  // Pilea becomes due 5 days after today's watering and joins the digest.
  const both = water.find((item) => item.plantCount === 2);
  assert.ok(both);
  assert.equal(both.date.getTime(), new Date(2026, 10, 15, 9).getTime());
  assert.equal(both.title, '💧 2 plantas precisam de água');
  assert.equal(both.body, 'Monstera e Pilea.');
});

test('a later hour today still gets today\'s digest, and long lists are summarized', () => {
  const plants = ['A', 'B', 'C', 'D'].map((name) => plant(name, 3, 3));
  const [first] = buildReminderSchedule([garden(plants)], { enabled: true, hour: 18 }, now, 3);
  assert.equal(first.date.getTime(), new Date(2026, 10, 10, 18).getTime());
  assert.equal(first.body, 'A, B e mais 2.');
  assert.equal(first.title, '💧 4 plantas precisam de água');
});

test('plants without frequency or watering never trigger reminders; tracked ones end with a refresh notice', () => {
  assert.deepEqual(buildReminderSchedule([garden([plant('Livre', undefined, 3), plant('Nova', 3)])], { enabled: true, hour: 9 }, now), []);
  const reminders = buildReminderSchedule([garden([plant('Monstera', 30, 0)])], { enabled: true, hour: 9 }, now, 14);
  assert.equal(reminders.length, 1);
  assert.equal(reminders[0].kind, 'refresh');
  assert.equal(reminders[0].date.getTime(), new Date(2026, 10, 24, 9).getTime());
});

test('reminder settings validation rejects malformed values', () => {
  assert.equal(isReminderSettings({ enabled: true, hour: 9 }), true);
  for (const value of [null, {}, { enabled: 'yes', hour: 9 }, { enabled: true, hour: 24 }, { enabled: true, hour: 8.5 }]) {
    assert.equal(isReminderSettings(value), false);
  }
});
