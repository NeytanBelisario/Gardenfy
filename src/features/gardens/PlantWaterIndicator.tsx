import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toneColors } from '../../components/CareMeter';
import { waterTone } from './careMeterTones';
import { describeWaterStatus, type WaterStatus } from './watering';

/** Compact water status for plant lists: icon, short status and a thin level bar. */
export function PlantWaterIndicator({ status }: { status: WaterStatus }) {
  const tone = waterTone[status.state];
  const color = toneColors[tone];
  const urgent = status.state === 'due' || status.state === 'overdue';
  const percent = Math.round(status.level * 100);
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name={urgent ? 'water' : 'water-outline'} size={15} color={tone === 'neutral' ? '#2f6f8f' : color} />
        <Text style={[styles.status, { color: tone === 'neutral' ? '#586653' : color }, urgent && styles.urgent]} numberOfLines={1}>{describeWaterStatus(status)}</Text>
      </View>
      <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={'Água: ' + describeWaterStatus(status)} accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  status: { flexShrink: 1, fontSize: 13, fontWeight: '700' },
  urgent: { fontWeight: '800' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#e6e9e1', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
