import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShellUi } from './shellUiStore';
import { colors } from '../../theme/tokens';

const COLORS = {
  background: colors.background,
  primary: colors.ink,
  secondary: colors.accent,
  white: colors.surface,
} as const;

const navItems = [
  { label: 'Jardins', icon: 'sprout', route: '/', activeOn: ['/'] },
  { label: 'Foto', icon: 'camera-outline', route: '/scan', activeOn: ['/scan'] },
  { label: 'Espaço', icon: 'person-outline', route: '/profile', activeOn: ['/profile'] },
] as const;

function NavIcon({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const color = active ? COLORS.primary : COLORS.secondary;

  if (item.label === 'Jardins') {
    return <MaterialCommunityIcons name="sprout" size={20} color={color} />;
  }

  return <Ionicons name={item.icon} size={20} color={color} />;
}

type AppNavbarProps = {
  hidden?: boolean;
};

export function AppNavbar({ hidden = false }: AppNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { menuOpen } = useShellUi();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const shouldHide = hidden || menuOpen || keyboardVisible;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: shouldHide ? 96 : 0,
        duration: shouldHide ? 240 : 280,
        easing: shouldHide ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: shouldHide ? 0 : 1,
        duration: shouldHide ? 180 : 220,
        easing: shouldHide ? Easing.in(Easing.quad) : Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, shouldHide, translateY]);

  return (
    <Animated.View
      accessibilityElementsHidden={shouldHide}
      importantForAccessibility={shouldHide ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.navShell,
        {
          pointerEvents: shouldHide ? 'none' : 'auto',
          paddingBottom: Math.max(insets.bottom, 12),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const active = item.route === '/'
            ? pathname === '/' || pathname.startsWith('/gardens/')
            : item.activeOn.includes(pathname as never);

          return (
            <Pressable
              key={item.label}
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={item.label === 'Foto' ? 'Identificar planta por foto' : item.label}
              accessibilityState={{ selected: active }}
              onPress={() => { if (pathname !== item.route) router.push(item.route); }}
            >
              <View style={[styles.navChip, active && styles.navChipActive]}>
                <NavIcon item={item} active={active} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  navShell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  navBar: {
    width: '92%',
    maxWidth: 420,
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 8px 18px rgba(23, 54, 29, 0.14)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 52,
    flex: 1,
    minHeight: 52,
    gap: 4,
  },
  navChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navChipActive: {
    backgroundColor: 'rgba(71, 102, 68, 0.12)',
  },
  navLabel: {
    maxWidth: '100%',
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
});
