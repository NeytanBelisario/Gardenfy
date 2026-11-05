import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type CareMeterTone = 'good' | 'warn' | 'alert' | 'neutral';

const toneColors: Record<CareMeterTone, string> = {
  good: '#4c8a45',
  warn: '#c58a12',
  alert: '#c0412b',
  neutral: '#a5ad9f',
};

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  tint: string;
  label: string;
  status: string;
  detail?: string;
  /** 0..1 */
  level: number;
  tone: CareMeterTone;
  action?: { label: string; accessibilityLabel?: string; onPress: () => void; disabled?: boolean };
};

export function CareMeter({ icon, iconColor, tint, label, status, detail, level, tone, action }: Props) {
  const percent = Math.round(Math.min(1, Math.max(0, level)) * 100);
  return (
    <View style={styles.meter}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: tint }]}><Ionicons name={icon} size={20} color={iconColor} /></View>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.status, { color: tone === 'neutral' ? '#17361d' : toneColors[tone] }]}>{status}</Text>
        </View>
        {action ? (
          <Pressable accessibilityRole="button" accessibilityLabel={action.accessibilityLabel ?? action.label} disabled={action.disabled} onPress={action.onPress} hitSlop={6} style={[styles.action, action.disabled && styles.disabled]}>
            <Text style={styles.actionText}>{action.label}</Text>
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
  meter: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#fff' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#586653', textTransform: 'uppercase', letterSpacing: 0.6 },
  status: { fontSize: 17, fontWeight: '800' },
  action: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 12, backgroundColor: '#eef2e8' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#476644' },
  track: { height: 10, borderRadius: 5, backgroundColor: '#e6e9e1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  detail: { fontSize: 13, lineHeight: 20, color: '#586653' },
  disabled: { opacity: 0.5 },
});
