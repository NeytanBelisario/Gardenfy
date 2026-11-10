import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompactLayout } from '../../hooks/useCompactLayout';
import { AppHeader } from '../../components/shell/AppHeader';
import { PlantPhoto } from '../../components/PlantPhoto';
import { formatPercent } from './metricPresentation';
import { careLabels, formatHistoryDate, sortPlantHistory } from './plantHistory';
import { PlantCareDialog, type PlantCareAction } from './PlantCareDialog';
import { GardenManagementDialog, type GardenManagementAction } from './GardenManagementDialog';
import { PlantInfoDialog } from './PlantInfoDialog';
import { WateringIntervalDialog } from './WateringIntervalDialog';
import { LightSpotDialog } from './LightSpotDialog';
import { describeLightDetail, describeLightStatus, getLightStatus } from './light';
import { describeRoutineDetail, describeRoutineStatus, getRoutineStatus } from './routine';
import { describeWaterStatus, describeWateringPlan, getWaterStatus } from './watering';
import { CareMeter } from '../../components/CareMeter';
import { useCareEstimateStatus } from './CareEstimateSync';
import { lightTone, routineTone, waterTone } from './careMeterTones';
import { formatCareDay, lastPlantCare } from './careActivity';
import { recordPlantCare, useGardenDetails } from './store';
import type { PlantCareType, PlantHistoryEntry } from './types';

function HistoryItem({ entry, disabled, onManage }: { entry: PlantHistoryEntry; disabled: boolean; onManage: (action: PlantCareAction) => void }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}><Ionicons name={entry.kind === 'care' ? entry.careType === 'water' ? 'water-outline' : 'leaf-outline' : 'camera-outline'} size={22} color="#476644" /><Text style={styles.label}>{entry.kind === 'care' ? careLabels[entry.careType] : entry.kind === 'identification' ? 'Espécie identificada' : 'Análise antiga'}</Text></View>
      <Text style={styles.caption}>{formatHistoryDate(entry.occurredAt)}</Text>
      {entry.kind === 'care' ? <>
        <Text style={styles.caption}>Cuidado registrado por você</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Corrigir ' + careLabels[entry.careType] + ' de ' + formatHistoryDate(entry.occurredAt)} disabled={disabled} onPress={() => onManage({ mode: 'edit', record: entry })} style={styles.historyAction}><Text style={styles.label}>Corrigir</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Excluir ' + careLabels[entry.careType] + ' de ' + formatHistoryDate(entry.occurredAt)} disabled={disabled} onPress={() => onManage({ mode: 'delete', record: entry })} style={styles.historyAction}><Text style={styles.errorText}>Excluir</Text></Pressable>
        </View>
      </> : entry.kind === 'identification' ? <><Text style={styles.text}>{entry.species.commonName}</Text><Text style={styles.caption}>{entry.species.scientificName} · Pl@ntNet</Text><Text style={styles.caption}>Espécie confirmada por você; sem avaliação de saúde.</Text></> : <>
        <Text style={styles.text}>{entry.snapshot.plantName} · {entry.snapshot.health}</Text>
        <Text style={styles.caption}>Estimativas antigas do Gemini, preservadas como histórico. Não são medições atuais.</Text>
        <Text style={styles.caption}>Vitalidade {formatPercent(entry.snapshot.vitality)} · Água {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'water')?.value)} · Luz {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'light')?.value)}</Text>
      </>}
    </View>
  );
}

