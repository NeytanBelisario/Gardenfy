import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompactLayout } from '../../hooks/useCompactLayout';
import { PlantPhoto } from '../../components/PlantPhoto';
import { careLabels } from './plantHistory';
import { PlantCareDialog, type PlantCareAction } from './PlantCareDialog';
import { GardenManagementDialog, type GardenManagementAction } from './GardenManagementDialog';
import { PlantInfoDialog } from './PlantInfoDialog';
import { WateringIntervalDialog } from './WateringIntervalDialog';
import { LightSpotDialog } from './LightSpotDialog';
import { PlantWateringCard } from './PlantWateringCard';
import { describeLightStatus, getLightStatus, spotPhrase } from './light';
import { getRoutineStatus } from './routine';
import { PlantHistoryCard } from './PlantHistoryCard';
import { getWaterStatus } from './watering';
import { careSummary } from './waterPresentation';
import { useCareEstimateStatus } from './CareEstimateSync';
import { lastPlantCare } from './careActivity';
import { recordPlantCare, useGardenDetails } from './store';
import type { PlantCareType } from './types';
import type { LightFit } from './careProfiles';
import { colors } from '../../theme/tokens';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const lightFitColor: Record<LightFit, string> = { ideal: colors.accentStrong, ok: colors.sun, poor: colors.danger };

const topGlow = 'linear-gradient(180deg, #dde8d4 0%, rgba(251, 249, 245, 0) 100%)';

