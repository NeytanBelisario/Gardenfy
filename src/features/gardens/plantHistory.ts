import type { GardenPlant, PlantAnalysisRecord, PlantCareDraft, PlantHistoryEntry } from './types';

export const careLabels = { water: 'Rega', fertilize: 'Adubação' } as const;

export function isHistoryDate(value: unknown): value is string {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function normalizeCareDraft(draft: PlantCareDraft): PlantCareDraft {
  if (draft.careType !== 'water' && draft.careType !== 'fertilize') {
    throw new Error('Escolha rega ou adubação.');
  }
  if (!isHistoryDate(draft.occurredAt)) {
    throw new Error('Informe uma data e hora válidas para o cuidado.');
  }
  return { careType: draft.careType, occurredAt: new Date(draft.occurredAt).toISOString() };
}

export function buildAnalysisRecord(plant: GardenPlant, id: string): PlantAnalysisRecord {
  if (!plant.lastAnalyzedAt) throw new Error('A análise não possui data.');
  return {
    id, kind: 'analysis', occurredAt: new Date(plant.lastAnalyzedAt).toISOString(),
    snapshot: {
      plantName: plant.identifiedName ?? plant.name,
      health: plant.status.label,
      vitality: plant.vitality,
      growthDays: plant.growthDays,
      metrics: plant.metrics.map((metric) => ({ ...metric })),
    },
  };
}

export function sortPlantHistory(history: PlantHistoryEntry[]) {
  // Reverse before stable sorting so later insertions win timestamp ties.
  return [...history].reverse().sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export function formatHistoryDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function careDateFields(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, '0');
  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function parseCareDateFields(date: string, time: string) {
  const dateMatch = date.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const timeMatch = time.trim().match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) throw new Error('Use DD/MM/AAAA e HH:mm.');
  const [, day, month, year] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day ||
      parsed.getHours() !== hour || parsed.getMinutes() !== minute) {
    throw new Error('Informe uma data e hora válidas para o cuidado.');
  }
  return parsed.toISOString();
}
