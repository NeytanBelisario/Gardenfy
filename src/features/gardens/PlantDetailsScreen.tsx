import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppHeader } from '../../components/shell/AppHeader';
import { formatPercent } from './metricPresentation';
import { careLabels, formatHistoryDate, sortPlantHistory } from './plantHistory';
import { PlantCareDialog, type PlantCareAction } from './PlantCareDialog';
import { recordPlantCare, useGardenDetails } from './store';
import type { GardenPlant, PlantCareType, PlantHistoryEntry } from './types';

function PlantPhoto({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [uri]);
  return uri && !failed ? (
    <Image source={{ uri }} style={styles.photo} onError={() => setFailed(true)} accessibilityLabel="Foto da planta" />
  ) : (
    <View style={[styles.photo, styles.photoFallback]}>
      <Ionicons name="leaf-outline" size={64} color="#476644" />
      <Text style={styles.caption}>Foto indisponível</Text>
    </View>
  );
}

function EstimateCard({ plant, kind }: { plant: GardenPlant; kind: 'water' | 'light' }) {
  const value = plant.metrics.find((metric) => metric.kind === kind)?.value;
  return (
    <View style={styles.metricCard}>
      <Ionicons name={kind === 'water' ? 'water-outline' : 'sunny-outline'} size={28} color="#476644" />
      <Text style={styles.label}>{kind === 'water' ? 'Hidratação' : 'Luz'}</Text>
      <Text style={styles.metricValue}>{formatPercent(value)}</Text>
      <Text style={styles.caption}>
        {typeof value === 'number' ? 'Estimativa da IA a partir da foto' : 'Analise uma foto para obter uma estimativa.'}
      </Text>
      {typeof value === 'number' && plant.lastAnalyzedAt ? <Text style={styles.caption}>{formatHistoryDate(plant.lastAnalyzedAt)}</Text> : null}
    </View>
  );
}

function HistoryItem({ entry, disabled, onManage }: { entry: PlantHistoryEntry; disabled: boolean; onManage: (action: PlantCareAction) => void }) {
  return (
    <View style={styles.historyCard}>
      <Text style={styles.label}>{entry.kind === 'care' ? careLabels[entry.careType] : 'Análise por foto'}</Text>
      <Text style={styles.caption}>{formatHistoryDate(entry.occurredAt)}</Text>
      {entry.kind === 'care' ? (
        <>
          <Text style={styles.text}>Registrado por você</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Corrigir ${careLabels[entry.careType]} de ${formatHistoryDate(entry.occurredAt)}`} disabled={disabled} onPress={() => onManage({ mode: 'edit', record: entry })} style={styles.secondaryButton}>
              <Text style={styles.label}>Corrigir</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${careLabels[entry.careType]} de ${formatHistoryDate(entry.occurredAt)}`} disabled={disabled} onPress={() => onManage({ mode: 'delete', record: entry })} style={styles.secondaryButton}>
              <Text style={styles.error}>Excluir</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.text}>{entry.snapshot.plantName} · {entry.snapshot.health}</Text>
          <Text style={styles.caption}>Estimativas da IA</Text>
          <Text style={styles.text}>
            Vitalidade: {formatPercent(entry.snapshot.vitality)}
            {'\n'}Água: {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'water')?.value)}
            {'\n'}Luz: {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'light')?.value)}
            {'\n'}Crescimento estimado: {typeof entry.snapshot.growthDays === 'number' ? `${entry.snapshot.growthDays} dias` : 'Sem estimativa'}
          </Text>
        </>
      )}
    </View>
  );
}