export default function PlantDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const compact = useCompactLayout();
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
  const [infoOpen, setInfoOpen] = useState(false);
  const [intervalOpen, setIntervalOpen] = useState(false);
  const [lightOpen, setLightOpen] = useState(false);
  const light = plant ? getLightStatus(plant) : undefined;
  const routine = plant ? getRoutineStatus(plant) : undefined;
  const water = plant ? getWaterStatus(plant) : undefined;
  const lastFertilize = plant ? lastPlantCare(plant, 'fertilize') : undefined;
  const estimateStatus = useCareEstimateStatus(plant);
  const aiBadge = 'Estimativa da IA';
  const lookupHint = estimateStatus === 'loading' ? 'Buscando a referência da espécie…' : undefined;
  const back = () => { if (!busyRef.current) { if (garden) router.replace({ pathname: '/gardens/[id]', params: { id: garden.id } }); else router.replace('/'); } };
  const record = async (careType: PlantCareType) => {
    if (!garden || !plant || busyRef.current || action || management) return;
    busyRef.current = true; setBusy(true); setError(null); setNotice(null);
    try { await recordPlantCare(garden.id, plant.id, careType); setNotice(careLabels[careType] + ' registrada. Seu histórico foi atualizado.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível registrar. Tente novamente.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return (
    <View style={styles.screen}>
      <AppHeader title={plant?.name ?? 'Planta'} mode="back" onPressLeading={back} />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingBottom: 32 + insets.bottom }]}>
        {garden && plant ? <>
          <PlantPhoto uri={plant.imageUrl} style={[styles.photo, compact && styles.photoCompact]} label={'Foto de ' + plant.name} />
          <Text style={styles.caption}>{garden.name}</Text>
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>{plant.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={'Ver informações de ' + plant.name} disabled={busy} onPress={() => setInfoOpen(true)} hitSlop={8} style={styles.infoButton}>
              <Ionicons name="information" size={20} color="#476644" />
            </Pressable>
          </View>
          {plant.species || plant.subtitle ? <Text style={styles.text}>
            {plant.species ? <Text style={styles.species}>{plant.species.scientificName}</Text> : null}
            {plant.species && plant.subtitle ? ' · ' : null}
            {plant.subtitle ?? null}
          </Text> : null}
          <View style={[styles.careCard, compact && styles.careCardCompact]}>
            <Text accessibilityRole="header" style={styles.heading}>O cuidado de hoje</Text>
            {water ? <CareMeter
              icon="water" iconColor="#2f6f8f" tint="#e2eff6" label="Água"
              status={describeWaterStatus(water)} level={water.level} tone={waterTone[water.state]}
              badge={water.plan?.source === 'species' && water.plan.referenceSource === 'ai' ? aiBadge : undefined}
              detail={[water.lastWateredAt ? 'Última rega ' + formatCareDay(water.lastWateredAt) : null, water.plan ? describeWateringPlan(water.plan) : lookupHint ?? 'Escolha de quanto em quanto tempo você rega para acompanhar.'].filter(Boolean).join(' · ')}
              action={{ label: water.plan ? 'Ajustar' : 'Definir', icon: 'options-outline', accessibilityLabel: 'Ajustar frequência de rega', disabled: busy, onPress: () => setIntervalOpen(true) }}
            /> : null}
            {light ? <CareMeter
              icon="sunny" iconColor="#9a6700" tint="#fdf3d7" label="Luz"
              status={describeLightStatus(light)} level={light.level} tone={light.fit ? lightTone[light.fit] : 'neutral'}
              badge={light.fit && light.referenceSource === 'ai' ? aiBadge : undefined}
              detail={!light.fit && light.spot && lookupHint ? lookupHint : describeLightDetail(light)}
              action={{ label: light.spot ? 'Mudar' : 'Definir', icon: 'location-outline', accessibilityLabel: 'Definir onde a planta fica', disabled: busy, onPress: () => setLightOpen(true) }}
            /> : null}
            {routine ? <CareMeter
              icon="leaf" iconColor="#476644" tint="#e6f0e1" label="Rotina"
              status={describeRoutineStatus(routine)} level={routine.level} tone={routineTone[routine.state]}
              detail={describeRoutineDetail(routine)}
            /> : null}
            <Text style={styles.caption}>Última adubação: {lastFertilize ? formatCareDay(lastFertilize.occurredAt) : 'ainda sem registro'}</Text>
            <View style={styles.actions}>{(['water', 'fertilize'] as const).map((careType) => <Pressable key={careType} accessibilityRole="button" accessibilityLabel={careType === 'water' ? 'Registrar rega' : 'Registrar adubação'} disabled={busy || !!action || !!management} accessibilityState={{ disabled: busy || !!action || !!management, busy }} onPress={() => record(careType)} style={[styles.primary, compact && styles.primaryCompact, busy && styles.disabled]}>
              <Ionicons name={careType === 'water' ? 'water-outline' : 'leaf-outline'} size={20} color="#fff" /><Text style={styles.primaryText}>{careType === 'water' ? 'Registrar rega' : 'Registrar adubação'}</Text>
            </Pressable>)}</View>
            {busy ? <Text accessibilityLiveRegion="polite" style={styles.caption}>Salvando cuidado...</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
          </View>
          <Text accessibilityRole="header" style={styles.heading}>Seu histórico</Text>
          <Text style={styles.caption}>Mais recente primeiro · horário do aparelho</Text>
          {plant.history.length ? sortPlantHistory(plant.history).map((entry) => <HistoryItem key={entry.id} entry={entry} disabled={busy} onManage={(next) => { if (!busyRef.current) { setNotice(null); setAction(next); } }} />) : <View style={styles.historyCard}><Text style={styles.label}>Cada cuidado conta</Text><Text style={styles.text}>Registre sua primeira rega ou adubação. Os próximos cuidados aparecem aqui.</Text></View>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setManagement({ mode: 'edit', plant })} style={styles.secondary}><Ionicons name="create-outline" size={20} color="#476644" /><Text style={styles.label}>Editar planta</Text></Pressable>
          </View>
        </> : <View style={styles.historyCard}><Text style={styles.heading}>Planta não encontrada</Text><Text style={styles.text}>Volte ao jardim para continuar com suas plantas.</Text><Pressable accessibilityRole="button" onPress={back} style={styles.secondary}><Text style={styles.label}>Voltar ao jardim</Text></Pressable></View>}
      </ScrollView>
      {garden && plant && action ? <PlantCareDialog key={action.mode + '-' + action.record.id} gardenId={garden.id} plantId={plant.id} action={action} onClose={() => setAction(null)} /> : null}
      {garden && plant && lightOpen ? <LightSpotDialog gardenId={garden.id} plant={plant} onClose={() => setLightOpen(false)} /> : null}
      {garden && plant && intervalOpen ? <WateringIntervalDialog gardenId={garden.id} plant={plant} onClose={() => setIntervalOpen(false)} /> : null}
      {garden && plant && infoOpen ? <PlantInfoDialog plant={plant} onClose={() => setInfoOpen(false)} onReviewSpecies={() => router.push({ pathname: '/gardens/[id]/plants/[plantId]/scan', params: { id: garden.id, plantId: plant.id } })} /> : null}
      {garden && plant && management ? <GardenManagementDialog key={management.mode} garden={garden} action={management} onClose={() => setManagement(null)} onGardenDeleted={() => router.replace('/')} onPlantDeleted={back} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 14 },
  contentCompact: { padding: 16, gap: 12 },
  photo: { height: 220, width: '100%', borderRadius: 24 },
  photoCompact: { height: 180, borderRadius: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#17361d', fontSize: 32, fontWeight: '800', flexShrink: 1 },
  titleCompact: { fontSize: 26 },
  infoButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#eef2e8', borderWidth: 1, borderColor: '#d9e2d2' },
  species: { color: '#476644', fontSize: 15, fontStyle: 'italic' },
  heading: { color: '#17361d', fontSize: 22, fontWeight: '800' },
  text: { color: '#586653', fontSize: 15, lineHeight: 24 },
  label: { color: '#17361d', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  caption: { color: '#586653', fontSize: 13, lineHeight: 21 },
  careCard: { borderRadius: 24, padding: 20, backgroundColor: '#eef2e8', gap: 16 },
  careCardCompact: { padding: 12, gap: 12, borderRadius: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minHeight: 52, minWidth: 140, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, backgroundColor: '#17361d' },
  primaryCompact: { flexBasis: '100%', minWidth: 0, minHeight: 48, padding: 12 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondary: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#c2c8bf' },
  historyCard: { borderRadius: 20, padding: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e9e0', gap: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyAction: { minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: '#f5f3ef' },
  errorText: { color: '#93000a', fontSize: 14, lineHeight: 22 },
  success: { color: '#17361d', fontSize: 14, lineHeight: 22, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
