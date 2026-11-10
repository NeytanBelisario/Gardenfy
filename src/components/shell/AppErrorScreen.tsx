import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type ErrorBoundaryProps } from 'expo-router';
import { Button } from '../ui/Button';
import { colors, font, space } from '../../theme/tokens';

/**
 * Ponto único de relato de falhas. Hoje só registra em desenvolvimento;
 * o serviço de monitoramento (ex.: Sentry) entra aqui quando houver conta.
 */
export function reportError(error: unknown) {
  if (__DEV__) console.error('[Gardenfy] erro na tela', error);
}

/** Tela mostrada quando uma rota quebra, no lugar da tela vermelha ou do app fechando. */
export function AppErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();
  useEffect(() => { reportError(error); }, [error]);
  const goHome = () => { router.replace('/'); void retry(); };
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.icon}><Ionicons name="leaf-outline" size={40} color={colors.ink} /></View>
      <Text accessibilityRole="header" style={styles.title}>Algo deu errado nesta tela</Text>
      <Text style={styles.text}>Seus jardins e plantas continuam salvos no aparelho. Tente de novo ou volte ao início.</Text>
      {__DEV__ ? <Text selectable style={styles.detail}>{error.message}</Text> : null}
      <View style={styles.actions}>
        <Button label="Tentar de novo" icon="refresh" onPress={() => { void retry(); }} />
        <Button label="Voltar ao início" variant="secondary" onPress={goHome} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: space.xxl, gap: space.lg },
  icon: { width: 80, height: 80, borderRadius: 26, backgroundColor: colors.leafTint, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: font.title, fontWeight: '800', textAlign: 'center' },
  text: { color: colors.text, fontSize: font.body, lineHeight: 23, textAlign: 'center', maxWidth: 360 },
  detail: { color: colors.danger, fontSize: font.caption, textAlign: 'center' },
  actions: { width: '100%', maxWidth: 360, gap: space.md },
});
