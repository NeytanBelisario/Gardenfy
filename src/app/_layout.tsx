import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GardensBootstrap } from '../features/gardens/GardensBootstrap';

export default function AppLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setStyle('light');
  }, []);
  return <><StatusBar style="dark" /><GardensBootstrap><Slot /></GardensBootstrap></>;
}
