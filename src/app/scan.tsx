import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';

export default function ScanRoute() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />

      <View style={styles.content}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={() => router.push('/gardens' as never)}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="image-outline" size={34} color="#17361d" />
          </View>
          <Text style={styles.actionTitle}>Diagnostico por foto</Text>
          <Text style={styles.actionSubtitle}>Abrir a tela de analise que estava no scan.</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          onPress={() => router.push('/preview')}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="scan" size={34} color="#17361d" />
          </View>
          <Text style={styles.actionTitle}>Preview AR</Text>
          <Text style={styles.actionSubtitle}>Abrir a tela de realidade aumentada.</Text>
        </Pressable>
      </View>

      <AppNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fbf9f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 96,
    gap: 18,
  },
  actionButton: {
    minHeight: 176,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  actionButtonPressed: {
    opacity: 0.86,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eae8e4',
    marginBottom: 18,
  },
  actionTitle: {
    color: '#17361d',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  actionSubtitle: {
    marginTop: 8,
    color: '#476644',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
});
