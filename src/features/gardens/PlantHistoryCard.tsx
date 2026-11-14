import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { formatPercent } from './metricPresentation';
import { careLabels, formatHistoryDate, formatHistoryDay, sortPlantHistory } from './plantHistory';
import { describeRoutineDetail, describeRoutineStatus, type RoutineStatus } from './routine';
import type { PlantCareAction } from './PlantCareDialog';
import type { GardenPlant, PlantHistoryEntry } from './types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const PREVIEW_COUNT = 5;

function entryLook(entry: PlantHistoryEntry): { title: string; icon: IoniconName; color: string; tint: string } {
  if (entry.kind === 'care') return entry.careType === 'water'
    ? { title: careLabels.water, icon: 'water-outline', color: colors.water, tint: colors.waterTint }
    : { title: careLabels.fertilize, icon: 'leaf-outline', color: colors.accentStrong, tint: colors.leafTint };
  if (entry.kind === 'identification') return { title: 'Espécie identificada', icon: 'scan-outline', color: colors.textLead, tint: colors.surfaceMuted };
  return { title: 'Análise antiga', icon: 'camera-outline', color: colors.textSoft, tint: colors.surfaceWarm };
}

function TimelineRow({ entry, last, disabled, onManage }: { entry: PlantHistoryEntry; last: boolean; disabled: boolean; onManage: (action: PlantCareAction) => void }) {
  const look = entryLook(entry);
  const when = formatHistoryDate(entry.occurredAt);
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: look.tint }]}><Ionicons name={look.icon} size={18} color={look.color} /></View>
        {!last ? <View style={styles.line} /> : null}
      </View>
      <View style={[styles.rowBody, !last && styles.rowSpacing]}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{look.title}</Text>
          <Text style={styles.rowDate}>{formatHistoryDay(entry.occurredAt)}</Text>
          {entry.kind === 'identification' ? <Text style={styles.rowNote}>{entry.species.commonName} · <Text style={styles.italic}>{entry.species.scientificName}</Text> · Pl@ntNet</Text> : null}
          {entry.kind === 'analysis' ? <Text style={styles.rowNote}>
            {entry.snapshot.plantName} · {entry.snapshot.health}. Estimativa antiga do Gemini, não é medição atual. Vitalidade {formatPercent(entry.snapshot.vitality)} · Água {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'water')?.value)} · Luz {formatPercent(entry.snapshot.metrics.find((metric) => metric.kind === 'light')?.value)}
          </Text> : null}
        </View>
        {entry.kind === 'care' ? <View style={styles.rowActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={'Corrigir ' + careLabels[entry.careType] + ' de ' + when} disabled={disabled} onPress={() => onManage({ mode: 'edit', record: entry })} hitSlop={6} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="pencil-outline" size={18} color={colors.textLead} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={'Excluir ' + careLabels[entry.careType] + ' de ' + when} disabled={disabled} onPress={() => onManage({ mode: 'delete', record: entry })} hitSlop={6} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View> : null}
      </View>
    </View>
  );
}

export function PlantHistoryCard({ plant, routine, disabled, onManage }: {
  plant: GardenPlant; routine?: RoutineStatus; disabled: boolean; onManage: (action: PlantCareAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const entries = sortPlantHistory(plant.history);
  const visible = showAll ? entries : entries.slice(0, PREVIEW_COUNT);
  const latestDay = entries.length ? formatHistoryDay(entries[0].occurredAt).split(' · ')[0] : '';
  const summary = entries.length
    ? entries.length + (entries.length === 1 ? ' registro' : ' registros') + ' · último ' + (/^(Hoje|Ontem)$/.test(latestDay) ? latestDay.toLowerCase() : 'em ' + latestDay)
    : 'Nenhum cuidado registrado ainda';
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={'Histórico. ' + summary} onPress={() => setOpen((value) => !value)} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerIcon}><Ionicons name="time-outline" size={24} color={colors.textLead} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>{summary}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textLead} />
      </Pressable>

      {open ? <View style={styles.body}>
        {routine ? <View style={styles.routine}>
          <Ionicons name="leaf" size={20} color={colors.accentStrong} />
          <View style={styles.headerCopy}>
            <Text style={styles.routineTitle}>{describeRoutineStatus(routine)}</Text>
            <Text style={styles.subtitle}>{describeRoutineDetail(routine)}</Text>
          </View>
        </View> : null}

        {entries.length ? <View>
          {visible.map((entry, index) => <TimelineRow key={entry.id} entry={entry} last={index === visible.length - 1} disabled={disabled} onManage={onManage} />)}
        </View> : <Text style={styles.subtitle}>Registre a primeira rega ou adubação. Os próximos cuidados aparecem aqui.</Text>}

        {entries.length > PREVIEW_COUNT ? <Pressable accessibilityRole="button" onPress={() => setShowAll((value) => !value)} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
          <Text style={styles.moreText}>{showAll ? 'Mostrar menos' : 'Mostrar todos (' + entries.length + ')'}</Text>
        </Pressable> : null}
        {entries.length ? <Text style={styles.footnote}>Registrado por você · horário do aparelho</Text> : null}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0px 10px 28px rgba(23, 54, 29, 0.08)', overflow: 'hidden' },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceWarm },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textSoft, fontSize: 14, lineHeight: 20 },
  body: { borderTopWidth: 1, borderTopColor: colors.border, padding: 18, gap: 16 },
  routine: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.leafTint },
  routineTitle: { color: colors.accentStrong, fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 36, alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1, backgroundColor: colors.border },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowSpacing: { paddingBottom: 18 },
  rowCopy: { flex: 1, gap: 2, paddingTop: 2 },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  rowDate: { color: colors.textSoft, fontSize: 13 },
  rowNote: { color: colors.text, fontSize: 13, lineHeight: 19 },
  italic: { fontStyle: 'italic' },
  rowActions: { flexDirection: 'row', gap: 4 },
  iconButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceWarm },
  more: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.surfaceWarm },
  moreText: { color: colors.textLead, fontSize: 14, fontWeight: '700' },
  footnote: { color: colors.textSoft, fontSize: 12, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
