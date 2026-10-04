import { createId } from './ids';
import { isPlantCandidate, type PlantCandidate, type PlantSpecies } from '../plant-identification/types';
import { normalizeCareDraft } from './plantHistory';
import { buildAnalyzedPlant, buildPlaceholderPlant, recalculateGardenStats } from './models';
import { deserializeGardens, GARDENS_STORAGE_KEY, serializeGardens, type GardensStorage } from './persistence';
import type { PlantPhotoStorage } from './photoStorageCore';
import type { CreateGardenDraft, GardenDetails, PlantAnalysisResult, PlantCatalogItem, GardenPlant, PlantCareType, PlantCareDraft, PlantCareRecord } from './types';

export type GardensState = {
  gardens: GardenDetails[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
};

type GardenCreateInput = CreateGardenDraft & { imageUrl: string };

export function createGardensStore(storage: GardensStorage, photos: PlantPhotoStorage) {
  let state: GardensState = { gardens: [], status: 'loading', error: null };
  let hydration: Promise<void> | null = null;
  let writes: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();

  function publish(next: GardensState) {
    state = next;
    listeners.forEach((listener) => listener());
  }

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const task = writes.then(() => {
      if (state.status !== 'ready') {
        throw new Error('Aguarde o carregamento dos jardins antes de salvar.');
      }
      return operation();
    });
    // A failed operation must not poison the queue or discard later saves.
    writes = task.catch(() => undefined);
    return task;
  }

  function findGarden(id: string) {
    const garden = state.gardens.find((item) => item.id === id);
    if (!garden) throw new Error('Jardim não encontrado.');
    return garden;
  }

  function replaceGarden(next: GardenDetails) {
    return state.gardens.map((garden) => garden.id === next.id ? next : garden);
  }

  async function cleanupPhoto(reference: string) {
    try {
      await photos.remove(reference);
    } catch {
      // Metadata is already committed (or rolled back); cleanup cannot change its result.
      console.warn('Não foi possível limpar uma foto sem uso.');
    }
  }

  async function commit(gardens: GardenDetails[], newPhoto?: string) {
    try {
      await storage.setItem(GARDENS_STORAGE_KEY, serializeGardens(gardens));
    } catch {
      if (newPhoto) await cleanupPhoto(newPhoto);
      throw new Error('Não foi possível salvar os dados. Nenhuma alteração foi confirmada. Tente novamente.');
    }
    publish({ gardens, status: 'ready', error: null });
  }

  function photoInUse(reference: string) {
    return state.gardens.some((garden) => garden.imageUrl === reference || garden.plants.some((plant) =>
      plant.imageUrl === reference || plant.lastAnalyzedPhotoUri === reference
    ));
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate(): Promise<void> {
      if (state.status === 'ready') return Promise.resolve();
      if (hydration) return hydration;
      publish({ ...state, status: 'loading', error: null });
      hydration = Promise.resolve().then(async () => {
        try {
          const raw = await storage.getItem(GARDENS_STORAGE_KEY).catch(() => {
            throw new Error('Não foi possível acessar os jardins salvos. Seus dados não foram substituídos. Tente novamente.');
          });
          const gardens = deserializeGardens(raw);
          publish({ gardens, status: 'ready', error: null });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Não foi possível carregar os jardins.';
          publish({ ...state, status: 'error', error: message });
          throw error;
        } finally {
          hydration = null;
        }
      });
      return hydration;
    },
    createGarden(input: GardenCreateInput) {
      return enqueue(async () => {
        const name = input.name.trim();
        if (!name) throw new Error('Informe um nome para o jardim.');
        const next: GardenDetails = {
          ...input,
          id: createId('garden'),
          name,
          label: input.environment === 'indoor' ? 'Jardim interno' : 'Jardim externo',
          plantCount: 0,
          vitality: null,
          averageHydration: null,
          metrics: [
            { kind: 'light', label: 'Luz', value: null },
            { kind: 'water', label: 'Água', value: null },
          ],
          plants: [],
        };
        await commit([next, ...state.gardens]);
        return next;
      });
    },
    updateGarden(gardenId: string, draft: CreateGardenDraft) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const name = draft.name.trim();
        if (!name) throw new Error('Informe um nome para o jardim.');
        const updated = {
          ...garden, name, environment: draft.environment, icon: draft.icon,
          label: draft.environment === 'indoor' ? 'Jardim interno' : 'Jardim externo',
        };
        await commit(replaceGarden(updated));
        return updated;
      });
    },
    updatePlant(gardenId: string, plantId: string, draft: Pick<GardenPlant, 'name' | 'subtitle'>) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        const name = draft.name.trim();
        if (!name) throw new Error('Informe um nome para a planta.');
        const updated = { ...plant, name, subtitle: draft.subtitle.trim() };
        await commit(replaceGarden({ ...garden, plants: garden.plants.map((item) => item.id === plantId ? updated : item) }));
        return updated;
      });
    },
    recordPlantCare(gardenId: string, plantId: string, careType: PlantCareType) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        const record: PlantCareRecord = {
          id: createId('care'), kind: 'care',
          ...normalizeCareDraft({ careType, occurredAt: new Date().toISOString() }),
        };
        const updated = { ...plant, history: [...plant.history, record] };
        await commit(replaceGarden({ ...garden, plants: garden.plants.map((item) => item.id === plantId ? updated : item) }));
        return record;
      });
    },
    updatePlantCare(gardenId: string, plantId: string, recordId: string, draft: PlantCareDraft) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        const record = plant.history.find((item) => item.id === recordId && item.kind === 'care');
        if (!record) throw new Error('Registro de cuidado não encontrado.');
        const updated = { ...record, ...normalizeCareDraft(draft) };
        const next = { ...plant, history: plant.history.map((item) => item.id === recordId ? updated : item) };
        await commit(replaceGarden({ ...garden, plants: garden.plants.map((item) => item.id === plantId ? next : item) }));
      });
    },
    deletePlantCare(gardenId: string, plantId: string, recordId: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        if (!plant.history.some((item) => item.id === recordId && item.kind === 'care')) {
          throw new Error('Registro de cuidado não encontrado.');
        }
        const next = { ...plant, history: plant.history.filter((item) => item.id !== recordId) };
        await commit(replaceGarden({ ...garden, plants: garden.plants.map((item) => item.id === plantId ? next : item) }));
      });
    },
    deletePlant(gardenId: string, plantId: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        await commit(replaceGarden(recalculateGardenStats({ ...garden, plants: garden.plants.filter((item) => item.id !== plantId) })));
        for (const photo of new Set([plant.imageUrl, plant.lastAnalyzedPhotoUri])) {
          if (photo && !photoInUse(photo)) await cleanupPhoto(photo);
        }
      });
    },
    deleteGarden(gardenId: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const oldPhotos = new Set([garden.imageUrl, ...garden.plants.flatMap((plant) => [plant.imageUrl, plant.lastAnalyzedPhotoUri])]);
        await commit(state.gardens.filter((item) => item.id !== gardenId));
        for (const photo of oldPhotos) {
          if (photo && !photoInUse(photo)) await cleanupPhoto(photo);
        }
      });
    },
    addPlantToGarden(gardenId: string, item: PlantCatalogItem) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = buildPlaceholderPlant(item);
        await commit(replaceGarden(recalculateGardenStats({ ...garden, plants: [...garden.plants, plant] })));
        return plant;
      });
    },
    savePlantIdentification(gardenId: string, candidate: PlantCandidate, photoUri: string, reviewedName: string, plantId?: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const previous = plantId ? garden.plants.find((plant) => plant.id === plantId) : undefined;
        if (plantId && !previous) throw new Error('Planta não encontrada.');
        if (!isPlantCandidate(candidate)) throw new Error('Identificação inválida. Escolha outra foto.');
        const name = reviewedName.trim();
        if (!name) throw new Error('Informe um nome para a planta.');
        const occurredAt = new Date().toISOString();
        const species: PlantSpecies = { ...candidate, source: 'plantnet', identifiedAt: occurredAt };
        const photo = await photos.save(photoUri);
        const base = previous ?? buildPlaceholderPlant({
          id: '', name, subtitle: candidate.commonName, category: 'all', categoryLabel: '', imageUrl: photo,
        });
        const plant: GardenPlant = {
          ...base, name: previous?.name ?? name, imageUrl: photo, species,
          history: [...base.history, { id: createId('identification'), kind: 'identification', occurredAt, species }],
        };
        const plants = previous ? garden.plants.map((item) => item.id === plantId ? plant : item) : [...garden.plants, plant];
        await commit(replaceGarden(recalculateGardenStats({ ...garden, plants })), photo);
        if (previous?.imageUrl && !photoInUse(previous.imageUrl)) await cleanupPhoto(previous.imageUrl);
        return plant;
      });
    },
    addAnalyzedPlantToGarden(gardenId: string, analysis: PlantAnalysisResult, photoUri: string, reviewedName?: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const name = reviewedName?.trim() ?? analysis.plantName;
        if (!name) throw new Error('Informe um nome para a planta.');
        const photo = await photos.save(photoUri);
        const plant = { ...buildAnalyzedPlant(analysis, photo), name };
        await commit(replaceGarden(recalculateGardenStats({ ...garden, plants: [...garden.plants, plant] })), photo);
        return plant;
      });
    },
    updatePlantAnalysis(gardenId: string, plantId: string, analysis: PlantAnalysisResult, photoUri?: string) {
      return enqueue(async () => {
        const garden = findGarden(gardenId);
        const plant = garden.plants.find((item) => item.id === plantId);
        if (!plant) throw new Error('Planta não encontrada.');
        const photo = photoUri ? await photos.save(photoUri) : undefined;
        const analyzed = buildAnalyzedPlant(analysis, photo ?? plant.imageUrl);
        const updated = {
          ...plant,
          ...analyzed,
          id: plant.id,
          history: [...plant.history, ...analyzed.history],
          name: plant.name,
          subtitle: plant.subtitle,
          lastAnalyzedPhotoUri: photo ?? plant.lastAnalyzedPhotoUri,
        };
        await commit(replaceGarden(recalculateGardenStats({
          ...garden,
          plants: garden.plants.map((item) => item.id === plantId ? updated : item),
        })), photo);
        if (photo) {
          const oldPhotos = new Set([plant.imageUrl, plant.lastAnalyzedPhotoUri]);
          for (const old of oldPhotos) {
            if (old && !photoInUse(old)) await cleanupPhoto(old);
          }
        }
        return updated;
      });
    },
  };
}
