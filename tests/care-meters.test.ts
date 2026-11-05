import assert from 'node:assert/strict';
import test from 'node:test';

import { createGardensStore } from '../src/features/gardens/storeCore';
import { deserializeGardens, type GardensStorage } from '../src/features/gardens/persistence';
import { createManagedPhotoStorage } from '../src/features/gardens/photoStorageCore';
import { calendarDaysBetween, describeWaterStatus, getWaterStatus, getWateringPlan, wateredToday } from '../src/features/gardens/watering';
import type { GardenPlant, PlantCatalogItem } from '../src/features/gardens/types';

function plant(overrides: Partial<GardenPlant> = {}): GardenPlant {
  return {
    id: 'plant-1', name: 'Minha planta', subtitle: '', imageUrl: '',
    status: { label: 'Sem análise', tone: 'stable' }, metrics: [], history: [],
    ...overrides,
  };
}

const monstera = { species: { scientificName: 'Monstera deliciosa', commonName: 'Costela-de-adão', source: 'catalog' as const } };

function watered(...dates: string[]): Pick<GardenPlant, 'history'> {
  return { history: dates.map((occurredAt, index) => ({ id: 'care-' + index, kind: 'care' as const, careType: 'water' as const, occurredAt })) };
}

const now = new Date(2026, 10, 10, 9, 0);
const daysAgo = (days: number, hour = 20) => new Date(2026, 10, 10 - days, hour, 30).toISOString();

test('calendar days ignore the hour of the day', () => {
  assert.equal(calendarDaysBetween(new Date(2026, 10, 9, 23, 59), new Date(2026, 10, 10, 0, 1)), 1);
  assert.equal(calendarDaysBetween(new Date(2026, 10, 10, 0, 1), new Date(2026, 10, 10, 23, 59)), 0);
});

test('watering plan prefers the user frequency over the species reference', () => {
  assert.deepEqual(getWateringPlan(plant(monstera)), { source: 'species', intervalDays: 7, reference: { min: 7, max: 10 } });
  assert.deepEqual(getWateringPlan(plant({ ...monstera, wateringIntervalDays: 12 })), { source: 'custom', intervalDays: 12, reference: { min: 7, max: 10 } });
  assert.equal(getWateringPlan(plant()), undefined);
  assert.deepEqual(getWateringPlan(plant({ wateringIntervalDays: 3 })), { source: 'custom', intervalDays: 3, reference: undefined });
});

test('water status without a frequency or without watering never invents a level', () => {
  const unknown = getWaterStatus(plant(watered(daysAgo(1))), now);
  assert.equal(unknown.state, 'unknown');
  assert.equal(unknown.level, 0);
  assert.equal(describeWaterStatus(unknown), 'Defina a frequência de rega');
  const never = getWaterStatus(plant(monstera), now);
  assert.equal(never.state, 'never');
  assert.equal(describeWaterStatus(never), 'Registre a primeira rega');
});

test('water status drains with calendar days from the latest watering', () => {
  const fresh = getWaterStatus(plant({ ...monstera, ...watered(daysAgo(9), daysAgo(0, 8)) }), now);
  assert.equal(fresh.state, 'ok');
  assert.equal(fresh.level, 1);
  assert.equal(describeWaterStatus(fresh), 'Próxima rega em 7 dias');

  const soon = getWaterStatus(plant({ ...monstera, ...watered(daysAgo(6)) }), now);
  assert.equal(soon.state, 'soon');
  assert.equal(describeWaterStatus(soon), 'Regar amanhã');

  const due = getWaterStatus(plant({ ...monstera, ...watered(daysAgo(7)) }), now);
  assert.equal(due.state, 'due');
  assert.equal(due.level, 0);
  assert.equal(describeWaterStatus(due), 'Regar hoje');

  const late = getWaterStatus(plant({ ...monstera, ...watered(daysAgo(9)) }), now);
  assert.equal(late.state, 'overdue');
  assert.equal(late.level, 0);
  assert.equal(describeWaterStatus(late), 'Rega atrasada há 2 dias');

  const half = getWaterStatus(plant({ wateringIntervalDays: 4, ...watered(daysAgo(2)) }), now);
  assert.equal(half.level, 0.5);
});

