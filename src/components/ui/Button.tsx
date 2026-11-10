import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, minTouch, radius, space } from '../../theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'soft';
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Botão padrão do app: alvo mínimo de 48 dp, estados de desabilitado e ocupado anunciados. */
export function Button({ label, onPress, variant = 'primary', icon, accessibilityLabel, disabled, busy, style }: Props) {
  const inactive = disabled || busy;
  const foreground = variant === 'primary' ? colors.onInk : colors.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      disabled={inactive} onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], inactive && styles.disabled, pressed && styles.pressed, style]}>
      {busy ? <ActivityIndicator size="small" color={foreground} /> : icon ? <Ionicons name={icon} size={20} color={foreground} /> : null}
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: minTouch + 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  primary: { backgroundColor: colors.ink },
  secondary: { borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  soft: { backgroundColor: colors.surfaceMuted },
  label: { flexShrink: 1, fontSize: font.body, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
