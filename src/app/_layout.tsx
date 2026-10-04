import React from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GardensBootstrap } from '../features/gardens/GardensBootstrap';

export default function AppLayout() {
  return <><StatusBar style="dark" /><GardensBootstrap><Slot /></GardensBootstrap></>;
}
