import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';
import { currentUser, getUserInitial } from '../features/user/profile';
import { useGardenSummaries } from '../features/gardens/store';
import { useNavbarVisibilityOnScroll } from '../hooks/useNavbarVisibilityOnScroll';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  surfaceLow: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  surfaceHighest: '#e4e2de',
  outline: '#737971',
  outlineVariant: '#c2c8bf',
  white: '#ffffff',
  error: '#ba1a1a',
} as const;

const achievements = [
  {
    label: 'First Bloom',
    icon: <MaterialCommunityIcons name="flower" size={28} color={COLORS.primary} />,
    locked: false,
  },
  {
    label: 'Hydro Hero',
    icon: <Ionicons name="water-outline" size={30} color={COLORS.primary} />,
    locked: false,
  },
  {
    label: 'AR Explorer',
    icon: <MaterialCommunityIcons name="cube-scan" size={28} color={COLORS.primary} />,
    locked: false,
  },
  {
    label: 'Master',
    icon: <Feather name="lock" size={28} color={COLORS.outlineVariant} />,
    locked: true,
  },
] as const;

const settingsItems = [
  {
    label: 'Minha Conta',
    icon: <Feather name="user" size={22} color={COLORS.primary} />,
  },
  {
    label: 'Notificacoes',
    icon: <Feather name="bell" size={22} color={COLORS.primary} />,
  },
  {
    label: 'Preferencias de Cultivo',
    icon: <MaterialIcons name="psychology" size={24} color={COLORS.primary} />,
  },
  {
    label: 'Privacidade e Seguranca',
    icon: <MaterialIcons name="security" size={24} color={COLORS.primary} />,
  },
  {
    label: 'Ajuda e Suporte',
    icon: <Feather name="help-circle" size={22} color={COLORS.primary} />,
  },
] as const;

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementItem({
  item,
}: {
  item: (typeof achievements)[number];
}) {
  return (
    <View style={[styles.achievementItem, item.locked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, item.locked && styles.achievementIconLocked]}>
        {item.icon}
      </View>
      <Text style={styles.achievementLabel}>{item.label}</Text>
    </View>
  );
}

function SettingsRow({
  item,
}: {
  item: (typeof settingsItems)[number];
}) {
  return (
    <Pressable style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}>
      <View style={styles.settingsIcon}>{item.icon}</View>
      <Text style={styles.settingsLabel}>{item.label}</Text>
      <Feather name="chevron-right" size={22} color={COLORS.outlineVariant} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  const gardens = useGardenSummaries();
  const plantsCount = gardens.reduce((total, garden) => total + garden.plantCount, 0);
  const userInitial = getUserInitial(currentUser.name);

  return (
    <View style={styles.screen}>
      <AppHeader title="Folium & Fern" mode="menu" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => handleNavbarScroll(event.nativeEvent.contentOffset.y)}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Master Gardener</Text>
          </View>

          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userRole}>{currentUser.role}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard value={`${plantsCount}`} label="Plants" />
          <StatCard value={`${gardens.length}`} label="Gardens" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsRow}
          >
            {achievements.map((achievement) => (
              <AchievementItem key={achievement.label} item={achievement} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.settingsCard}>
          {settingsItems.map((item) => (
            <SettingsRow key={item.label} item={item} />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
          <Feather name="log-out" size={18} color={COLORS.outline} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </ScrollView>

      <AppNavbar hidden={navbarHidden} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 132,
    gap: 28,
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: 10,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#111713',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  avatarInitial: {
    color: '#f7fbf5',
    fontSize: 40,
    fontWeight: '900',
  },
  badge: {
    marginTop: -12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#17361d',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  userName: {
    marginTop: 18,
    color: COLORS.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  userRole: {
    marginTop: 6,
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 12,
    backgroundColor: '#e6f3df',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 5,
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  achievementsRow: {
    gap: 18,
    paddingVertical: 2,
  },
  achievementItem: {
    width: 70,
    alignItems: 'center',
    gap: 10,
  },
  achievementLocked: {
    opacity: 0.45,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  achievementIconLocked: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
  },
  achievementLabel: {
    color: COLORS.primary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsCard: {
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLow,
    padding: 8,
    gap: 4,
  },
  settingsRow: {
    minHeight: 60,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
  },
  settingsIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17361d',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  settingsLabel: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  logoutButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoutText: {
    color: COLORS.outline,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
});
