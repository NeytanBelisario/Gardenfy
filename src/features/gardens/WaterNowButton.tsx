import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quickWater } from './quickWater';
import { wateredToday } from './watering';
import type { GardenPlant } from './types';
import { colors } from '../../theme/tokens';
import { usePopOnTrue } from '../../hooks/usePopOnTrue';

/** Round one-tap watering button; shows a check once the plant was watered today. */
export function WaterNowButton({ gardenId, plant, urgent = false }: { gardenId: string; plant: GardenPlant; urgent?: boolean }) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const done = wateredToday(plant);
  const pop = usePopOnTrue(done);
  const press = async () => {
    if (busyRef.current || done) return;
    busyRef.current = true; setBusy(true);
    try { await quickWater(gardenId, plant); } finally { busyRef.current = false; setBusy(false); }
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={done ? plant.name + ' já foi regada hoje' : 'Registrar rega de ' + plant.name}
      accessibilityState={{ disabled: done || busy, busy }} disabled={done || busy} onPress={press} hitSlop={6}
      style={({ pressed }) => [styles.button, urgent && !done && styles.urgent, done && styles.done, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator size="small" color={urgent ? colors.onInk : colors.water} />
        : <Animated.View style={{ transform: [{ scale: pop }] }}><Ionicons name={done ? 'checkmark' : 'water'} size={22} color={done ? colors.accentStrong : urgent ? colors.onInk : colors.water} /></Animated.View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.waterTint },
  urgent: { backgroundColor: colors.water },
  done: { backgroundColor: '#e2f0dc' },
  pressed: { transform: [{ scale: 0.92 }] },
});
