import { buildAnalysisRecord, isHistoryDate } from './plantHistory';
import { recalculateGardenStats } from './models';
import { gardenIconOptions } from './iconNames';
import { isValidPhotoReference } from './photoStorageCore';
import type { GardenDetails } from './types';

export const GARDENS_STORAGE_KEY = '@gardenfy/gardens';
export const GARDENS_SCHEMA_VERSION = 3;

export interface GardensStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown, max = Number.MAX_VALUE) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
}

function isImage(value: unknown) {
  return isString(value) && isValidPhotoReference(value);
}

function optional(value: unknown, validate: (value: unknown) => boolean) {
  return value === undefined || validate(value);
}

function hasUniqueIds(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length;
}

function isMetrics(value: unknown, nullable = true) {
  return Array.isArray(value) && value.every((metric) =>
    isRecord(metric) && ['light', 'water'].includes(String(metric.kind)) &&
    isString(metric.label) && (nullable && metric.value === null || isNumber(metric.value, 100))
  );
}

function isHistory(value: unknown) {
  return Array.isArray(value) && value.every((entry) => {
    if (!isRecord(entry) || !isString(entry.id) || !entry.id || !isHistoryDate(entry.occurredAt)) return false;
    if (entry.kind === 'care') return entry.careType === 'water' || entry.careType === 'fertilize';
    if (entry.kind !== 'analysis' || !isRecord(entry.snapshot)) return false;
    const snapshot = entry.snapshot;
    return isString(snapshot.plantName) && isString(snapshot.health) &&
      optional(snapshot.vitality, (value) => isNumber(value, 100)) &&
      optional(snapshot.growthDays, isNumber) && isMetrics(snapshot.metrics);
  }) && hasUniqueIds(value);
}

function isPlant(value: unknown, nullable = true, historyRequired = true) {
  return isRecord(value) && isString(value.id) && value.id.length > 0 &&
    isString(value.name) && isString(value.subtitle) && isImage(value.imageUrl) &&
    optional(value.identifiedName, isString) &&
    optional(value.vitality, (number) => isNumber(number, 100)) &&
    optional(value.growthDays, isNumber) &&
    optional(value.lastAnalyzedPhotoUri, isImage) &&
    optional(value.lastAnalyzedAt, (date) => isString(date) && Number.isFinite(Date.parse(date))) &&
    isRecord(value.status) && isString(value.status.label) &&
    ['vital', 'stable', 'dry'].includes(String(value.status.tone)) && isMetrics(value.metrics, nullable) && (!historyRequired || isHistory(value.history));
}

function isGarden(value: unknown, nullable = true, historyRequired = true): value is GardenDetails {
  return isRecord(value) && isString(value.id) && value.id.length > 0 &&
    isString(value.name) && isString(value.label) && isImage(value.imageUrl) &&
    gardenIconOptions.some((icon) => icon === value.icon) &&
    ['indoor', 'outdoor'].includes(String(value.environment)) &&
    isNumber(value.plantCount) && Number.isInteger(value.plantCount) &&
    (nullable && value.vitality === null || isNumber(value.vitality, 100)) &&
    (nullable && value.averageHydration === null || isNumber(value.averageHydration, 100)) &&
    optional(value.alert, (alert) => isRecord(alert) && isString(alert.label) &&
      ['danger', 'warning'].includes(String(alert.tone))) &&
    isMetrics(value.metrics, nullable) && Array.isArray(value.plants) &&
    value.plants.every((plant) => isPlant(plant, nullable, historyRequired)) && hasUniqueIds(value.plants) &&
    value.plantCount === value.plants.length;
}

export function serializeGardens(gardens: GardenDetails[]) {
  if (!gardens.every((garden) => isGarden(garden)) || !hasUniqueIds(gardens)) {
    throw new Error('Os dados do jardim são inválidos e não foram salvos.');
  }
  return JSON.stringify({ version: GARDENS_SCHEMA_VERSION, gardens });
}

export function deserializeGardens(raw: string | null): GardenDetails[] {
  if (raw === null) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Os dados salvos não puderam ser lidos. Eles foram preservados.');
  }
  if (!isRecord(data) || (data.version !== 1 && data.version !== 2 && data.version !== GARDENS_SCHEMA_VERSION)) {
    throw new Error('A versão dos dados salvos não é compatível com este app. Eles foram preservados.');
  }
  if (!Array.isArray(data.gardens) || !data.gardens.every((garden) => isGarden(garden, data.version !== 1, data.version === GARDENS_SCHEMA_VERSION)) || !hasUniqueIds(data.gardens)) {
    throw new Error('Os dados salvos estão incompletos ou inválidos. Eles foram preservados.');
  }
  let gardens = data.gardens;
  if (data.version === 1) {
    gardens = gardens.map((garden) => recalculateGardenStats({
      ...garden,
      metrics: garden.metrics.map((metric) => ({
        ...metric, label: metric.kind === 'light' ? 'Luz' : 'Água',
      })),
      plants: garden.plants.map((plant) => ({
        ...plant,
        // Legacy catalog entries have no vitality; their zeros were placeholders.
        metrics: plant.metrics.map((metric) => ({
          ...metric,
          label: metric.kind === 'light' ? 'Luz' : 'Água',
          value: typeof plant.vitality === 'number' ? metric.value : null,
        })),
      })),
    }));
  }
  if (data.version !== GARDENS_SCHEMA_VERSION) {
    gardens = gardens.map((garden) => ({
      ...garden,
      plants: garden.plants.map((plant) => ({
        ...plant,
        // Older schemas stored only the latest analysis, not a full timeline.
        history: plant.lastAnalyzedAt
          ? [buildAnalysisRecord(plant, `analysis-${plant.id}-legacy`)]
          : [],
      })),
    }));
  }
  return gardens;
}
