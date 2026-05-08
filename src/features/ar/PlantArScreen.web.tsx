import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/shell/AppHeader';

export function PlantArScreen() {
  return (
    <View style={styles.screen}>
      <AppHeader mode="back" />
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Realidade aumentada indisponivel</Text>
        <Text style={styles.fallbackText}>
          A experiencia AR precisa rodar em Android ou iOS.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#11191d',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTitle: {
    color: '#f4f8ee',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackText: {
    marginTop: 12,
    color: '#d0dccd',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
