import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LightFit } from './careProfiles';
import { getCareReference } from './careEstimate';
import { lightFitLabels, lightSpotOptions } from './light';
import { setPlantLightSpot } from './store';
import type { GardenPlant, PlantLightSpot } from './types';

const fitColors: Record<LightFit, { bg: string; fg: string }> = {
  ideal: { bg: '#e2f0dc', fg: '#2f6b2a' },
  ok: { bg: '#fbf0d6', fg: '#8a5f00' },
  poor: { bg: '#fbe3dd', fg: '#a3321f' },
};

export function LightSpotDialog({ gardenId, plant, onClose }: { gardenId: string; plant: GardenPlant; onClose: () => void }) {
  const reference = getCareReference(plant);
  const lightFit = reference?.lightFit;
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (spot: PlantLightSpot | undefined) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { await setPlantLightSpot(gardenId, plant.id, spot); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.'); busyRef.current = false; setBusy(false); }
  };
  const dismiss = () => { if (!busyRef.current) onClose(); };

  return (
    <Modal transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>Onde {plant.name} fica?</Text>
            <Text style={styles.text}>{lightFit ? 'Escolha o local mais parecido. Mostramos como cada um combina com a espécie' + (reference?.source === 'ai' ? ', pela estimativa da IA (referência, não medição).' : '.') : 'Escolha o local mais parecido. Sem ficha da espécie, não dá para comparar com o que ela prefere.'}</Text>
            {lightSpotOptions.map((option) => {
              const selected = plant.lightSpot === option.spot;
              const fit = lightFit?.[option.spot];
              return (
                <Pressable key={option.spot} accessibilityRole="button" accessibilityLabel={option.label + (fit ? ', ' + lightFitLabels[fit] + ' para esta espécie' : '')} accessibilityState={{ selected, disabled: busy }} disabled={busy} onPress={() => save(option.spot)} style={[styles.option, selected && styles.optionSelected, busy && styles.disabled]}>
                  <View style={styles.optionIcon}><Ionicons name={option.icon} size={24} color="#9a6700" /></View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionHint}>{option.hint}</Text>
                  </View>
                  {fit ? <View style={[styles.badge, { backgroundColor: fitColors[fit].bg }]}><Text style={[styles.badgeText, { color: fitColors[fit].fg }]}>{lightFitLabels[fit]}</Text></View> : null}
                  {selected ? <Ionicons name="checkmark-circle" size={22} color="#17361d" /> : null}
                </Pressable>
              );
            })}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {plant.lightSpot ? (
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => save(undefined)} style={styles.secondary}>
                <Text style={styles.secondaryText}>Limpar local</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={dismiss} style={styles.secondary}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,28,17,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: '#fbf9f5', borderRadius: 24 },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#17361d' },
  text: { fontSize: 15, lineHeight: 23, color: '#586653', marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#dfe3d8', backgroundColor: '#fff' },
  optionSelected: { borderColor: '#17361d', borderWidth: 2, padding: 13 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf3d7' },
  optionCopy: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#17361d' },
  optionHint: { fontSize: 13, lineHeight: 19, color: '#586653' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  secondary: { minHeight: 48, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#c2c8bf' },
  secondaryText: { color: '#17361d', fontWeight: '700', fontSize: 15 },
  error: { color: '#93000a', fontSize: 14 },
  disabled: { opacity: 0.6 },
});
