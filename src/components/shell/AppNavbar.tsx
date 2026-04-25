import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  white: '#ffffff',
} as const;

const navItems = [
  { label: 'Jardins', icon: 'sprout', route: '/', activeOn: ['/'] },
  { label: 'Scan', icon: 'camera-outline', route: '/scan', activeOn: ['/scan'] },
  { label: 'Tarefas', icon: 'list-outline', route: '/tasks', activeOn: ['/tasks'] },
  { label: 'Perfil', icon: 'person-outline', route: '/profile', activeOn: ['/profile'] },
] as const;

function NavIcon({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const color = active ? COLORS.primary : `${COLORS.secondary}99`;

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
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: hidden ? 120 : 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: hidden ? 0 : 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hidden, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.navShell,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.navBar}>
        {navItems.slice(0, 2).map((item) => {
          const active = item.activeOn.includes(pathname as never);

          return (
            <Pressable
              key={item.label}
              style={styles.navItem}
              onPress={() => {
                if (item.route === '/tasks' || item.route === '/profile') {
                  return;
                }

                router.push(item.route as never);
              }}
            >
              <View style={[styles.navChip, active && styles.navChipActive]}>
                <NavIcon item={item} active={active} />
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable style={styles.centerAction} onPress={() => router.push('/preview')}>
          <Ionicons name="scan" size={22} color={COLORS.white} />
        </Pressable>

        {navItems.slice(2).map((item) => {
          const active = item.activeOn.includes(pathname as never);

          return (
            <Pressable key={item.label} style={styles.navItem}>
              <View style={[styles.navChip, active && styles.navChipActive]}>
                <NavIcon item={item} active={active} />
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
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
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(251, 249, 245, 0.92)',
    shadowColor: '#17361d',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 52,
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
    color: `${COLORS.secondary}99`,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
  centerAction: {
    width: 54,
    height: 54,
    marginTop: -18,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
