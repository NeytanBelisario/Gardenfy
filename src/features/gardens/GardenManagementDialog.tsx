import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GardenIdentityIcon, gardenIconOptions } from './icons';
import { deleteGarden, deletePlant, updateGarden, updatePlant } from './store';
import type { GardenDetails, GardenPlant } from './types';

export type GardenManagementAction = {
  mode: 'edit' | 'delete';
  plant?: GardenPlant;
};

export function GardenManagementDialog({ garden, action, onClose, onGardenDeleted }: {
  garden: GardenDetails;
  action: GardenManagementAction;
  onClose: () => void;
  onGardenDeleted: () => void;
}) {
  const plant = action.plant;
  const deleting = action.mode === 'delete';
  const [name, setName] = useState(plant?.name ?? garden.name);
  const [subtitle, setSubtitle] = useState(plant?.subtitle ?? '');
  const [environment, setEnvironment] = useState(garden.environment);
  const [icon, setIcon] = useState(garden.icon);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const title = `${deleting ? 'Excluir' : 'Editar'} ${plant ? 'planta' : 'jardim'}`;

  const dismiss = () => { if (!busyRef.current) onClose(); };
  const save = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (deleting) {
        if (plant) await deletePlant(garden.id, plant.id);
        else await deleteGarden(garden.id);
      } else if (plant) {
        await updatePlant(garden.id, plant.id, { name, subtitle });
      } else {
        await updateGarden(garden.id, { name, environment, icon });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
      busyRef.current = false;
      setBusy(false);
      return;
    }
    onClose();
    if (deleting && !plant) onGardenDeleted();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={dismiss}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            {deleting ? (
              <Text style={styles.text}>
                {plant
                  ? `Excluir “${plant.name}” deste jardim? A análise e as fotos locais sem uso também serão removidas.`
                  : `Excluir “${garden.name}” e suas ${garden.plantCount} plantas? As análises e fotos locais sem uso também serão removidas.`}
                {'\n\n'}Esta ação não pode ser desfeita.
              </Text>
            ) : (
              <>
                <Text style={styles.label}>Nome</Text>
                <TextInput accessibilityLabel={plant ? 'Nome da planta' : 'Nome do jardim'} style={styles.input} value={name} onChangeText={setName} editable={!busy} />
                {plant ? (
                  <>
                    <Text style={styles.label}>Descrição (opcional)</Text>
                    <TextInput accessibilityLabel="Descrição da planta" style={styles.input} value={subtitle} onChangeText={setSubtitle} editable={!busy} multiline />
                  </>
                ) : (
                  <>
                    <Text style={styles.label}>Ambiente</Text>
                    <View style={styles.row}>
                      {(['indoor', 'outdoor'] as const).map((value) => (
                        <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: environment === value, disabled: busy }} disabled={busy} onPress={() => setEnvironment(value)} style={[styles.choice, environment === value && styles.selected]}>
                          <Text style={styles.text}>{value === 'indoor' ? 'Interno' : 'Externo'}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={styles.label}>Ícone</Text>
                    <View style={styles.row}>
                      {gardenIconOptions.map((value) => (
                        <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Ícone ${value}`} accessibilityState={{ selected: icon === value, disabled: busy }} disabled={busy} onPress={() => setIcon(value)} style={[styles.choice, icon === value && styles.selected]}>
                          <GardenIdentityIcon icon={value} size={28} color="#17361d" />
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={save} style={[styles.primary, deleting && styles.destructive, busy && styles.disabled]}>
              <Text style={styles.primaryText}>{busy ? (deleting ? 'Excluindo...' : 'Salvando...') : deleting ? 'Confirmar exclusão' : 'Salvar alterações'}</Text>
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
