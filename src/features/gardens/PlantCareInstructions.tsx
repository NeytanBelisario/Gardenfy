import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlantCareProfile } from './careProfiles';
import type { GardenPlant } from './types';

export function PlantCareInstructions({ plant }: { plant: GardenPlant }) {
  const profile = getPlantCareProfile(plant);
  const [linkError, setLinkError] = useState<string>();
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>Conheça sua planta</Text>
      {profile ? <>
        <Text style={styles.caption}>{profile.scientificName}</Text>
        <Text style={styles.text}>{profile.description}</Text>
        {([
          ['sunny-outline', 'Luz recomendada', profile.light],
          ['water-outline', 'Como regar', profile.watering],
          ['leaf-outline', 'Substrato', profile.soil],
          ['trending-up-outline', 'Crescimento', profile.growth],
        ] as const).map(([icon, title, text]) => <View key={title} style={styles.row}>
          <View style={styles.icon}><Ionicons name={icon} size={22} color="#476644" /></View>
          <View style={styles.copy}><Text style={styles.label}>{title}</Text><Text style={styles.text}>{text}</Text></View>
        </View>)}
        <Text style={styles.caption}>Orientações gerais da espécie. Observe sua planta e o substrato para ajustar os cuidados ao ambiente.</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Consultar fonte das orientações: NC State Extension" onPress={() => {
          setLinkError(undefined);
          void Linking.openURL(profile.sourceUrl).catch(() => setLinkError('Não foi possível abrir a fonte agora. Confira sua conexão.'));
        }} style={styles.source}><Text style={styles.sourceText}>Fonte: NC State Extension ↗</Text></Pressable>
        {linkError ? <Text accessibilityRole="alert" style={styles.caption}>{linkError}</Text> : null}
      </> : <>
        <Text style={styles.text}>Ainda não temos uma ficha de cuidados para esta espécie.</Text>
        <Text style={styles.caption}>Você já pode registrar regas e adubações. Nenhuma orientação específica será criada automaticamente a partir da foto.</Text>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e7e9e0', gap: 14 },
  heading: { fontSize: 22, fontWeight: '800', color: '#17361d' },
  label: { fontSize: 15, fontWeight: '700', color: '#17361d' },
  text: { fontSize: 15, lineHeight: 24, color: '#586653' },
  caption: { fontSize: 13, lineHeight: 21, color: '#586653' },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 5 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#eef2e8' },
  copy: { flex: 1, gap: 5 },
  source: { minHeight: 44, justifyContent: 'center' },
  sourceText: { color: '#476644', fontSize: 13, fontWeight: '700' },
});
