import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PlantPhoto({ uri, style, label = 'Foto da planta', compact = false }: { uri: string; style?: StyleProp<ViewStyle>; label?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View style={[styles.frame, style]}>
      <Ionicons name="leaf-outline" size={compact ? 30 : 56} color="#476644" />
      {!compact && (!uri || failed) ? <Text style={styles.caption}>Sua planta, do seu jeito</Text> : null}
      {uri && !failed ? <Image source={{ uri }} accessibilityLabel={label} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: '#eef2e8', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18 },
  caption: { color: '#586653', fontSize: 13, textAlign: 'center' },
});