export default function PlantDetailsScreen() {
  const router = useRouter();
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

  const back = () => {
    if (router.canGoBack()) router.back();
    else if (garden) router.replace({ pathname: '/gardens/[id]', params: { id: garden.id } });
    else router.replace('/');
  };
  const record = async (careType: PlantCareType) => {
    if (!garden || !plant || busyRef.current || action) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await recordPlantCare(garden.id, plant.id, careType);
      setNotice(`${careLabels[careType]} registrada.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o cuidado. Tente novamente.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const openAction = (next: PlantCareAction) => {
    if (busyRef.current) return;
    setNotice(null);
    setAction(next);
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Planta" mode="back" onPressLeading={back} />
      <ScrollView contentContainerStyle={styles.content}>
        {garden && plant ? (
          <>
            <PlantPhoto uri={plant.imageUrl} />
            <Text style={styles.caption}>{garden.name}</Text>
            <Text accessibilityRole="header" style={styles.title}>{plant.name}</Text>
            {plant.subtitle ? <Text style={styles.text}>{plant.subtitle}</Text> : null}
            <View style={styles.summary}>
              <Text style={styles.label}>Vitalidade: {formatPercent(plant.vitality)}</Text>
              <Text style={styles.text}>{plant.status.label}</Text>
              <Text style={styles.caption}>{plant.lastAnalyzedAt ? `Estimativa da IA · ${formatHistoryDate(plant.lastAnalyzedAt)}` : 'Nenhuma análise registrada.'}</Text>
            </View>
            <View style={styles.metrics}>
              <EstimateCard plant={plant} kind="water" />
              <EstimateCard plant={plant} kind="light" />
            </View>
            <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }} onPress={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]/scan', params: { id: garden.id, plantId: plant.id } })} style={styles.secondaryButton}>
              <Text style={styles.label}>{plant.lastAnalyzedAt ? 'Analisar novamente' : 'Analisar por foto'}</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.heading}>Cuidados</Text>
            <Text style={styles.caption}>Registre o que você fez. Regar e adubar não alteram as estimativas de água, luz ou vitalidade.</Text>
            <View style={styles.actions}>
              {(['water', 'fertilize'] as const).map((careType) => (
                <Pressable key={careType} accessibilityRole="button" disabled={busy || !!action} accessibilityState={{ disabled: busy || !!action, busy }} onPress={() => record(careType)} style={[styles.primaryButton, busy && styles.disabled]}>
                  <Ionicons name={careType === 'water' ? 'water-outline' : 'leaf-outline'} size={20} color="#fff" />
                  <Text style={styles.primaryText}>{careType === 'water' ? 'Regar' : 'Adubar'}</Text>
                </Pressable>
              ))}
            </View>
            {busy ? <Text accessibilityLiveRegion="polite" style={styles.caption}>Salvando cuidado...</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {notice ? <Text accessibilityLiveRegion="polite" style={styles.text}>{notice}</Text> : null}
            <Text accessibilityRole="header" style={styles.heading}>Histórico</Text>
            <Text style={styles.caption}>Mais recente primeiro · horário do aparelho</Text>
            {plant.history.length ? sortPlantHistory(plant.history).map((entry) => (
              <HistoryItem key={entry.id} entry={entry} disabled={busy} onManage={openAction} />
            )) : (
              <View style={styles.historyCard}>
                <Text style={styles.label}>Nenhum registro ainda</Text>
                <Text style={styles.caption}>Registre um cuidado ou analise uma foto para começar o histórico.</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.historyCard}>
            <Text style={styles.heading}>Planta não encontrada</Text>
            <Text style={styles.text}>Esta planta não está disponível. Volte ao jardim para continuar.</Text>
            <Pressable accessibilityRole="button" onPress={back} style={styles.secondaryButton}><Text style={styles.label}>Voltar</Text></Pressable>
          </View>
        )}
      </ScrollView>
      {garden && plant && action ? (
        <PlantCareDialog key={`${action.mode}-${action.record.id}`} gardenId={garden.id} plantId={plant.id} action={action} onClose={() => setAction(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { padding: 24, paddingBottom: 48, gap: 12 },
  title: { color: '#17361d', fontSize: 32, fontWeight: '900' },
  heading: { color: '#17361d', fontSize: 24, fontWeight: '800', marginTop: 12 },
  text: { color: '#17361d', fontSize: 16, lineHeight: 24 },
  label: { color: '#17361d', fontSize: 16, fontWeight: '700' },
  caption: { color: '#424841', fontSize: 13, lineHeight: 20 },
  photo: { width: '100%', height: 220, borderRadius: 24, backgroundColor: '#eae8e4' },
  photoFallback: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  summary: { backgroundColor: '#eae8e4', padding: 20, borderRadius: 20, gap: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 8 },
  metricValue: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  primaryButton: { flex: 1, minWidth: 120, flexDirection: 'row', gap: 8, backgroundColor: '#17361d', borderRadius: 16, padding: 18, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryButton: { borderColor: '#c2c8bf', borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  historyCard: { padding: 20, borderRadius: 20, backgroundColor: '#fff', gap: 8 },
  error: { color: '#93000a', fontSize: 16 },
  disabled: { opacity: 0.6 },
});
