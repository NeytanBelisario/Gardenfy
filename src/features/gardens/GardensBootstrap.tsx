import React, { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { hydrateGardensStore, useGardensState } from './store';
import { colors } from '../../theme/tokens';

function loadGardens() {
  // The store publishes the error so the user can retry without clearing storage.
  void hydrateGardensStore().catch(() => undefined);
}

export function GardensBootstrap({ children }: { children: ReactNode }) {
  const { status, error } = useGardensState();
  useEffect(loadGardens, []);

  if (status === 'ready') return children;
  return (
    <View style={styles.screen}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={colors.ink} />
          <Text style={styles.title}>Carregando seus jardins...</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Não foi possível abrir seus jardins</Text>
          <Text accessibilityRole="alert" style={styles.message}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={loadGardens} style={styles.button}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 20 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: { color: '#5f675d', fontSize: 16, textAlign: 'center' },
  button: { backgroundColor: colors.ink, borderRadius: 14, padding: 16 },
  buttonText: { color: colors.onInk, fontWeight: '700' },
});
