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
  status: {
    label: string;
    tone: PlantHealthTone;
  };
  metrics: GardenMetric[];
};

export type GardenAlert = {
  label: string;
  tone: 'danger' | 'warning';
};

export type GardenEnvironment = 'indoor' | 'outdoor';

export type GardenSummary = {
  id: string;
  name: string;
  label: string;
  plantCount: number;
  vitality: number;
  imageUrl: string;
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
  icon: string;
};