test('fertilizing does not count as watering', () => {
  const status = getWaterStatus(plant({ ...monstera, history: [{ id: 'f', kind: 'care', careType: 'fertilize', occurredAt: daysAgo(0) }] }), now);
  assert.equal(status.state, 'never');
});

async function storeFixture() {
  const memory: { raw: string | null } = { raw: null };
  const storage: GardensStorage = { async getItem() { return memory.raw; }, async setItem(_key, value) { memory.raw = value; } };
  const photos = createManagedPhotoStorage({ directoryUri: () => 'file:///photos', async copy() {}, async remove() {} });
  const store = createGardensStore(storage, photos);
  await store.hydrate();
  const garden = await store.createGarden({ name: 'Sala', environment: 'indoor', icon: 'potted-plant', imageUrl: '' });
  const item: PlantCatalogItem = { id: 'c1', name: 'Jiboia', subtitle: '', category: 'foliage', categoryLabel: 'Folhagem', imageUrl: 'https://example.com/p.jpg' };
  await store.addPlantToGarden(garden.id, item);
  const plantId = store.getSnapshot().gardens[0].plants[0].id;
  return { memory, store, gardenId: garden.id, plantId };
}

test('watering frequency persists, survives reload and can be cleared', async () => {
  const { memory, store, gardenId, plantId } = await storeFixture();
  await store.setPlantWateringInterval(gardenId, plantId, 5);
  assert.equal(deserializeGardens(memory.raw)[0].plants[0].wateringIntervalDays, 5);
  await store.setPlantWateringInterval(gardenId, plantId, undefined);
  const saved = deserializeGardens(memory.raw)[0].plants[0];
  assert.equal('wateringIntervalDays' in saved, false);
});

test('invalid watering frequencies are rejected without saving', async () => {
  const { memory, store, gardenId, plantId } = await storeFixture();
  const before = memory.raw;
  for (const value of [0, 61, 2.5, Number.NaN]) {
    await assert.rejects(store.setPlantWateringInterval(gardenId, plantId, value), /entre 1 e 60/);
  }
  assert.equal(memory.raw, before);
  const tampered = JSON.parse(before!);
  tampered.gardens[0].plants[0].wateringIntervalDays = 0;
  assert.throws(() => deserializeGardens(JSON.stringify(tampered)));
});

test('light status compares the chosen spot with the species preference', async () => {
  const { getLightStatus, describeLightStatus, describeLightDetail } = await import('../src/features/gardens/light');
  const unset = getLightStatus(plant(monstera));
  assert.equal(unset.spot, undefined);
  assert.equal(unset.ideal, 'bright');
  assert.equal(describeLightStatus(unset), 'Onde ela fica?');

  const ideal = getLightStatus(plant({ ...monstera, lightSpot: 'bright' }));
  assert.deepEqual([ideal.fit, ideal.level, describeLightStatus(ideal)], ['ideal', 1, 'Local ideal']);

  const sun = getLightStatus(plant({ ...monstera, lightSpot: 'sun' }));
  assert.equal(describeLightStatus(sun), 'Sol forte demais para ela');
  assert.equal(describeLightDetail(sun), 'Fica em: sol direto · ela prefere claridade');

  const noGuide = getLightStatus(plant({ lightSpot: 'shade' }));
  assert.equal(noGuide.fit, undefined);
  assert.equal(noGuide.level, 0);
  assert.equal(describeLightStatus(noGuide), 'Pouca luz');
});

test('light spot persists, can be cleared and rejects unknown values', async () => {
  const { memory, store, gardenId, plantId } = await storeFixture();
  await store.setPlantLightSpot(gardenId, plantId, 'shade');
  assert.equal(deserializeGardens(memory.raw)[0].plants[0].lightSpot, 'shade');
  await assert.rejects(store.setPlantLightSpot(gardenId, plantId, 'moon' as never), /local válido/);
  await store.setPlantLightSpot(gardenId, plantId, undefined);
  assert.equal('lightSpot' in deserializeGardens(memory.raw)[0].plants[0], false);
});

