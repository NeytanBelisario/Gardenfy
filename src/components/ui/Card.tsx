import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../../theme/tokens';

/** Superfície padrão: branca com borda (default) ou verde-clara (muted). */
export function Card({ children, tone = 'default', style }: { children: React.ReactNode; tone?: 'default' | 'muted'; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.base, tone === 'muted' ? styles.muted : styles.default, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xl, padding: space.xl, gap: space.md },
  default: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  muted: { backgroundColor: colors.surfaceMuted },
});
