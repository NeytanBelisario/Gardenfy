import assert from 'node:assert/strict';
import test from 'node:test';
import { createGardensStore } from '../src/features/gardens/storeCore';
import { deserializeGardens, serializeGardens } from '../src/features/gardens/persistence';
import { findPlantCareProfile, getPlantCareProfile } from '../src/features/gardens/careProfiles';
import { plantCatalog } from '../src/features/gardens/catalog';
import { gardenCareCount, lastPlantCare } from '../src/features/gardens/careActivity';
import type { PlantCandidate } from '../src/features/plant-identification/types';

const candidate: PlantCandidate = { scientificName: 'Monstera deliciosa', commonName: 'Costela-de-adão', confidence: 0.9 };

async function fixture() {
  let raw: string | null = null;
  let failWrite = false;
  const removed: string[] = [];
  let photoId = 0;
  const storage = { async getItem() { return raw; }, async setItem(_key: string, value: string) {
    if (failWrite) throw new Error('disk full'); raw = value;
  } };
  const photos = { async save() { return `gardenfy-photo:photo-test-${++photoId}.jpg`; }, async remove(uri: string) { removed.push(uri); }, resolve: (uri: string) => uri };
  const store = createGardensStore(storage, photos);
  await store.hydrate();
  const garden = await store.createGarden({ name: 'Varanda', environment: 'indoor', icon: 'eco', imageUrl: '' });
  return { store, garden, storage, photos, removed, getRaw: () => raw!, failWrites: () => { failWrite = true; } };
}

test('confirmed identification and care survive restart without fabricating photo measurements', async () => {
  const { store, garden, storage, photos } = await fixture();
  const plant = await store.savePlantIdentification(garden.id, candidate, 'file:///plant.jpg', 'Minha Monstera');
  await store.recordPlantCare(garden.id, plant.id, 'water');
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  const saved = restarted.getSnapshot().gardens[0].plants[0];
  assert.equal(saved.name, 'Minha Monstera');
  assert.equal(saved.species?.scientificName, candidate.scientificName);
  assert.deepEqual(saved.history.map((entry) => entry.kind), ['identification', 'care']);
  assert.equal(saved.vitality, undefined);
  assert.equal(saved.growthDays, undefined);
  assert.ok(saved.metrics.every((metric) => metric.value === null));
  assert.equal(getPlantCareProfile(saved)?.scientificName, candidate.scientificName);
});

test('failed identification save keeps original photo, species, name and history', async () => {
  const { store, garden, removed, failWrites, getRaw } = await fixture();
  const plant = await store.savePlantIdentification(garden.id, candidate, 'file:///one.jpg', 'Apelido');
  await store.recordPlantCare(garden.id, plant.id, 'fertilize');
  const before = getRaw();
  failWrites();
  await assert.rejects(store.savePlantIdentification(garden.id, { ...candidate, scientificName: 'Unknown species' }, 'file:///two.jpg', 'Outro', plant.id), /salvar/);
  assert.equal(getRaw(), before);
  assert.equal(store.getSnapshot().gardens[0].plants[0].species?.scientificName, candidate.scientificName);
  assert.deepEqual(removed, ['gardenfy-photo:photo-test-2.jpg']);
});

test('reidentification preserves nickname, notes and care while cleaning only unused photo', async () => {
  const { store, garden, removed } = await fixture();
  const plant = await store.savePlantIdentification(garden.id, candidate, 'file:///one.jpg', 'Apelido');
  await store.updatePlant(garden.id, plant.id, { name: 'Meu broto', subtitle: 'Presente' });
  await store.recordPlantCare(garden.id, plant.id, 'water');
  const updated = await store.savePlantIdentification(garden.id, { scientificName: 'Pilea peperomioides', commonName: 'Pilea', confidence: 0.75 }, 'file:///two.jpg', 'Ignorado', plant.id);
  assert.equal(updated.name, 'Meu broto');
  assert.equal(updated.subtitle, 'Presente');
  assert.deepEqual(updated.history.map((entry) => entry.kind), ['identification', 'care', 'identification']);
  assert.deepEqual(removed, [plant.imageUrl]);
});

