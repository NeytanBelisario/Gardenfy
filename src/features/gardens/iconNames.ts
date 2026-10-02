export const gardenIconOptions = [
  'potted-plant',
  'psychology',
  'eco',
  'wb-sunny',
  'water-drop',
  'energy-savings-leaf',
  'spa',
  'filter-vintage',
] as const;

export type GardenIconName = (typeof gardenIconOptions)[number];
