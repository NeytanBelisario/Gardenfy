import type { GardenIconName } from './icons';

export type GardenMetricKind = 'light' | 'water';

export type GardenMetric = {
  kind: GardenMetricKind;
  label: string;
  value: number;
};

export type PlantHealthTone = 'vital' | 'stable' | 'dry';

export type GardenPlant = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  identifiedName?: string;
  vitality?: number;
  growthDays?: number;
  lastAnalyzedPhotoUri?: string;
  lastAnalyzedAt?: string;
  status: {
    label: string;
    tone: PlantHealthTone;
  };
  metrics: GardenMetric[];
};

export type PlantAnalysisResult = {
  plantName: string;
  health: 'Excelente' | 'Boa' | 'Regular' | 'Ruim' | 'Critica';
  vitality: number;
  water: number;
  light: number;
  growthDays: number;
};

export type PlantCatalogCategory =
  | 'all'
  | 'ferns'
  | 'succulents'
  | 'foliage'
  | 'small-trees'
  | 'resilient';

export type PlantCatalogItem = {
  id: string;
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
  vitality: number;
  imageUrl: string;
  icon: GardenIcon;
  environment: GardenEnvironment;
  alert?: GardenAlert;
  metrics: GardenMetric[];
};

export type GardenDetails = GardenSummary & {
  averageHydration: number;
  plants: GardenPlant[];
};

export type CreateGardenDraft = {
  name: string;
  environment: GardenEnvironment;
  icon: GardenIcon;
};