test('routine counts the days within the watering frequency, from the first watering', async () => {
  const { getRoutineStatus, describeRoutineStatus, describeRoutineDetail } = await import('../src/features/gardens/routine');
  assert.equal(getRoutineStatus(plant(watered(daysAgo(1))), now).state, 'none');
  assert.equal(getRoutineStatus(plant(monstera), now).state, 'none');

  const today = getRoutineStatus(plant({ ...monstera, ...watered(daysAgo(0)) }), now);
  assert.deepEqual([today.state, today.level], ['good', 1]);

  // Every 4 days, watered 20 and 10 days ago: days 15..11 ago and 5..0 ago are late.
  const gaps = getRoutineStatus(plant({ wateringIntervalDays: 4, ...watered(daysAgo(20), daysAgo(10)) }), now);
  if (gaps.state === 'none') return assert.fail('expected a tracked routine');
  assert.equal(gaps.trackedDays, 21);
  assert.equal(gaps.onTimeDays, 10);
  assert.equal(describeRoutineStatus(gaps), 'Rotina atrasada');
  assert.equal(describeRoutineDetail(gaps), '10 de 21 dias com a rega em dia');
});

test('routine looks back 30 days at most and ignores fertilizing and future records', async () => {
  const { getRoutineStatus } = await import('../src/features/gardens/routine');
  const regular = Array.from({ length: 20 }, (_, index) => daysAgo(index * 3));
  const status = getRoutineStatus(plant({ wateringIntervalDays: 3, history: [
    ...watered(...regular).history,
    { id: 'f', kind: 'care', careType: 'fertilize', occurredAt: daysAgo(1) },
    { id: 'future', kind: 'care', careType: 'water', occurredAt: daysAgo(-3) },
  ] }), now);
  assert.ok(status.state === 'good');
  assert.equal(status.trackedDays, 30);
  assert.equal(status.onTimeDays, 30);
});

test('today overview lists due and late plants across gardens, most late first', async () => {
  const { getTodayOverview } = await import('../src/features/gardens/today');
  const garden = (id: string, plants: GardenPlant[]) => ({ id, name: id, label: '', imageUrl: '', icon: 'potted-plant', environment: 'indoor', plantCount: plants.length, vitality: null, averageHydration: null, metrics: [], plants }) as never;
  const late = plant({ id: 'late', name: 'Atrasada', wateringIntervalDays: 2, ...watered(daysAgo(5)) });
  const due = plant({ id: 'due', name: 'Hoje', wateringIntervalDays: 3, ...watered(daysAgo(3)) });
  const fine = plant({ id: 'fine', name: 'Ok', wateringIntervalDays: 5, ...watered(daysAgo(1)) });
  const untracked = plant({ id: 'free', name: 'Livre' });
  const overview = getTodayOverview([garden('a', [due, fine]), garden('b', [late, untracked])], now);
  assert.deepEqual(overview.due.map((item) => item.plant.id), ['late', 'due']);
  assert.equal(overview.tracked, 3);
  assert.equal(overview.next?.plant.id, 'fine');
  assert.equal(wateredToday(fine, now), false);
  assert.equal(wateredToday(plant(watered(daysAgo(0, 7))), now), true);
});

test('streak counts consecutive days with no tracked plant late, and keeps the best run', async () => {
  const { getStreak } = await import('../src/features/gardens/streak');
  const garden = (plants: GardenPlant[]) => ({ id: 'g', name: 'g', label: '', imageUrl: '', icon: 'potted-plant', environment: 'indoor', plantCount: plants.length, vitality: null, averageHydration: null, metrics: [], plants }) as never;
  assert.deepEqual(getStreak([garden([plant(monstera), plant(watered(daysAgo(1)))])], now), { current: 0, best: 0, trackedPlants: 0, lateToday: [] });

  // Every 2 days: watered 10, 8, 3 and 1 days ago. Days 5..4 ago are late: runs of 5 (10..6 ago) and 4 (3 ago..today).
  const a = plant({ name: 'A', wateringIntervalDays: 2, ...watered(daysAgo(10), daysAgo(8), daysAgo(3), daysAgo(1)) });
  const status = getStreak([garden([a])], now);
  assert.equal(status.current, 4);
  assert.equal(status.best, 5);
  assert.deepEqual(status.lateToday, []);

  // A second plant late today breaks the streak and is named.
  const b = plant({ name: 'B', wateringIntervalDays: 3, ...watered(daysAgo(5)) });
  const broken = getStreak([garden([a, b])], now);
  assert.equal(broken.current, 0);
  assert.deepEqual(broken.lateToday, ['B']);
  assert.equal(broken.trackedPlants, 2);
});
