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
import { getWaterStatus } from './watering';
import { PlantWateringCard } from './PlantWateringCard';
import { CareMeter } from '../../components/CareMeter';
import { useCareEstimateStatus } from './CareEstimateSync';
import { routineTone } from './careMeterTones';
import { formatCareDay, lastPlantCare } from './careActivity';
import { recordPlantCare, useGardenDetails } from './store';
import type { PlantCareType, PlantHistoryEntry } from './types';
import { colors } from '../../theme/tokens';

function HistoryItem({ entry, disabled, onManage }: { entry: PlantHistoryEntry; disabled: boolean; onManage: (action: PlantCareAction) => void }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}><Ionicons name={entry.kind === 'care' ? entry.careType === 'water' ? 'water-outline' : 'leaf-outline' : 'camera-outline'} size={22} color={colors.accent} /><Text style={styles.label}>{entry.kind === 'care' ? careLabels[entry.careType] : entry.kind === 'identification' ? 'Espécie identificada' : 'Análise antiga'}</Text></View>
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const light = plant ? getLightStatus(plant) : undefined;
  const routine = plant ? getRoutineStatus(plant) : undefined;
  const water = plant ? getWaterStatus(plant) : undefined;
  const lastFertilize = plant ? lastPlantCare(plant, 'fertilize') : undefined;
  const estimateStatus = useCareEstimateStatus(plant);
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
      <AppHeader title={garden?.name ?? 'Sua planta'} mode="back" onPressLeading={back}
        trailingAction={plant ? { label: 'Ver informações de ' + plant.name, icon: 'information-outline', onPress: () => setInfoOpen(true), disabled: busy } : undefined} />
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingBottom: 32 + insets.bottom }]}>
        {garden && plant ? <>
          <View style={styles.identity}>
          <PlantPhoto compact uri={plant.imageUrl} style={[styles.photo, compact && styles.photoCompact]} label={'Foto de ' + plant.name} />
          <View style={styles.identityCopy}>
            <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>{plant.name}</Text>
          {plant.species || plant.subtitle ? <Text style={styles.text}>
            {plant.species ? <Text style={styles.species}>{plant.species.scientificName}</Text> : null}
            {plant.species && plant.subtitle ? ' · ' : null}
            {plant.subtitle ?? null}
          </Text> : null}
          </View>
          </View>
          <Text accessibilityRole="header" style={styles.heading}>Cuidados da planta</Text>
          {water ? <PlantWateringCard status={water} busy={busy || !!action || !!management} loading={estimateStatus === 'loading'} onAdjust={() => setIntervalOpen(true)} onWater={() => record('water')} /> : null}
          <View style={[styles.secondaryCare, compact && styles.secondaryCareCompact]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Definir onde a planta fica" disabled={busy} onPress={() => setLightOpen(true)} style={styles.lightAction}>
              <Ionicons name="sunny-outline" size={28} color={colors.sun} />
              <View style={styles.identityCopy}>
                <Text style={styles.heading}>Luz</Text>
                <Text style={styles.text}>{light ? describeLightStatus(light) : 'Informar local'}</Text>
                <Text style={styles.caption}>{light ? !light.fit && light.spot && lookupHint ? lookupHint : describeLightDetail(light) : ''}</Text>
                <Text style={styles.link}>Alterar local <Ionicons name="create-outline" size={16} /></Text>
              </View>
            </Pressable>
            <View style={[styles.fertilize, compact && styles.fertilizeCompact]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Registrar adubação" disabled={busy || !!action || !!management} accessibilityState={{ disabled: busy, busy }} onPress={() => record('fertilize')} style={styles.fertilizeAction}>
                <Ionicons name="leaf-outline" size={30} color={colors.ink} /><Text style={styles.link}>Adubar</Text>
              </Pressable>
              <Text style={styles.caption}>Última adubação: {lastFertilize ? formatCareDay(lastFertilize.occurredAt) : 'ainda sem registro'}</Text>
            </View>
          </View>
            {busy ? <Text accessibilityLiveRegion="polite" style={styles.caption}>Salvando cuidado...</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
            {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: historyOpen }} onPress={() => setHistoryOpen(!historyOpen)} style={styles.historyToggle}>
              <Ionicons name="time-outline" size={22} color={colors.ink} /><Text style={styles.text}>{historyOpen ? 'Ocultar histórico' : 'Ver histórico'}</Text><Ionicons name={historyOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setManagement({ mode: 'edit', plant })} style={styles.historyToggle}><Ionicons name="create-outline" size={20} color={colors.accent} /><Text style={styles.label}>Editar planta</Text></Pressable>
          </View>
          {historyOpen ? <>
          <Text accessibilityRole="header" style={styles.heading}>Seu histórico</Text>
          {routine ? <CareMeter icon="leaf" iconColor={colors.accent} tint={colors.leafTint} label="Rotina de rega" status={describeRoutineStatus(routine)} level={routine.level} tone={routineTone[routine.state]} detail={describeRoutineDetail(routine)} /> : null}
          <Text style={styles.caption}>Mais recente primeiro · horário do aparelho</Text>
          {plant.history.length ? sortPlantHistory(plant.history).map((entry) => <HistoryItem key={entry.id} entry={entry} disabled={busy} onManage={(next) => { if (!busyRef.current) { setNotice(null); setAction(next); } }} />) : <View style={styles.historyCard}><Text style={styles.label}>Cada cuidado conta</Text><Text style={styles.text}>Registre sua primeira rega ou adubação. Os próximos cuidados aparecem aqui.</Text></View>}
          </> : null}
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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 14 },
  contentCompact: { padding: 16, gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 20 },
  identityCopy: { flex: 1, minWidth: 0, gap: 6 },
  photo: { height: 128, width: 128, borderRadius: 24 },
  photoCompact: { height: 88, width: 88, borderRadius: 20 },
  secondaryCare: { flexDirection: 'row', padding: 20, gap: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  secondaryCareCompact: { flexDirection: 'column' },
  lightAction: { flex: 1, flexDirection: 'row', gap: 12, minHeight: 48, alignItems: 'flex-start' },
  fertilize: { flex: 1, borderLeftWidth: 1, borderLeftColor: colors.borderStrong, paddingLeft: 18, gap: 8 },
  fertilizeCompact: { borderLeftWidth: 0, paddingLeft: 0, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  fertilizeAction: { alignItems: 'center', justifyContent: 'center', minHeight: 80, gap: 8 },
  link: { fontSize: 16, fontWeight: '700', color: colors.ink },
  historyToggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 8 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '800', flexShrink: 1 },
  titleCompact: { fontSize: 26 },
  species: { color: colors.accent, fontSize: 15, fontStyle: 'italic' },
  heading: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  text: { color: colors.text, fontSize: 15, lineHeight: 24 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  secondary: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.borderStrong },
  historyCard: { borderRadius: 20, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyAction: { minHeight: 44, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceWarm },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 22 },
  success: { color: colors.ink, fontSize: 14, lineHeight: 22, fontWeight: '700' },
});
