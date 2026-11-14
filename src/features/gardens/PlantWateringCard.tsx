import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { describeWaterStatus, describeWateringPlan, type WaterStatus } from './watering';
import { getCycleSegments, getWateringCycle, relativeDay } from './wateringCycle';
import { CycleTimer } from './CycleTimer';
import { describeNextWatering, pluralDays as days, waterStateColors } from './waterPresentation';

export function PlantWateringCard({ status, busy, loading, onAdjust, onWater }: {
  status: WaterStatus; busy: boolean; loading: boolean; onAdjust: () => void; onWater: () => void;
}) {
  const cycle = getWateringCycle(status);
  const next = describeNextWatering(status, cycle?.due, loading);
  const { tone, tint } = waterStateColors(status.state);
  const timer = cycle && status.lastWateredAt ? getCycleSegments(cycle, status.lastWateredAt) : undefined;
  // Weekday names only fit while there are few segments.
  const dayLabels = timer && timer.unitDays === 1 && timer.segments.length <= 10;
  const ai = status.plan?.source === 'species' && status.plan.referenceSource === 'ai';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconTile}><Ionicons name="water-outline" size={30} color={colors.accentStrong} /></View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>PRÓXIMA REGA</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: tone }]}>{next.title}</Text>
          {next.line ? <Text style={styles.date}>{next.line}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ajustar frequência de rega" disabled={busy} onPress={onAdjust} hitSlop={4} style={({ pressed }) => [styles.adjust, pressed && styles.pressed]}>
          <Ionicons name="options-outline" size={24} color={colors.ink} />
        </Pressable>
      </View>

      {status.plan ? <View style={[styles.cycle, !cycle && styles.cycleEmpty]}>
        <View style={styles.row}>
          <View style={styles.cycleCopy}>
            <Text style={styles.cycleTitle}>Ciclo de {days(status.plan.intervalDays)}</Text>
            {ai ? <Text style={styles.aiBadge}>Estimativa da IA</Text> : <Text style={styles.plan}>{status.plan.source === 'custom' ? 'Definido por você' : 'Referência da espécie'}</Text>}
          </View>
          {cycle && next.badge ? <Text style={[styles.badge, { color: tone, backgroundColor: tint }]}>{next.badge}</Text> : null}
        </View>
        {cycle ? <>
          <CycleTimer segments={timer!.segments} tone={tone} labels={!!dayLabels} accessibilityLabel={'Ciclo de rega. ' + describeWaterStatus(status) + '. ' + describeWateringPlan(status.plan)} />
          <View style={styles.row}>
            <Text style={styles.caption}>Última rega · <Text style={styles.captionStrong}>{relativeDay(new Date(status.lastWateredAt!))}</Text></Text>
            <Text style={styles.caption}>Próxima · <Text style={styles.captionStrong}>{relativeDay(cycle.due)}</Text></Text>
          </View>
        </> : null}
      </View> : null}

      <Pressable accessibilityRole="button" accessibilityLabel="Registrar rega" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={onWater} style={({ pressed }) => [styles.primary, (busy || pressed) && styles.pressed]}>
        <Ionicons name="water-outline" size={22} color={colors.onInk} /><Text style={styles.primaryText}>{busy ? 'Salvando…' : 'Registrar rega'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 18, borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 10px 28px rgba(23, 54, 29, 0.08)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconTile: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  copy: { flex: 1, gap: 2 },
  eyebrow: { color: colors.textSoft, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, flexShrink: 1 },
  date: { color: colors.text, fontSize: 15 },
  adjust: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceWarm, boxShadow: '0px 2px 6px rgba(23, 54, 29, 0.08)' },
  cycle: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 10 },
  cycleEmpty: { gap: 0 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cycleCopy: { flexShrink: 1, gap: 4, alignItems: 'flex-start' },
  cycleTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  badge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, fontSize: 14, fontWeight: '700' },
  caption: { color: colors.textSoft, fontSize: 14, flexShrink: 1 },
  captionStrong: { color: colors.ink, fontWeight: '700' },
  plan: { color: colors.textSoft, fontSize: 13 },
  aiBadge: { overflow: 'hidden', color: colors.ai, backgroundColor: colors.aiTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, fontWeight: '700' },
  primary: { minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 999, backgroundColor: colors.accentStrong, boxShadow: '0px 6px 14px rgba(47, 107, 42, 0.28)' },
  primaryText: { color: colors.onInk, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
