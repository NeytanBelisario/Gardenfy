import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessToastHost } from '../components/shell/SuccessToastHost';
import { AppErrorScreen } from '../components/shell/AppErrorScreen';
import { ReminderSync } from '../features/reminders/ReminderSync';
import { CareEstimateSync } from '../features/gardens/CareEstimateSync';
import { GardensBootstrap } from '../features/gardens/GardensBootstrap';
import { colors } from '../theme/tokens';

// Erros de renderização nas telas caem aqui (expo-router), sem fechar o app.
export const ErrorBoundary = AppErrorScreen;

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setStyle('light');
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <GardensBootstrap><Slot /></GardensBootstrap>
      {Platform.OS === 'android' && !keyboardVisible ? <View accessible={false} style={[styles.systemInset, { height: insets.bottom }]} /> : null}
      <SuccessToastHost />
      <ReminderSync />
      <CareEstimateSync />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  systemInset: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, pointerEvents: 'none' },
});
