import { gardenIconOptions } from './iconNames';
import { isValidPhotoReference } from './photoStorageCore';
import type { GardenDetails } from './types';

export const GARDENS_STORAGE_KEY = '@gardenfy/gardens';
export const GARDENS_SCHEMA_VERSION = 1;

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

function isMetrics(value: unknown) {
  return Array.isArray(value) && value.every((metric) =>
    isRecord(metric) && ['light', 'water'].includes(String(metric.kind)) &&
    isString(metric.label) && isNumber(metric.value, 100)
  );
}

function isPlant(value: unknown) {
  return isRecord(value) && isString(value.id) && value.id.length > 0 &&
    isString(value.name) && isString(value.subtitle) && isImage(value.imageUrl) &&
    optional(value.identifiedName, isString) &&
    optional(value.vitality, (number) => isNumber(number, 100)) &&
    optional(value.growthDays, isNumber) &&
    optional(value.lastAnalyzedPhotoUri, isImage) &&
    optional(value.lastAnalyzedAt, (date) => isString(date) && Number.isFinite(Date.parse(date))) &&
    isRecord(value.status) && isString(value.status.label) &&
    ['vital', 'stable', 'dry'].includes(String(value.status.tone)) && isMetrics(value.metrics);
}

function isGarden(value: unknown): value is GardenDetails {
  return isRecord(value) && isString(value.id) && value.id.length > 0 &&
    isString(value.name) && isString(value.label) && isImage(value.imageUrl) &&
    gardenIconOptions.some((icon) => icon === value.icon) &&
    ['indoor', 'outdoor'].includes(String(value.environment)) &&
    isNumber(value.plantCount) && Number.isInteger(value.plantCount) &&
    isNumber(value.vitality, 100) && isNumber(value.averageHydration, 100) &&
    optional(value.alert, (alert) => isRecord(alert) && isString(alert.label) &&
      ['danger', 'warning'].includes(String(alert.tone))) &&
    isMetrics(value.metrics) && Array.isArray(value.plants) &&
    value.plants.every(isPlant) && hasUniqueIds(value.plants) &&
    value.plantCount === value.plants.length;
}

export function serializeGardens(gardens: GardenDetails[]) {
  if (!gardens.every(isGarden) || !hasUniqueIds(gardens)) {
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
  if (!isRecord(data) || data.version !== GARDENS_SCHEMA_VERSION) {
    throw new Error('A versão dos dados salvos não é compatível com este app. Eles foram preservados.');
  }
  if (!Array.isArray(data.gardens) || !data.gardens.every(isGarden) || !hasUniqueIds(data.gardens)) {
    throw new Error('Os dados salvos estão incompletos ou inválidos. Eles foram preservados.');
  }
  return data.gardens;
}
