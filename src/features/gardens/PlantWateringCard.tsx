import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { describeWaterStatus, describeWateringPlan, type WaterStatus } from './watering';
import { getWateringCycle } from './wateringCycle';

export function PlantWateringCard({ status, busy, loading, onAdjust, onWater }: {
  status: WaterStatus; busy: boolean; loading: boolean; onAdjust: () => void; onWater: () => void;
}) {
  const cycle = getWateringCycle(status);
  const urgent = status.state === 'due' || status.state === 'overdue';
  const tone = status.state === 'overdue' ? colors.danger : urgent ? colors.sun : colors.ink;
  const badge = status.state === 'overdue' ? 'Rega atrasada' : status.state === 'due' ? 'Regar hoje' : status.state === 'soon' ? 'Regar amanhã' : 'Rega em dia';
  const shortDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="water-outline" size={32} color={colors.water} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>PRÓXIMA REGA</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: tone }]}>{describeWaterStatus(status).replace('Próxima rega em ', 'Em ')}</Text>
          {cycle ? <Text style={styles.text}>{cycle.due.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Ajustar frequência de rega" disabled={busy} onPress={onAdjust} style={styles.adjust}>
          <Ionicons name="options-outline" size={25} color={colors.ink} />
        </Pressable>
      </View>
      <Text style={styles.caption}>{status.plan ? describeWateringPlan(status.plan) : loading ? 'Buscando a referência da espécie…' : 'Defina um intervalo para acompanhar a próxima rega.'}</Text>
      {status.plan?.source === 'species' && status.plan.referenceSource === 'ai' ? <Text style={styles.aiBadge}>Estimativa da IA</Text> : null}
      {cycle ? <View style={styles.cycle}>
        <View style={styles.row}><Text style={styles.text}>Ciclo de rega</Text><Text style={[styles.badge, { color: tone }]}>{badge}</Text></View>
        <View accessible accessibilityRole="progressbar" accessibilityLabel={'Tempo do ciclo de rega. ' + describeWaterStatus(status)} accessibilityValue={{ min: 0, max: 100, now: Math.round(cycle.progress * 100), text: cycle.elapsedDays + ' de ' + cycle.intervalDays + ' dias' }} style={styles.track}>
          <View style={[styles.fill, { width: `${cycle.progress * 100}%`, backgroundColor: tone }]} />
          <View style={[styles.marker, { left: `${cycle.progress * 100}%`, backgroundColor: tone }]} />
        </View>
        <View style={styles.row}><Text style={styles.caption}>{shortDate(new Date(status.lastWateredAt!))}</Text><Text style={styles.caption}>{shortDate(cycle.due)}</Text></View>
        <View style={styles.row}><Text style={styles.caption}>Hoje · {cycle.elapsedDays} de {cycle.intervalDays} dias</Text><Text style={styles.caption}>{status.state === 'overdue' ? 'Ciclo ultrapassado' : status.daysUntil === 0 ? 'Prevista para hoje' : 'Faltam ' + status.daysUntil + (status.daysUntil === 1 ? ' dia' : ' dias')}</Text></View>
        <Text style={styles.caption}>Previsão pelo intervalo de rega. Confira o substrato antes de regar.</Text>
      </View> : status.lastWateredAt ? <Text style={styles.caption}>Última rega: {new Date(status.lastWateredAt).toLocaleDateString('pt-BR')}</Text> : <Text style={styles.caption}>O ciclo começa quando você registrar a primeira rega.</Text>}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={onWater} style={[styles.primary, busy && styles.disabled]}>
        <Ionicons name="water-outline" size={24} color={colors.onInk} /><Text style={styles.primaryText}>{busy ? 'Salvando…' : 'Registrar rega'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, gap: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 5 },
  eyebrow: { color: colors.text, fontSize: 12, letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '800', flexShrink: 1 },
  text: { color: colors.textLead, fontSize: 16 },
  caption: { color: colors.text, fontSize: 13, lineHeight: 20, flexShrink: 1 },
  adjust: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceWarm },
  cycle: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  badge: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  aiBadge: { color: colors.ai, backgroundColor: colors.aiTint, alignSelf: 'flex-start', borderRadius: 8, padding: 6, fontSize: 12, fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 4, marginTop: 8 },
  fill: { height: '100%', borderRadius: 4 },
  marker: { position: 'absolute', width: 2, height: 16, top: -4, marginLeft: -2 },
  primary: { minHeight: 56, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, backgroundColor: colors.ink },
  primaryText: { color: colors.onInk, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  disabled: { opacity: 0.5 },
});
