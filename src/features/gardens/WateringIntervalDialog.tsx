import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAX_WATERING_INTERVAL_DAYS, MIN_WATERING_INTERVAL_DAYS } from './persistence';
import { setPlantWateringInterval } from './store';
import { getWateringPlan } from './watering';
import type { GardenPlant } from './types';

const presets = [3, 5, 7, 10, 14, 21, 30];

export function WateringIntervalDialog({ gardenId, plant, onClose }: { gardenId: string; plant: GardenPlant; onClose: () => void }) {
  const plan = getWateringPlan(plant);
  const reference = plan?.reference;
  const [days, setDays] = useState(plan?.intervalDays ?? 7);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (value: number | undefined) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { await setPlantWateringInterval(gardenId, plant.id, value); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.'); busyRef.current = false; setBusy(false); }
  };
  const step = (delta: number) => setDays((current) => Math.min(MAX_WATERING_INTERVAL_DAYS, Math.max(MIN_WATERING_INTERVAL_DAYS, current + delta)));
  const dismiss = () => { if (!busyRef.current) onClose(); };

  return (
    <Modal transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>Frequência de rega</Text>
            <Text style={styles.text}>De quanto em quanto tempo você costuma regar {plant.name}? A barra de água usa essa frequência e a sua última rega registrada.</Text>
            <View style={styles.stepper}>
              <Pressable accessibilityRole="button" accessibilityLabel="Diminuir um dia" disabled={busy || days <= MIN_WATERING_INTERVAL_DAYS} onPress={() => step(-1)} style={[styles.stepButton, (busy || days <= MIN_WATERING_INTERVAL_DAYS) && styles.disabled]}>
                <Ionicons name="remove" size={24} color="#17361d" />
              </Pressable>
              <View style={styles.value} accessibilityLiveRegion="polite">
                <Text style={styles.valueNumber}>{days}</Text>
                <Text style={styles.valueUnit}>{days === 1 ? 'dia' : 'dias'}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Aumentar um dia" disabled={busy || days >= MAX_WATERING_INTERVAL_DAYS} onPress={() => step(1)} style={[styles.stepButton, (busy || days >= MAX_WATERING_INTERVAL_DAYS) && styles.disabled]}>
                <Ionicons name="add" size={24} color="#17361d" />
              </Pressable>
            </View>
            <View style={styles.presets}>
              {presets.map((value) => (
                <Pressable key={value} accessibilityRole="button" accessibilityLabel={'A cada ' + value + ' dias'} accessibilityState={{ selected: days === value, disabled: busy }} disabled={busy} onPress={() => setDays(value)} style={[styles.preset, days === value && styles.presetSelected]}>
                  <Text style={[styles.presetText, days === value && styles.presetTextSelected]}>{value}d</Text>
                </Pressable>
              ))}
            </View>
            {reference ? (
              <View style={styles.note}>
                <Ionicons name="book-outline" size={18} color="#586653" />
                <Text style={styles.noteText}>Referência da espécie: a cada {reference.min}–{reference.max} dias em ambiente interno. Confira o solo antes de regar; calor, vaso e estação mudam o ritmo.</Text>
              </View>
            ) : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={() => save(days)} style={[styles.primary, busy && styles.disabled]}>
              <Text style={styles.primaryText}>{busy ? 'Salvando...' : 'Salvar frequência'}</Text>
            </Pressable>
            {plan?.source === 'custom' ? (
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => save(undefined)} style={styles.secondary}>
                <Text style={styles.secondaryText}>{reference ? 'Voltar à referência da espécie' : 'Remover frequência'}</Text>
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
  content: { padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#17361d' },
  text: { fontSize: 15, lineHeight: 23, color: '#586653' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2e8' },
  value: { minWidth: 96, alignItems: 'center' },
  valueNumber: { fontSize: 40, fontWeight: '800', color: '#17361d' },
  valueUnit: { fontSize: 14, color: '#586653' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  preset: { minWidth: 48, minHeight: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#c2c8bf' },
  presetSelected: { backgroundColor: '#17361d', borderColor: '#17361d' },
  presetText: { fontSize: 14, fontWeight: '700', color: '#17361d' },
  presetTextSelected: { color: '#fff' },
  note: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#f1f3ec' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20, color: '#586653' },
  primary: { minHeight: 52, padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17361d' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { minHeight: 48, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#c2c8bf' },
  secondaryText: { color: '#17361d', fontWeight: '700', fontSize: 15 },
  error: { color: '#93000a', fontSize: 14 },
  disabled: { opacity: 0.45 },
});
