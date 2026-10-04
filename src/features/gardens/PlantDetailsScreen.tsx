import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/shell/AppHeader';
import { PlantPhoto } from '../../components/PlantPhoto';
import { formatPercent } from './metricPresentation';
import { careLabels, formatHistoryDate, sortPlantHistory } from './plantHistory';
import { PlantCareDialog, type PlantCareAction } from './PlantCareDialog';
import { GardenManagementDialog, type GardenManagementAction } from './GardenManagementDialog';
import { PlantCareInstructions } from './PlantCareInstructions';
import { formatCareDay, lastPlantCare } from './careActivity';
import { recordPlantCare, useGardenDetails } from './store';
import type { PlantCareType, PlantHistoryEntry } from './types';

function HistoryItem({ entry, disabled, onManage }: { entry: PlantHistoryEntry; disabled: boolean; onManage: (action: PlantCareAction) => void }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}><Ionicons name={entry.kind === 'care' ? entry.careType === 'water' ? 'water-outline' : 'leaf-outline' : 'camera-outline'} size={22} color="#476644" /><Text style={styles.label}>{entry.kind === 'care' ? careLabels[entry.careType] : entry.kind === 'identification' ? 'Esp?cie identificada' : 'An?lise antiga'}</Text></View>
      <Text style={styles.caption}>{formatHistoryDate(entry.occurredAt)}</Text>
      {entry.kind === 'care' ? <>
        <Text style={styles.caption}>Cuidado registrado por voc?</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Corrigir ' + careLabels[entry.careType] + ' de ' + formatHistoryDate(entry.occurredAt)} disabled={disabled} onPress={() => onManage({ mode: 'edit', record: entry })} style={styles.historyAction}><Text style={styles.label}>Corrigir</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Excluir ' + careLabels[entry.careType] + ' de ' + formatHistoryDate(entry.occurredAt)} disabled={disabled} onPress={() => onManage({ mode: 'delete', record: entry })} style={styles.historyAction}><Text style={styles.errorText}>Excluir</Text></Pressable>
        </View>
      </> : entry.kind === 'identification' ? <><Text style={styles.text}>{entry.species.commonName}</Text><Text style={styles.caption}>{entry.species.scientificName} ? Pl@ntNet</Text><Text style={styles.caption}>Esp?cie confirmada por voc?; sem avalia??o de sa?de.</Text></> : <>
        <Text style={styles.text}>{entry.snapshot.plantName} ? {entry.snapshot.health}</Text>
        <Text style={styles.caption}>Estimativas antigas do Gemini, preservadas como hist?rico. N?o s?o medi??es atuais.</Text>
        <Text style={styles.caption}>Vitalidade {formatPercent(entry.snapshot.vitality)} ? ?gua {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'water')?.value)} ? Luz {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'light')?.value)}</Text>
      </>}
    </View>
  );
}

