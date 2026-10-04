import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { careDateFields, careLabels, formatHistoryDate, parseCareDateFields } from './plantHistory';
import { deletePlantCare, updatePlantCare } from './store';
import type { PlantCareRecord } from './types';

export type PlantCareAction = { mode: 'edit' | 'delete'; record: PlantCareRecord };

export function PlantCareDialog({ gardenId, plantId, action, onClose }: {
  gardenId: string;
  plantId: string;
  action: PlantCareAction;
  onClose: () => void;
}) {
  const { record } = action;
  const deleting = action.mode === 'delete';
  const original = careDateFields(record.occurredAt);
  const [careType, setCareType] = useState(record.careType);
  const [date, setDate] = useState(original.date);
  const [time, setTime] = useState(original.time);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const dismiss = () => { if (!busyRef.current) onClose(); };
  const save = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (deleting) await deletePlantCare(gardenId, plantId, record.id);
      else {
        const occurredAt = date === original.date && time === original.time
          ? record.occurredAt : parseCareDateFields(date, time);
        await updatePlantCare(gardenId, plantId, record.id, { careType, occurredAt });
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={dismiss}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{deleting ? 'Excluir cuidado' : 'Corrigir cuidado'}</Text>
            {deleting ? (
              <Text style={styles.text}>
                Excluir {careLabels[record.careType].toLowerCase()} de {formatHistoryDate(record.occurredAt)}?
                {'\n\n'}Esta ação não pode ser desfeita.
              </Text>
            ) : (
              <>
                <Text style={styles.label}>Tipo de cuidado</Text>
                <View style={styles.row}>
                  {(['water', 'fertilize'] as const).map((value) => (
                    <Pressable key={value} accessibilityRole="button" disabled={busy} accessibilityState={{ selected: careType === value, disabled: busy }} onPress={() => setCareType(value)} style={[styles.choice, careType === value && styles.selected]}>
                      <Text style={styles.text}>{careLabels[value]}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
                <TextInput accessibilityLabel="Data do cuidado, DD/MM/AAAA" style={styles.input} value={date} onChangeText={setDate} editable={!busy} placeholder="DD/MM/AAAA" maxLength={10} />
                <Text style={styles.label}>Hora (HH:mm)</Text>
                <TextInput accessibilityLabel="Hora do cuidado, HH:mm" style={styles.input} value={time} onChangeText={setTime} editable={!busy} placeholder="HH:mm" maxLength={5} />
                <Text style={styles.text}>Data e hora no horário do aparelho.</Text>
              </>
            )}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={deleting ? 'Confirmar exclusão' : 'Salvar correção'} disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={save} style={[styles.primary, deleting && styles.destructive, busy && styles.disabled]}>
              <Text style={styles.primaryText}>{busy ? 'Salvando...' : deleting ? 'Confirmar exclusão' : 'Salvar correção'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={dismiss} style={styles.choice}>
              <Text style={styles.text}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: '#fbf9f5', borderRadius: 24 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#17361d' },
  label: { fontWeight: '700', color: '#17361d' },
  text: { color: '#17361d', fontSize: 16, lineHeight: 24 },
  input: { backgroundColor: '#eae8e4', padding: 16, borderRadius: 12, color: '#17361d', fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#c2c8bf' },
  selected: { backgroundColor: '#c8ecc1', borderColor: '#17361d' },
  primary: { padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#17361d' },
  destructive: { backgroundColor: '#93000a' },
  primaryText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  error: { color: '#93000a' },
  disabled: { opacity: 0.6 },
});
