import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantPhoto } from '../../components/PlantPhoto';
import { colors } from '../../theme/tokens';
import { CycleTimer } from './CycleTimer';
import { WaterNowButton } from './WaterNowButton';
import { describeLightStatus, getLightStatus, spotPhrase } from './light';
import { describeWaterStatus, getWaterStatus } from './watering';
import { getCycleSegments, getWateringCycle, relativeDay } from './wateringCycle';
import { careSummary, describeNextWatering, waterStateColors } from './waterPresentation';
import type { GardenPlant } from './types';

const lightIconColor = { ideal: colors.accentStrong, ok: colors.sun, poor: colors.danger } as const;

/** Garden list card: identity on top, next watering with a compact timer and quick actions below. */
export function GardenPlantCard({ gardenId, plant, onOpen, onLight }: {
  gardenId: string; plant: GardenPlant; onOpen: () => void; onLight: () => void;
}) {
  const water = getWaterStatus(plant);
  const light = getLightStatus(plant);
  const cycle = getWateringCycle(water);
  const timer = cycle && water.lastWateredAt ? getCycleSegments(cycle, water.lastWateredAt) : undefined;
  const next = describeNextWatering(water, cycle?.due);
  const { tone } = waterStateColors(water.state);
  const summary = careSummary[water.state];
  const urgent = water.state === 'due' || water.state === 'overdue';
  // "Hoje"/"Amanhã" already say the day; other states show the date or the hint.
  const dateLine = !cycle ? next.line : water.state === 'overdue' ? 'desde ' + relativeDay(cycle.due) : water.state === 'ok' ? relativeDay(cycle.due) : '';
  return (
    <View style={[styles.card, urgent && { borderColor: tone }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Abrir cuidados de ' + plant.name + '. ' + summary.label} onPress={onOpen} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <PlantPhoto uri={plant.imageUrl} compact style={styles.photo} label={'Foto de ' + plant.name} />
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={2}>{plant.name}</Text>
          {plant.species?.scientificName ?? plant.subtitle ? <Text style={styles.species} numberOfLines={1}>{plant.species?.scientificName ?? plant.subtitle}</Text> : null}
          <View style={[styles.pill, { backgroundColor: summary.tint }]}>
            <Ionicons name={summary.icon} size={14} color={summary.color} /><Text style={[styles.pillText, { color: summary.color }]}>{summary.label}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textLead} />
      </Pressable>

      <View style={styles.panel}>
        <View style={styles.waterRow}>
          <View style={styles.waterCopy}>
            <Text style={styles.eyebrow}>Próxima rega</Text>
            <Text style={styles.next}><Text style={[styles.nextTitle, { color: tone }]}>{next.title}</Text>{dateLine ? <Text style={styles.nextDate}>{'  ·  ' + dateLine}</Text> : null}</Text>
          </View>
          <WaterNowButton gardenId={gardenId} plant={plant} urgent={urgent} />
        </View>
        {timer ? <CycleTimer compact segments={timer.segments} tone={tone} accessibilityLabel={'Ciclo de rega de ' + plant.name + '. ' + describeWaterStatus(water)} /> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={light.spot ? 'Luz de ' + plant.name + ': ' + spotPhrase(light.spot).toLowerCase() + '. Mudar local' : 'Definir onde ' + plant.name + ' fica'} onPress={onLight} hitSlop={4} style={({ pressed }) => [styles.lightChip, pressed && styles.pressed]}>
          <Ionicons name="sunny-outline" size={16} color={light.fit ? lightIconColor[light.fit] : colors.sun} />
          <Text style={styles.lightText} numberOfLines={1}>
            {light.spot ? spotPhrase(light.spot) : 'Definir onde ela fica'}
            {light.spot && light.fit ? <Text style={{ color: lightIconColor[light.fit] }}>{' · ' + describeLightStatus(light)}</Text> : null}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSoft} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 12, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 10px 28px rgba(23, 54, 29, 0.08)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20 },
  photo: { width: 84, height: 84, borderRadius: 22 },
  identity: { flex: 1, gap: 4, alignItems: 'flex-start' },
  name: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  species: { color: colors.textSoft, fontSize: 14, fontStyle: 'italic' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  pillText: { fontSize: 13, fontWeight: '700' },
  panel: { gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.surfaceSoft },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  waterCopy: { flex: 1, gap: 2 },
  eyebrow: { color: colors.textSoft, fontSize: 13 },
  next: { flexShrink: 1 },
  nextTitle: { fontSize: 20, fontWeight: '800' },
  nextDate: { color: colors.text, fontSize: 14 },
  lightChip: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  lightText: { flexShrink: 1, color: colors.textLead, fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