test('invalid candidates and blank names never save a photo or write storage', async () => {
  const { store, garden, getRaw, removed } = await fixture();
  const before = getRaw();
  for (const confidence of [-0.1, 1.1, NaN, Infinity]) {
    await assert.rejects(store.savePlantIdentification(garden.id, { ...candidate, confidence }, 'file:///one.jpg', 'Nome'), /inválida/);
  }
  await assert.rejects(store.savePlantIdentification(garden.id, candidate, 'file:///one.jpg', '  '), /nome/);
  assert.equal(getRaw(), before);
  assert.deepEqual(removed, []);
});

test('v3 migration preserves all existing analysis and care entries and writes v4 on next save', async () => {
  const { store, garden, getRaw } = await fixture();
  const plant = await store.addPlantToGarden(garden.id, plantCatalog[0]);
  await store.updatePlantAnalysis(garden.id, plant.id, { plantName: 'Monstera', health: 'Boa', vitality: 70, water: 3, light: 5, growthDays: 30 }, 'file:///legacy.jpg');
  await store.recordPlantCare(garden.id, plant.id, 'water');
  const legacy = JSON.parse(getRaw());
  legacy.version = 3;
  const migrated = deserializeGardens(JSON.stringify(legacy));
  assert.deepEqual(migrated[0].plants[0].history, store.getSnapshot().gardens[0].plants[0].history);
  assert.equal(JSON.parse(serializeGardens(migrated)).version, 4);
  assert.deepEqual(migrated[0].plants[0].history.map((entry) => entry.kind), ['analysis', 'care']);
});

test('daily care summaries follow corrected dates and deleted records without counting identifications', async () => {
  const { store, garden } = await fixture();
  const plant = await store.savePlantIdentification(garden.id, candidate, 'file:///plant.jpg', 'Nome');
  const first = await store.recordPlantCare(garden.id, plant.id, 'water');
  await store.recordPlantCare(garden.id, plant.id, 'water');
  await store.updatePlantCare(garden.id, plant.id, first.id, { careType: 'fertilize', occurredAt: '2020-01-01T12:00:00.000Z' });
  const current = store.getSnapshot().gardens[0];
  assert.equal(gardenCareCount(current), 2);
  assert.equal(lastPlantCare(current.plants[0], 'fertilize')?.id, first.id);
  assert.equal(lastPlantCare(current.plants[0])?.careType, 'water');
  await store.deletePlantCare(garden.id, plant.id, first.id);
  const updated = store.getSnapshot().gardens[0];
  assert.equal(gardenCareCount(updated), 1);
  assert.equal(lastPlantCare(updated.plants[0], 'fertilize'), undefined);
});

test('corrupt persisted species and identification timestamps fail without silently accepting data', async () => {
  const { store, garden, getRaw } = await fixture();
  await store.savePlantIdentification(garden.id, candidate, 'file:///one.jpg', 'Nome');
  const original = JSON.parse(getRaw());
  const badScore = structuredClone(original);
  badScore.gardens[0].plants[0].species.confidence = 9;
  assert.throws(() => deserializeGardens(JSON.stringify(badScore)), /preservados/);
  const badDate = structuredClone(original);
  badDate.gardens[0].plants[0].history[0].occurredAt = '2026-01-01T00:00:00.000Z';
  assert.throws(() => deserializeGardens(JSON.stringify(badDate)), /preservados/);
});

test('care profile aliases support taxonomy changes and unknown explicit species never inherit nickname advice', async () => {
  assert.equal(findPlantCareProfile('Sansevieria trifasciata')?.scientificName, 'Dracaena trifasciata');
  assert.equal(findPlantCareProfile('Calathea orbifolia')?.scientificName, 'Goeppertia orbifolia');
  assert.equal(findPlantCareProfile('Monstera adansonii'), undefined);
  const { store, garden } = await fixture();
  const unknown = await store.savePlantIdentification(garden.id, { ...candidate, scientificName: 'Monstera adansonii' }, 'file:///plant.jpg', 'Monstera deliciosa');
  assert.equal(getPlantCareProfile(unknown), undefined);
});
