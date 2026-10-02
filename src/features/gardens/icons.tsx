import React from 'react';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import type { GardenIconName } from './iconNames';

export { gardenIconOptions, type GardenIconName } from './iconNames';

export function GardenIdentityIcon({
  icon,
  color,
  size = 30,
}: {
  icon: GardenIconName;
  color: string;
  size?: number;
}) {
  switch (icon) {
    case 'potted-plant':
      return <MaterialCommunityIcons name="sprout" size={size} color={color} />;
    case 'psychology':
      return <MaterialIcons name="psychology" size={size} color={color} />;
    case 'eco':
      return <MaterialIcons name="eco" size={size} color={color} />;
    case 'wb-sunny':
      return <Ionicons name="sunny-outline" size={size} color={color} />;
    case 'water-drop':
      return <Ionicons name="water-outline" size={size} color={color} />;
    case 'energy-savings-leaf':
      return <MaterialIcons name="energy-savings-leaf" size={size} color={color} />;
    case 'spa':
      return <MaterialIcons name="spa" size={size} color={color} />;
    case 'filter-vintage':
      return <MaterialIcons name="filter-vintage" size={size} color={color} />;
  }
}
