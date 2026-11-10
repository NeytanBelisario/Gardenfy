import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCompactLayout } from '../hooks/useCompactLayout';
import { colors } from '../theme/tokens';

export type CareMeterTone = 'good' | 'warn' | 'alert' | 'neutral';

export const toneColors: Record<CareMeterTone, string> = {
  good: '#4c8a45',
  warn: '#c58a12',
  alert: '#c0412b',
  neutral: '#a5ad9f',
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  iconColor: string;
  tint: string;
  label: string;
  status: string;
  detail?: string;
  /** 0..1 */
  level: number;
  tone: CareMeterTone;
  /** Selo curto ao lado do rótulo, ex.: "Estimativa da IA". */
  badge?: string;
  /** Em telas estreitas o botão vira só o ícone, para sobrar espaço ao estado. */
  action?: { label: string; icon: IconName; accessibilityLabel?: string; onPress: () => void; disabled?: boolean };
};

export function CareMeter({ icon, iconColor, tint, label, status, detail, level, tone, badge, action }: Props) {
  const compact = useCompactLayout();
  const percent = Math.round(Math.min(1, Math.max(0, level)) * 100);
  return (
    <View style={[styles.meter, compact && styles.meterCompact]}>
      <View style={[styles.top, compact && styles.topCompact]}>
        <View style={[styles.icon, compact && styles.iconCompact, { backgroundColor: tint }]}><Ionicons name={icon} size={compact ? 18 : 20} color={iconColor} /></View>
        <View style={styles.copy}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{label}</Text>
            {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
          </View>
          <Text style={[styles.status, compact && styles.statusCompact, { color: tone === 'neutral' ? colors.ink : toneColors[tone] }]}>{status}</Text>
        </View>
        {action ? (
          <Pressable accessibilityRole="button" accessibilityLabel={action.accessibilityLabel ?? action.label} disabled={action.disabled} onPress={action.onPress} hitSlop={6} style={[styles.action, compact && styles.actionCompact, action.disabled && styles.disabled]}>
            {compact ? <Ionicons name={action.icon} size={20} color={colors.accent} /> : <Text style={styles.actionText}>{action.label}</Text>}
          </Pressable>
        ) : null}
      </View>
      <View accessible accessibilityRole="progressbar" accessibilityLabel={label + ': ' + status} accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: toneColors[tone] }]} />
      </View>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.surface },
  meterCompact: { padding: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topCompact: { gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconCompact: { width: 32, height: 32, borderRadius: 16 },
  copy: { flex: 1, gap: 1 },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.aiTint },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.ai },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.6 },
  status: { fontSize: 17, fontWeight: '800' },
  statusCompact: { fontSize: 15 },
  action: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceMuted },
  actionCompact: { width: 40, height: 40, paddingHorizontal: 0, alignItems: 'center', borderRadius: 20 },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.accent },
  track: { height: 10, borderRadius: 5, backgroundColor: '#e6e9e1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  detail: { fontSize: 13, lineHeight: 20, color: colors.text },
  disabled: { opacity: 0.5 },
});
