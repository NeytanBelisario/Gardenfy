import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, copyFile, rm, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

import { createGardensStore } from '../src/features/gardens/storeCore';
import { deserializeGardens, GARDENS_STORAGE_KEY, serializeGardens, type GardensStorage } from '../src/features/gardens/persistence';
import { createManagedPhotoStorage, type PlantPhotoStorage } from '../src/features/gardens/photoStorageCore';
import type { PlantAnalysisResult, PlantCatalogItem } from '../src/features/gardens/types';

const draft = { name: '  Varanda  ', environment: 'outdoor' as const, icon: 'potted-plant' as const, imageUrl: '' };
const catalog: PlantCatalogItem = { id: 'catalog-1', name: 'Jiboia', subtitle: 'Folhagem', category: 'foliage', categoryLabel: 'Folhagem', imageUrl: 'https://example.com/plant.jpg' };
const analysis: PlantAnalysisResult = { plantName: 'Jiboia', health: 'Boa', vitality: 80, water: 4, light: 6, growthDays: 30 };

function memoryStorage(raw: string | null = null) {
  const memory = { raw, readFailure: false, failWrites: 0, reads: 0, writes: 0 };
  const storage: GardensStorage = {
    async getItem(key) {
      assert.equal(key, GARDENS_STORAGE_KEY);
      memory.reads++;
      if (memory.readFailure) throw new Error('device read failure');
      return memory.raw;
    },
    async setItem(key, value) {
      assert.equal(key, GARDENS_STORAGE_KEY);
      memory.writes++;
      if (memory.failWrites > 0) {
        memory.failWrites--;
        throw new Error('device write failure');
      }
      memory.raw = value;
    },
  };
  return { memory, storage };
}

function photoFixture() {
  const files = new Map<string, string>();
  let root = 'file:///documents/gardenfy-photos';
  let copyFailure = false;
  const photos = createManagedPhotoStorage({
    directoryUri: () => root,
    async copy(source, name) {
      files.set(name, source);
      if (copyFailure) throw new Error('photo copy failed after partial write');
    },
    async remove(name) { files.delete(name); },
  });
  return {
    files, photos,
    setRoot: (next: string) => { root = next; },
    failCopy: () => { copyFailure = true; },
  };
}

