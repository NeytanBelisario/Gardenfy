export type GardenMetricKind = 'light' | 'water';

export type GardenMetric = {
  kind: GardenMetricKind;
  label: string;
  value: number;
};

export type GardenAlert = {
  label: string;
  tone: 'danger' | 'warning';
};

export type GardenEnvironment = 'indoor' | 'outdoor';

export type GardenSummary = {
  id: string;
  name: string;
  plantCount: number;
  vitality: number;
  imageUrl: string;
  environment: GardenEnvironment;
  alert?: GardenAlert;
  metrics: GardenMetric[];
};

export type CreateGardenDraft = {
  name: string;
  environment: GardenEnvironment;
  icon: string;
};
