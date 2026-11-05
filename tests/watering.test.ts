import assert from 'node:assert/strict';
import test from 'node:test';

import { createGardensStore } from '../src/features/gardens/storeCore';
import { deserializeGardens, type GardensStorage } from '../src/features/gardens/persistence';
import { createManagedPhotoStorage } from '../src/features/gardens/photoStorageCore';
import { calendarDaysBetween, describeWaterStatus, getWaterStatus, getWateringPlan } from '../src/features/gardens/watering';
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
