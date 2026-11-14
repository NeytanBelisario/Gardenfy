import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import type { CycleSegment } from './wateringCycle';

const weekday = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

/** Countdown of days until the next watering: lived days grey, today highlighted, days left tinted. */
export function CycleTimer({ segments, tone, labels = false, compact = false, accessibilityLabel }: {
  segments: CycleSegment[]; tone: string; labels?: boolean; compact?: boolean; accessibilityLabel: string;
}) {
  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={accessibilityLabel} style={styles.timer}>
      <View style={[styles.segments, compact && styles.segmentsCompact]}>
        {segments.map((segment) => <View key={segment.start.getTime()} style={[
          styles.segment, compact && styles.segmentCompact,
          segment.state === 'used' && styles.segmentUsed,
          segment.state === 'current' && [compact ? styles.currentCompact : styles.current, { backgroundColor: tone }],
          segment.state === 'left' && { backgroundColor: tone, opacity: 0.3 },
        ]} />)}
        <Ionicons name="water" size={compact ? 14 : 20} color={tone} style={compact ? styles.goalCompact : styles.goal} />
      </View>
      {labels ? <View style={styles.segments}>
        {segments.map((segment) => <Text key={segment.start.getTime()} numberOfLines={1} style={[styles.dayLabel, segment.state === 'current' && [styles.dayLabelToday, { color: tone }]]}>
          {segment.state === 'current' ? 'hoje' : weekday(segment.start)}
        </Text>)}
        <View style={styles.goal} />
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timer: { gap: 6 },
  segments: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segmentsCompact: { gap: 3 },
  segment: { flex: 1, height: 10, borderRadius: 5 },
  segmentCompact: { height: 6, borderRadius: 3 },
  segmentUsed: { backgroundColor: colors.surfaceWarmHigh },
  current: { height: 16, borderRadius: 8 },
  currentCompact: { height: 10, borderRadius: 5 },
  goal: { width: 24, marginLeft: 2, textAlign: 'center' },
  goalCompact: { width: 16, marginLeft: 2, textAlign: 'center' },
  dayLabel: { flex: 1, textAlign: 'center', color: colors.textSoft, fontSize: 12 },
  dayLabelToday: { fontWeight: '800' },
});
