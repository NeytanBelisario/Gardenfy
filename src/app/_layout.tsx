import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GardensBootstrap } from '../features/gardens/GardensBootstrap';

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
      {Platform.OS === 'android' && !keyboardVisible ? <View pointerEvents="none" accessible={false} style={[styles.systemInset, { height: insets.bottom }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  systemInset: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fbf9f5' },
});
