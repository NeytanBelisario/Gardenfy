import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPlantCareProfile } from './careProfiles';
import { currentCareEstimate } from './careEstimate';
import { spotLabel } from './light';
import type { GardenPlant } from './types';

const careTopics = [
  { key: 'light', icon: 'sunny-outline', title: 'Luz', tint: '#fdf3d7', color: '#9a6700' },
  { key: 'watering', icon: 'water-outline', title: 'Rega', tint: '#e2eff6', color: '#2f6f8f' },
  { key: 'soil', icon: 'layers-outline', title: 'Substrato', tint: '#f2e9df', color: '#7a5a3c' },
  { key: 'growth', icon: 'trending-up-outline', title: 'Crescimento', tint: '#e6f0e1', color: '#476644' },
] as const;

export function PlantCareInstructions({ plant }: { plant: GardenPlant }) {
  const profile = getPlantCareProfile(plant);
  const estimate = currentCareEstimate(plant);
  const [linkError, setLinkError] = useState<string>();
  if (!profile) {
    return (
      <View style={styles.empty}>
        <View style={[styles.icon, { backgroundColor: '#eef2e8' }]}><Ionicons name="book-outline" size={22} color="#476644" /></View>
        <Text style={styles.label}>Ainda sem ficha para esta espécie</Text>
        <Text style={styles.textCenter}>Você já pode registrar regas e adubações. Nenhuma orientação é criada automaticamente a partir da foto.</Text>
        {estimate?.known ? (
          <View style={styles.note}>
            <Ionicons name="sparkles-outline" size={18} color="#5b3f86" />
            <Text style={styles.noteText}>
              Estimativa da IA para {estimate.scientificName}: regar a cada {estimate.wateringDays.min === estimate.wateringDays.max ? estimate.wateringDays.min : estimate.wateringDays.min + ' a ' + estimate.wateringDays.max} dias,{' '}
              de preferência em {(['bright', 'sun', 'shade'] as const).filter((spot) => estimate.lightFit[spot] === 'ideal').map((spot) => spotLabel(spot).toLowerCase()).join(' ou ')}. É uma referência da espécie, não uma medição: confira o substrato e ajuste a frequência se precisar.
            </Text>
          </View>
        ) : estimate ? <Text style={styles.textCenter}>A IA não reconheceu esta espécie com segurança, então as barras dependem da frequência que você definir.</Text> : null}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.lead}>{profile.description}</Text>
      <View style={styles.list}>
        {careTopics.map((topic, index) => (
          <View key={topic.key} style={[styles.row, index > 0 && styles.divider]}>
            <View style={[styles.icon, { backgroundColor: topic.tint }]}><Ionicons name={topic.icon} size={20} color={topic.color} /></View>
            <View style={styles.copy}>
              <Text style={styles.label}>{topic.title}</Text>
              <Text style={styles.text}>{profile[topic.key]}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color="#586653" />
        <Text style={styles.noteText}>Orientações gerais da espécie. Observe sua planta e o substrato para ajustar ao seu ambiente.</Text>
      </View>
      <Pressable accessibilityRole="link" accessibilityLabel="Consultar fonte das orientações: NC State Extension" onPress={() => {
        setLinkError(undefined);
        void Linking.openURL(profile.sourceUrl).catch(() => setLinkError('Não foi possível abrir a fonte agora. Confira sua conexão.'));
      }} style={styles.source}>
        <Text style={styles.sourceText}>Fonte: NC State Extension</Text>
        <Ionicons name="open-outline" size={16} color="#476644" />
      </Pressable>
      {linkError ? <Text accessibilityRole="alert" style={styles.noteText}>{linkError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  lead: { fontSize: 16, lineHeight: 25, color: '#33452f' },
  list: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#e7e9e0', paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 14, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: '#eef0e8' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  copy: { flex: 1, gap: 3 },
  label: { fontSize: 15, fontWeight: '700', color: '#17361d' },
  text: { fontSize: 14, lineHeight: 22, color: '#586653' },
  textCenter: { fontSize: 14, lineHeight: 22, color: '#586653', textAlign: 'center' },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 14, backgroundColor: '#f1f3ec' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20, color: '#586653' },
  source: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  sourceText: { color: '#476644', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 10, padding: 20, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e9e0' },
});