async function fixture() {
  const { memory, storage } = memoryStorage();
  const photo = photoFixture();
  const store = createGardensStore(storage, photo.photos);
  await store.hydrate();
  return { memory, storage, ...photo, store };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

test('first load is empty and never writes; repeated hydration does not reset gardens', async () => {
  const { store, memory } = await fixture();
  assert.deepEqual(store.getSnapshot(), { gardens: [], status: 'ready', error: null });
  assert.equal(memory.writes, 0);
  await store.createGarden(draft);
  await store.hydrate();
  assert.equal(memory.reads, 1);
  assert.equal(store.getSnapshot().gardens[0].name, 'Varanda');
});

test('gardens and catalog plants survive a new store instance', async () => {
  const { store, storage, photos } = await fixture();
  const garden = await store.createGarden(draft);
  await store.addPlantToGarden(garden.id, catalog);
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  assert.deepEqual(restarted.getSnapshot().gardens, store.getSnapshot().gardens);
  assert.equal(restarted.getSnapshot().gardens[0].plantCount, 1);
  assert.equal(restarted.getSnapshot().gardens[0].plants[0].vitality, undefined);
});

test('hydration is deduplicated and mutations are blocked until loading completes', async () => {
  const loading = deferred();
  let reads = 0;
  const { storage, memory } = memoryStorage();
  storage.getItem = async () => { reads++; await loading.promise; return null; };
  const store = createGardensStore(storage, photoFixture().photos);
  const first = store.hydrate();
  const second = store.hydrate();
  assert.equal(first, second);
  await assert.rejects(store.createGarden(draft), /carregamento/);
  assert.equal(memory.writes, 0);
  loading.resolve();
  await first;
  assert.equal(reads, 1);
});

test('read failure preserves saved data, blocks writes and supports retry', async () => {
  const { store, storage, memory, photos } = await fixture();
  await store.createGarden(draft);
  const saved = memory.raw;
  memory.readFailure = true;
  const restarted = createGardensStore(storage, photos);
  await assert.rejects(restarted.hydrate());
  assert.equal(restarted.getSnapshot().status, 'error');
  await assert.rejects(restarted.createGarden(draft));
  assert.equal(memory.raw, saved);
  memory.readFailure = false;
  await restarted.hydrate();
  assert.equal(restarted.getSnapshot().gardens.length, 1);
});

test('a synchronously failing storage adapter can also retry hydration', async () => {
  const { storage } = memoryStorage();
  storage.getItem = () => { throw new Error('sync native error'); };
  const store = createGardensStore(storage, photoFixture().photos);
  await assert.rejects(store.hydrate());
  storage.getItem = async () => null;
  await store.hydrate();
  assert.equal(store.getSnapshot().status, 'ready');
});

for (const [name, raw] of [
  ['broken JSON', '{broken'],
  ['future version', '{"version":2,"gardens":[]}'],
  ['missing schema', '{"gardens":[]}'],
  ['invalid garden', '{"version":1,"gardens":[{"id":"x"}]}'],
] as const) {
  test(`${name} is preserved and never replaced with an empty store`, async () => {
    const { storage, memory } = memoryStorage(raw);
    const store = createGardensStore(storage, photoFixture().photos);
    await assert.rejects(store.hydrate());
    await assert.rejects(store.createGarden(draft));
    assert.equal(memory.raw, raw);
    assert.equal(memory.writes, 0);
  });
}

test('nested invalid values and duplicate ids are rejected before loading', async () => {
  const { store } = await fixture();
  const garden = await store.createGarden(draft);
  await store.addPlantToGarden(garden.id, catalog);
  const base = store.getSnapshot().gardens;
  for (const corrupt of [
    (data: typeof base) => { data[0].plants[0].metrics[0].value = 101; },
    (data: typeof base) => { data[0].plantCount = 10; },
    (data: typeof base) => { data[0].plants[0].imageUrl = 'gardenfy-photo:../../private.jpg'; },
    (data: typeof base) => { data[0].plants.push(data[0].plants[0]); data[0].plantCount = 2; },
    (data: typeof base) => { data.push(data[0]); },
  ]) {
    const copy = structuredClone(base);
    corrupt(copy);
    assert.throws(() => deserializeGardens(JSON.stringify({ version: 1, gardens: copy })));
  }
});

test('UI state is published only after storage confirms the write', async () => {
  const { storage, memory } = memoryStorage();
  const entered = deferred();
  const release = deferred();
  const write = storage.setItem;
  storage.setItem = async (key, value) => { entered.resolve(); await release.promise; await write(key, value); };
  const store = createGardensStore(storage, photoFixture().photos);
  await store.hydrate();
  const creating = store.createGarden(draft);
  await entered.promise;
  assert.equal(store.getSnapshot().gardens.length, 0);
  assert.equal(memory.raw, null);
  release.resolve();
  await creating;
  assert.equal(store.getSnapshot().gardens.length, 1);
});

test('write failure retains previous memory and storage; next operation can save', async () => {
  const { store, memory } = await fixture();
  const garden = await store.createGarden(draft);
  const previous = store.getSnapshot();
  const saved = memory.raw;
  memory.failWrites = 1;
  await assert.rejects(store.addPlantToGarden(garden.id, catalog), /Nenhuma alteração/);
  assert.equal(store.getSnapshot(), previous);
  assert.equal(memory.raw, saved);
  await store.addPlantToGarden(garden.id, catalog);
  assert.equal(store.getSnapshot().gardens[0].plantCount, 1);
});

test('concurrent additions are serialized and none is lost', async () => {
  const { store, memory } = await fixture();
  const garden = await store.createGarden(draft);
  await Promise.all(Array.from({ length: 8 }, () => store.addPlantToGarden(garden.id, catalog)));
  const saved = deserializeGardens(memory.raw)[0];
  assert.equal(saved.plantCount, 8);
  assert.equal(new Set(saved.plants.map((plant) => plant.id)).size, 8);
});

test('a rejected queued write does not poison the following write', async () => {
  const { store, memory } = await fixture();
  const garden = await store.createGarden(draft);
  memory.failWrites = 1;
  const results = await Promise.allSettled([
    store.addPlantToGarden(garden.id, catalog),
    store.addPlantToGarden(garden.id, catalog),
  ]);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(store.getSnapshot().gardens[0].plantCount, 1);
});

test('analysis and durable photo references survive restart and sandbox relocation', async () => {
  const { store, storage, photos, files, setRoot } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpeg');
  assert.match(plant.imageUrl, /^gardenfy-photo:/);
  assert.equal(files.size, 1);
  setRoot('file:///new-sandbox/documents/gardenfy-photos');
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  const savedPlant = restarted.getSnapshot().gardens[0].plants[0];
  assert.equal(savedPlant.imageUrl, plant.imageUrl);
  assert.equal(savedPlant.vitality, 80);
  assert.ok(savedPlant.lastAnalyzedAt);
  assert.equal(restarted.getSnapshot().gardens[0].averageHydration, 40);
  assert.match(photos.resolve(savedPlant.imageUrl), /^file:\/\/\/new-sandbox\//);
});

test('partially failed photo copy is cleaned up without modifying the garden', async () => {
  const { store, memory, files, failCopy } = await fixture();
  const garden = await store.createGarden(draft);
  const saved = memory.raw;
  failCopy();
  await assert.rejects(store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpg'), /guardar a foto/);
  assert.equal(files.size, 0);
  assert.equal(memory.raw, saved);
  assert.equal(store.getSnapshot().gardens[0].plantCount, 0);
});

test('failed photo metadata write removes only the new photo', async () => {
  const { store, memory, photos, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/old.jpg');
  const saved = memory.raw;
  memory.failWrites = 1;
  await assert.rejects(store.updatePlantAnalysis(garden.id, plant.id, { ...analysis, vitality: 20 }, 'file:///cache/new.jpg'));
  assert.equal(memory.raw, saved);
  assert.equal(store.getSnapshot().gardens[0].plants[0].vitality, 80);
  assert.equal(files.size, 1);
  assert.equal(photos.resolve(store.getSnapshot().gardens[0].plants[0].imageUrl), photos.resolve(plant.imageUrl));
});

test('successful reanalysis replaces the saved photo and removes the unused old photo', async () => {
  const { store, memory, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addPlantToGarden(garden.id, catalog);
  await store.updatePlantAnalysis(garden.id, plant.id, analysis, 'file:///cache/old.jpg');
  const updated = await store.updatePlantAnalysis(garden.id, plant.id, { ...analysis, vitality: 20 }, 'file:///cache/new.jpg');
  assert.equal(updated.id, plant.id);
  assert.equal(updated.name, catalog.name);
  assert.equal(files.size, 1);
  assert.equal(deserializeGardens(memory.raw)[0].plants[0].vitality, 20);
});

test('reanalysis without a new photo retains the previous saved photo', async () => {
  const { store, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/old.jpg');
  const updated = await store.updatePlantAnalysis(garden.id, plant.id, { ...analysis, vitality: 70 });
  assert.equal(updated.imageUrl, plant.imageUrl);
  assert.equal(updated.lastAnalyzedPhotoUri, plant.lastAnalyzedPhotoUri);
  assert.equal(files.size, 1);
});

test('a photo still referenced by another plant is retained after reanalysis', async () => {
  const { store, storage, photos, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/shared.jpg');
  const gardens = structuredClone(store.getSnapshot().gardens);
  gardens[0].plants.push({ ...plant, id: 'second-plant' });
  gardens[0].plantCount = 2;
  await storage.setItem(GARDENS_STORAGE_KEY, serializeGardens(gardens));
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  await restarted.updatePlantAnalysis(garden.id, plant.id, analysis, 'file:///cache/new.jpg');
  assert.equal(files.size, 2);
});

test('missing ids reject before any photo is copied or data is written', async () => {
  const { store, memory, files } = await fixture();
  await assert.rejects(store.addAnalyzedPlantToGarden('missing', analysis, 'file:///cache/test.jpg'), /Jardim não encontrado/);
  const garden = await store.createGarden(draft);
  const writes = memory.writes;
  await assert.rejects(store.updatePlantAnalysis(garden.id, 'missing', analysis, 'file:///cache/test.jpg'), /Planta não encontrada/);
  assert.equal(files.size, 0);
  assert.equal(memory.writes, writes);
});

test('invalid analysis is not persisted and its new photo is cleaned up', async () => {
  const { store, memory, files } = await fixture();
  const garden = await store.createGarden(draft);
  const saved = memory.raw;
  await assert.rejects(store.addAnalyzedPlantToGarden(garden.id, { ...analysis, growthDays: Number.NaN }, 'file:///cache/new.jpg'));
  assert.equal(memory.raw, saved);
  assert.equal(files.size, 0);
});

test('blank garden names reject without a storage write', async () => {
  const { store, memory } = await fixture();
  await assert.rejects(store.createGarden({ ...draft, name: '  ' }), /Informe um nome/);
  assert.equal(memory.writes, 0);
});

test('real files remain readable after cache removal and app-directory relocation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gardenfy-photos-'));
  let documents = join(root, 'documents');
  const cache = join(root, 'cache');
  try {
    await mkdir(cache);
    const source = join(cache, 'plant.jpg');
    await writeFile(source, 'photo-content');
    const photos: PlantPhotoStorage = createManagedPhotoStorage({
      directoryUri: () => pathToFileURL(documents).href,
      async copy(uri, name) { await mkdir(documents, { recursive: true }); await copyFile(fileURLToPath(uri), join(documents, name)); },
      async remove(name) { await rm(join(documents, name), { force: true }); },
    });
    const metadataPath = join(root, 'gardens.json');
    const diskStorage = (): GardensStorage => ({
      async getItem() {
        try { return await readFile(metadataPath, 'utf8'); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw error;
        }
      },
      async setItem(_key, value) { await writeFile(metadataPath, value); },
    });
    const store = createGardensStore(diskStorage(), photos);
    await store.hydrate();
    const garden = await store.createGarden(draft);
    await store.addAnalyzedPlantToGarden(garden.id, analysis, pathToFileURL(source).href);
    await rm(cache, { recursive: true });
    await rename(documents, join(root, 'new-documents'));
    documents = join(root, 'new-documents');
    const restarted = createGardensStore(diskStorage(), photos);
    await restarted.hydrate();
    const saved = restarted.getSnapshot().gardens[0].plants[0];
    assert.equal((await readFile(metadataPath, 'utf8')).includes(cache), false);
    assert.equal(await readFile(fileURLToPath(photos.resolve(saved.imageUrl)), 'utf8'), 'photo-content');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('editing garden and plant survives restart and retains analysis, photos and ids', async () => {
  const { store, storage, photos, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpg');
  await store.updateGarden(garden.id, { name: '  Sala  ', environment: 'indoor', icon: 'spa' });
  await store.updatePlant(garden.id, plant.id, { name: '  Minha jiboia  ', subtitle: '  Presente  ' });
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  const saved = restarted.getSnapshot().gardens[0];
  assert.equal(saved.id, garden.id);
  assert.equal(saved.name, 'Sala');
  assert.equal(saved.label, 'Jardim interno');
  assert.equal(saved.icon, 'spa');
  assert.deepEqual(saved.plants[0], { ...plant, name: 'Minha jiboia', subtitle: 'Presente' });
  assert.equal(files.size, 1);
  const reanalyzed = await restarted.updatePlantAnalysis(garden.id, plant.id, analysis);
  assert.equal(reanalyzed.name, 'Minha jiboia');
  assert.equal(reanalyzed.subtitle, 'Presente');
});

for (const operation of ['updateGarden', 'updatePlant', 'deleteGarden', 'deletePlant'] as const) {
  test(`${operation} failure preserves memory, saved metadata and photos and permits retry`, async () => {
    const { store, memory, files } = await fixture();
    const garden = await store.createGarden(draft);
    const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpg');
    const perform = () => {
      if (operation === 'updateGarden') return store.updateGarden(garden.id, { ...draft, name: 'Novo' });
      if (operation === 'updatePlant') return store.updatePlant(garden.id, plant.id, { name: 'Nova', subtitle: '' });
      if (operation === 'deleteGarden') return store.deleteGarden(garden.id);
      return store.deletePlant(garden.id, plant.id);
    };
    const previous = store.getSnapshot();
    const raw = memory.raw;
    memory.failWrites = 1;
    await assert.rejects(perform(), /Nenhuma alteração/);
    assert.equal(store.getSnapshot(), previous);
    assert.equal(memory.raw, raw);
    assert.equal(files.size, 1);
    await perform();
    assert.notEqual(memory.raw, raw);
  });
}

test('plant deletion recalculates stats and last deletion resets counts after restart', async () => {
  const { store, storage, photos, files } = await fixture();
  const garden = await store.createGarden(draft);
  const first = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/first.jpg');
  const second = await store.addAnalyzedPlantToGarden(garden.id, { ...analysis, vitality: 20, water: 2 }, 'file:///cache/second.jpg');
  await store.deletePlant(garden.id, first.id);
  assert.equal(store.getSnapshot().gardens[0].vitality, 20);
  assert.equal(store.getSnapshot().gardens[0].averageHydration, 20);
  assert.equal(files.size, 1);
  await store.deletePlant(garden.id, second.id);
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  const saved = restarted.getSnapshot().gardens[0];
  assert.equal(saved.plantCount, 0);
  assert.equal(saved.vitality, 0);
  assert.equal(saved.averageHydration, 0);
  assert.equal(files.size, 0);
});

test('garden deletion preserves shared photos until the final referencing garden is removed', async () => {
  const { store, storage, photos, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/shared.jpg');
  const gardens = structuredClone(store.getSnapshot().gardens);
  gardens.push({ ...gardens[0], id: 'other-garden' });
  gardens.push({ ...gardens[0], id: 'cover-garden', imageUrl: plant.imageUrl, plants: [], plantCount: 0 });
  await storage.setItem(GARDENS_STORAGE_KEY, serializeGardens(gardens));
  const restarted = createGardensStore(storage, photos);
  await restarted.hydrate();
  await restarted.deletePlant(garden.id, plant.id);
  await restarted.deleteGarden('other-garden');
  assert.equal(files.size, 1);
  await restarted.deleteGarden('cover-garden');
  assert.equal(files.size, 0);
  await restarted.deleteGarden(garden.id);
  const final = createGardensStore(storage, photos);
  await final.hydrate();
  assert.deepEqual(final.getSnapshot().gardens, []);
});

test('photo cleanup failure does not undo a committed deletion', async () => {
  const { store, storage, photos } = await fixture();
  const garden = await store.createGarden(draft);
  await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpg');
  const restarted = createGardensStore(storage, { ...photos, async remove() { throw new Error('cleanup failed'); } });
  await restarted.hydrate();
  await restarted.deleteGarden(garden.id);
  assert.deepEqual(restarted.getSnapshot().gardens, []);
  assert.deepEqual(deserializeGardens(await storage.getItem(GARDENS_STORAGE_KEY)), []);
});

test('blank names and missing targets reject edits and deletions without writing', async () => {
  const { store, memory } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addPlantToGarden(garden.id, catalog);
  const writes = memory.writes;
  await assert.rejects(store.updateGarden(garden.id, { ...draft, name: '  ' }), /nome/);
  await assert.rejects(store.updatePlant(garden.id, plant.id, { name: '  ', subtitle: '' }), /nome/);
  await assert.rejects(store.updateGarden('missing', draft), /Jardim não encontrado/);
  await assert.rejects(store.updatePlant(garden.id, 'missing', catalog), /Planta não encontrada/);
  await assert.rejects(store.deletePlant(garden.id, 'missing'), /Planta não encontrada/);
  await assert.rejects(store.deleteGarden('missing'), /Jardim não encontrado/);
  assert.equal(memory.writes, writes);
});

test('queued deletion rejects stale edits and additions without resurrecting a garden', async () => {
  const { store, memory } = await fixture();
  const garden = await store.createGarden(draft);
  const results = await Promise.allSettled([
    store.deleteGarden(garden.id),
    store.updateGarden(garden.id, draft),
    store.addPlantToGarden(garden.id, catalog),
  ]);
  assert.deepEqual(results.map((result) => result.status), ['fulfilled', 'rejected', 'rejected']);
  assert.deepEqual(deserializeGardens(memory.raw), []);
});

test('deletion keeps metadata and photo visible until storage confirms success', async () => {
  const { store, storage, files } = await fixture();
  const garden = await store.createGarden(draft);
  const plant = await store.addAnalyzedPlantToGarden(garden.id, analysis, 'file:///cache/plant.jpg');
  const entered = deferred();
  const release = deferred();
  const write = storage.setItem;
  storage.setItem = async (key, value) => { entered.resolve(); await release.promise; await write(key, value); };
  const removing = store.deletePlant(garden.id, plant.id);
  await entered.promise;
  assert.equal(store.getSnapshot().gardens[0].plantCount, 1);
  assert.equal(files.size, 1);
  release.resolve();
  await removing;
  assert.equal(store.getSnapshot().gardens[0].plantCount, 0);
  assert.equal(files.size, 0);
});