function RoundButton({ icon, label, disabled, onPress }: { icon: IoniconName; label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={colors.ink} />
    </Pressable>
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
  const summary = water ? careSummary[water.state] : undefined;
  const locked = busy || !!action || !!management;
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
      <View style={styles.glow} />
      <Ionicons name="leaf" size={220} color={colors.accent} style={[styles.decorLeaf, { top: insets.top + 40 }]} />
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <RoundButton icon="chevron-back" label="Voltar ao jardim" onPress={back} />
        <Text numberOfLines={1} style={styles.topTitle}>{garden?.name ?? 'Minhas plantas'}</Text>
        {plant ? <RoundButton icon="information-circle-outline" label={'Ver informações de ' + plant.name} disabled={busy} onPress={() => setInfoOpen(true)} /> : <View style={styles.roundSpacer} />}
      </View>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingBottom: 32 + insets.bottom }]}>
        {garden && plant && water ? <>
          <View style={styles.hero}>
            <PlantPhoto uri={plant.imageUrl} compact style={[styles.photo, compact && styles.photoCompact]} label={'Foto de ' + plant.name} />
            <View style={styles.heroCopy}>
              <View style={styles.nameRow}>
                <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>{plant.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={'Editar ' + plant.name} disabled={busy} onPress={() => setManagement({ mode: 'edit', plant })} hitSlop={8} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                  <Ionicons name="pencil" size={16} color={colors.accentStrong} />
                </Pressable>
              </View>
              {plant.species ? <Text style={styles.species}>{plant.species.scientificName}</Text> : plant.subtitle ? <Text style={styles.caption}>{plant.subtitle}</Text> : null}
              {summary ? <View style={[styles.summary, { backgroundColor: summary.tint }]}>
                <Ionicons name={summary.icon} size={18} color={summary.color} /><Text style={[styles.summaryText, { color: summary.color }]}>{summary.label}</Text>
              </View> : null}
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.heading}>Cuidados da planta</Text>
          <PlantWateringCard status={water} busy={locked} loading={estimateStatus === 'loading'} onAdjust={() => setIntervalOpen(true)} onWater={() => record('water')} />

          <View style={[styles.sideCard, compact && styles.sideCardCompact]}>
            <Pressable accessibilityRole="button" accessibilityLabel={light?.spot ? 'Luz: ' + spotPhrase(light.spot).toLowerCase() + (light.fit ? ', ' + describeLightStatus(light).toLowerCase() : '') + '. Mudar local' : 'Luz: definir onde a planta fica'} disabled={busy} onPress={() => setLightOpen(true)} style={({ pressed }) => [styles.lightArea, pressed && styles.pressed]}>
              <View style={[styles.iconTile, compact && styles.iconTileCompact]}><Ionicons name="sunny-outline" size={compact ? 26 : 30} color={colors.sun} /></View>
              <View style={styles.lightCopy}>
                <Text style={styles.sideTitle}>Luz</Text>
                {light?.spot && light.fit
                  ? <Text style={[styles.lightStatus, { color: lightFitColor[light.fit] }]}>{describeLightStatus(light)}</Text>
                  : <Text style={styles.lightHint}>{light?.spot ? 'Sem referência da espécie para comparar' : 'Compare com o que a espécie prefere'}</Text>}
                <View style={[styles.spotChip, !light?.spot && styles.spotChipEmpty]}>
                  <Ionicons name={light?.spot ? 'pencil-outline' : 'add'} size={16} color={light?.spot ? colors.textLead : colors.accentStrong} />
                  <Text style={[styles.spotText, !light?.spot && styles.spotTextEmpty]}>{light?.spot ? spotPhrase(light.spot) : 'Definir onde ela fica'}</Text>
                </View>
                {light?.fit && light.referenceSource === 'ai' ? <Text style={styles.aiBadge}>Estimativa da IA</Text> : null}
              </View>
            </Pressable>
            <View style={styles.divider} />
            <Pressable accessibilityRole="button" accessibilityLabel="Registrar adubação" accessibilityState={{ disabled: locked, busy }} disabled={locked} onPress={() => record('fertilize')} style={({ pressed }) => [styles.fertilize, compact && styles.fertilizeCompact, pressed && styles.pressed]}>
              <View style={styles.fertilizeCircle}><MaterialCommunityIcons name="sprout-outline" size={34} color={colors.accentStrong} /></View>
              <Text style={styles.fertilizeLabel}>Adubar</Text>
              <Text style={styles.small}>{lastFertilize ? 'Última em ' + new Date(lastFertilize.occurredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Nenhuma ainda'}</Text>
            </Pressable>
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text> : null}

          <PlantHistoryCard plant={plant} routine={routine} disabled={busy} onManage={(next) => { if (!busyRef.current) { setNotice(null); setAction(next); } }} />
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
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  // react-native-web ignores experimental_backgroundImage, so the web build gets the CSS property directly.
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, pointerEvents: 'none', ...Platform.select<object>({ web: { backgroundImage: topGlow }, default: { experimental_backgroundImage: topGlow } }) },
  decorLeaf: { position: 'absolute', right: -70, opacity: 0.06, transform: [{ rotate: '-25deg' }], pointerEvents: 'none' },
  topBar: { width: '100%', maxWidth: 720, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  topTitle: { flex: 1, textAlign: 'center', color: colors.ink, fontSize: 19, fontWeight: '600' },
  roundButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 4px 12px rgba(23, 54, 29, 0.10)' },
  roundSpacer: { width: 52, height: 52 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, gap: 18 },
  contentCompact: { padding: 16, gap: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  photo: { width: 156, height: 156, borderRadius: 28, borderWidth: 3, borderColor: colors.surface, boxShadow: '0px 10px 24px rgba(23, 54, 29, 0.14)' },
  photoCompact: { width: 112, height: 112, borderRadius: 22 },
  heroCopy: { flex: 1, gap: 6, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, alignSelf: 'stretch' },
  editButton: { width: 32, height: 32, marginTop: 2, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 2px 8px rgba(23, 54, 29, 0.10)' },
  title: { color: colors.ink, fontSize: 30, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5, flexShrink: 1 },
  titleCompact: { fontSize: 24, lineHeight: 28 },
  species: { color: colors.accentStrong, fontSize: 16, fontStyle: 'italic' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4 },
  summaryText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  heading: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginTop: 6 },
  sideCard: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 28, padding: 18, gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 10px 28px rgba(23, 54, 29, 0.08)' },
  sideCardCompact: { padding: 14, gap: 10 },
  lightArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 16 },
  iconTile: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sunTint },
  iconTileCompact: { width: 44, height: 44, borderRadius: 14 },
  lightCopy: { flex: 1, gap: 2, alignItems: 'flex-start' },
  sideTitle: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  lightStatus: { fontSize: 15, fontWeight: '600' },
  lightHint: { color: colors.textSoft, fontSize: 14, lineHeight: 20 },
  spotChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceWarm, borderWidth: 1, borderColor: colors.border },
  spotChipEmpty: { backgroundColor: colors.leafTint, borderColor: '#cfe0c8' },
  spotText: { color: colors.textLead, fontSize: 14, fontWeight: '600' },
  spotTextEmpty: { color: colors.accentStrong },
  divider: { width: 1, backgroundColor: colors.border },
  fertilize: { width: 104, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 16 },
  fertilizeCompact: { width: 88 },
  fertilizeCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.leafTint, borderWidth: 1, borderColor: '#cfe0c8' },
  fertilizeLabel: { color: colors.accentStrong, fontSize: 17, fontWeight: '800' },
  small: { color: colors.textSoft, fontSize: 13, textAlign: 'center' },
  aiBadge: { overflow: 'hidden', color: colors.ai, backgroundColor: colors.aiTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: '700', marginTop: 4 },
  text: { color: colors.text, fontSize: 15, lineHeight: 22 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 21 },
  secondary: { minHeight: 52, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.borderStrong },
  historyCard: { borderRadius: 20, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  errorText: { color: colors.danger, fontSize: 14, lineHeight: 22 },
  success: { color: colors.ink, fontSize: 14, lineHeight: 22, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