export default function PlantDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[]; plantId?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const plantId = Array.isArray(params.plantId) ? params.plantId[0] : params.plantId;
  const garden = useGardenDetails(id);
  const plant = garden?.plants.find((item) => item.id === plantId);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [action, setAction] = useState<PlantCareAction | null>(null);
  const [management, setManagement] = useState<GardenManagementAction | null>(null);
  const back = () => { if (!busyRef.current) { if (garden) router.replace({ pathname: '/gardens/[id]', params: { id: garden.id } }); else router.replace('/'); } };
  const record = async (careType: PlantCareType) => {
    if (!garden || !plant || busyRef.current || action || management) return;
    busyRef.current = true; setBusy(true); setError(null); setNotice(null);
    try { await recordPlantCare(garden.id, plant.id, careType); setNotice(careLabels[careType] + ' registrada. Seu hist?rico foi atualizado.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'N?o foi poss?vel registrar. Tente novamente.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return (
    <View style={styles.screen}>
      <AppHeader title={plant?.name ?? 'Planta'} mode="back" onPressLeading={back} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        {garden && plant ? <>
          <PlantPhoto uri={plant.imageUrl} style={styles.photo} label={'Foto de ' + plant.name} />
          <Text style={styles.caption}>{garden.name}</Text>
          <Text accessibilityRole="header" style={styles.title}>{plant.name}</Text>
          {plant.species ? <Text style={styles.species}>{plant.species.scientificName}</Text> : null}
          {plant.subtitle ? <Text style={styles.text}>{plant.subtitle}</Text> : null}
          <View style={styles.careCard}>
            <Text accessibilityRole="header" style={styles.heading}>O cuidado de hoje</Text>
            <Text style={styles.text}>J? cuidou da sua planta? Registre para lembrar quando foi.</Text>
            <View style={styles.lastCareRow}>{(['water', 'fertilize'] as const).map((type) => {
              const last = lastPlantCare(plant, type);
              return <View key={type} style={styles.lastCare}><Text style={styles.label}>{type === 'water' ? '?ltima rega' : '?ltima aduba??o'}</Text><Text style={styles.caption}>{last ? formatCareDay(last.occurredAt) : 'Ainda sem registro'}</Text></View>;
            })}</View>
            <View style={styles.actions}>{(['water', 'fertilize'] as const).map((careType) => <Pressable key={careType} accessibilityRole="button" disabled={busy || !!action || !!management} accessibilityState={{ disabled: busy || !!action || !!management, busy }} onPress={() => record(careType)} style={[styles.primary, busy && styles.disabled]}>
              <Ionicons name={careType === 'water' ? 'water-outline' : 'leaf-outline'} size={20} color="#fff" /><Text style={styles.primaryText}>{careType === 'water' ? 'Registrar rega' : 'Registrar aduba??o'}</Text>
            </Pressable>)}</View>
            {busy ? <Text accessibilityLiveRegion="polite" style={styles.caption}>Salvando cuidado...</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
          </View>
          <PlantCareInstructions plant={plant} />
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]/scan', params: { id: garden.id, plantId: plant.id } })} style={styles.secondary}><Ionicons name="camera-outline" size={20} color="#476644" /><Text style={styles.label}>{plant.species ? 'Revisar esp?cie por foto' : 'Identificar por foto'}</Text></Pressable>
          <Text accessibilityRole="header" style={styles.heading}>Seu hist?rico</Text>
          <Text style={styles.caption}>Mais recente primeiro ? hor?rio do aparelho</Text>
          {plant.history.length ? sortPlantHistory(plant.history).map((entry) => <HistoryItem key={entry.id} entry={entry} disabled={busy} onManage={(next) => { if (!busyRef.current) { setNotice(null); setAction(next); } }} />) : <View style={styles.historyCard}><Text style={styles.label}>Cada cuidado conta</Text><Text style={styles.text}>Registre sua primeira rega ou aduba??o. Os pr?ximos cuidados aparecem aqui.</Text></View>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setManagement({ mode: 'edit', plant })} style={styles.secondary}><Ionicons name="create-outline" size={20} color="#476644" /><Text style={styles.label}>Editar planta</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setManagement({ mode: 'delete', plant })} style={styles.secondary}><Text style={styles.errorText}>Excluir planta</Text></Pressable>
          </View>
        </> : <View style={styles.historyCard}><Text style={styles.heading}>Planta n?o encontrada</Text><Text style={styles.text}>Volte ao jardim para continuar com suas plantas.</Text><Pressable accessibilityRole="button" onPress={back} style={styles.secondary}><Text style={styles.label}>Voltar ao jardim</Text></Pressable></View>}
      </ScrollView>
      {garden && plant && action ? <PlantCareDialog key={action.mode + '-' + action.record.id} gardenId={garden.id} plantId={plant.id} action={action} onClose={() => setAction(null)} /> : null}
      {garden && plant && management ? <GardenManagementDialog key={management.mode} garden={garden} action={management} onClose={() => setManagement(null)} onGardenDeleted={() => router.replace('/')} onPlantDeleted={back} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 14 },
  photo: { height: 220, width: '100%', borderRadius: 24 },
  title: { color: '#17361d', fontSize: 32, fontWeight: '800' },
  species: { color: '#476644', fontSize: 15, fontStyle: 'italic' },
  heading: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  text: { color: '#586653', fontSize: 15, lineHeight: 24 },
  label: { color: '#17361d', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  caption: { color: '#586653', fontSize: 13, lineHeight: 21 },
  careCard: { borderRadius: 24, padding: 20, backgroundColor: '#eef2e8', gap: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minHeight: 52, minWidth: 140, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, backgroundColor: '#17361d' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#c2c8bf' },
  lastCareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lastCare: { flex: 1, minWidth: 120, gap: 5 },
  historyCard: { borderRadius: 20, padding: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e9e0', gap: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyAction: { minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: '#f5f3ef' },
  errorText: { color: '#93000a', fontSize: 14, lineHeight: 22 },
  success: { color: '#17361d', fontSize: 14, lineHeight: 22, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
