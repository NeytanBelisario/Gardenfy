import type { GardenIconName } from './iconNames';
import type { PlantSpecies } from '../plant-identification/types';

export type GardenMetricKind = 'light' | 'water';

export type GardenMetric = {
  kind: GardenMetricKind;
  label: string;
  value: number | null;
};

export type PlantHealthTone = 'vital' | 'stable' | 'dry';

export type GardenPlant = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  identifiedName?: string;
  species?: PlantSpecies;
  vitality?: number;
  growthDays?: number;
  lastAnalyzedPhotoUri?: string;
  lastAnalyzedAt?: string;
  status: {
    label: string;
    tone: PlantHealthTone;
  };
  metrics: GardenMetric[];
  history: PlantHistoryEntry[];
};

export type PlantAnalysisResult = {
  plantName: string;
  health: 'Excelente' | 'Boa' | 'Regular' | 'Ruim' | 'Critica';
  vitality: number;
  water: number;
  light: number;
  growthDays: number;
};

export type PlantCareType = 'water' | 'fertilize';

export type PlantCareRecord = {
  id: string;
  kind: 'care';
  careType: PlantCareType;
  occurredAt: string;
};

export type PlantAnalysisRecord = {
  id: string;
  kind: 'analysis';
  occurredAt: string;
  snapshot: {
    plantName: string;
    health: string;
    vitality?: number;
    growthDays?: number;
    metrics: GardenMetric[];
  };
};

export type PlantIdentificationRecord = {
  id: string;
  kind: 'identification';
  occurredAt: string;
  species: PlantSpecies;
};

export type PlantHistoryEntry = PlantCareRecord | PlantAnalysisRecord | PlantIdentificationRecord;
export type PlantCareDraft = Pick<PlantCareRecord, 'careType' | 'occurredAt'>;

export type PlantCatalogCategory =
  | 'all'
  | 'ferns'
  | 'succulents'
  | 'foliage'
  | 'small-trees'
  | 'resilient';

export type PlantCatalogItem = {
  id: string;
  scientificName?: string;
  name: string;
  subtitle: string;
  categoryLabel: string;
  category: PlantCatalogCategory;
  imageUrl: string;
  featured?: boolean;
  compact?: boolean;
};

export type GardenAlert = {
  label: string;
  tone: 'danger' | 'warning';
};

export type GardenEnvironment = 'indoor' | 'outdoor';

export type GardenIcon = GardenIconName;

export type GardenSummary = {
  id: string;
  name: string;
  label: string;
  plantCount: number;
  vitality: number | null;
  imageUrl: string;
  icon: GardenIcon;
  environment: GardenEnvironment;
  alert?: GardenAlert;
  metrics: GardenMetric[];
};

export type GardenDetails = GardenSummary & {
  averageHydration: number | null;
  plants: GardenPlant[];
};

export type CreateGardenDraft = {
  name: string;
  environment: GardenEnvironment;
  icon: GardenIcon;
};
