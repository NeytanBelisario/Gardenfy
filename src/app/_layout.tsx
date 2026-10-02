import React from 'react';
import { Slot } from 'expo-router';

import { GardensBootstrap } from '../features/gardens/GardensBootstrap';

export default function AppLayout() {
  return <GardensBootstrap><Slot /></GardensBootstrap>;
}
