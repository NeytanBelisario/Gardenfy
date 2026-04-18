import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { mockGardens } from '../features/gardens/mocks';
import { GardenMetric, GardenSummary } from '../features/gardens/types';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  surface: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  surfaceVariant: '#e4e2de',
  textMuted: '#424841',
  tertiaryDark: '#6a3200',
  alertBg: '#ffdad6',
  alertText: '#93000a',
  white: '#ffffff',
} as const;

const navItems = [
  { label: 'Journal', icon: 'book-outline', active: true },
  { label: 'Growth', icon: 'leaf-outline' },
  { label: 'Library', icon: 'library-outline' },
  { label: 'Expert', icon: 'sparkles-outline' },
];

function MenuButton() {
  return (
    <Pressable style={styles.menuButton}>
      <View style={styles.menuLine} />
      <View style={styles.menuLine} />
      <View style={styles.menuLineShort} />
    </Pressable>
  );
}

function ProgressBar({
  value,
  color,
  trackColor,
}: {
  value: number;
  color: string;
  trackColor: string;
}) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function MetricCard({ metric }: { metric: GardenMetric }) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricIconWrap}>
        {metric.kind === 'light' ? (
          <Feather name="sun" size={18} color={COLORS.primary} />
        ) : (
          <Ionicons name="water-outline" size={18} color={COLORS.secondary} />
        )}
      </View>
      <View>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={styles.metricValue}>{metric.value}%</Text>
      </View>
    </View>
  );
}

function GardenCard({ garden }: { garden: GardenSummary }) {
  const badgeColors =
    garden.alert?.tone === 'warning'
      ? { backgroundColor: '#ffb783', color: '#4f2500' }
      : { backgroundColor: COLORS.alertBg, color: COLORS.alertText };

  return (
    <View style={styles.lightCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.thumbImageWrap}>
          <Image source={{ uri: garden.imageUrl }} style={styles.thumbImage} />
        </View>

        <View style={styles.lightCardContent}>
          <View style={styles.lightCardHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.cardTitle}>{garden.name}</Text>
              <Text style={styles.cardPlants}>
                {garden.plantCount} plant{garden.plantCount === 1 ? '' : 's'}
              </Text>
            </View>

            {garden.alert ? (
              <View
                style={[styles.badge, { backgroundColor: badgeColors.backgroundColor }]}
              >
                <Text style={[styles.badgeText, { color: badgeColors.color }]}>
                  {garden.alert.label}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.vitalitySection}>
        <View style={styles.vitalityHeader}>
          <Text style={styles.vitalityLabel}>Vitality</Text>
          <Text style={styles.vitalityValue}>{garden.vitality}%</Text>
        </View>
        <ProgressBar
          value={garden.vitality}
          color={COLORS.primary}
          trackColor={COLORS.surfaceVariant}
        />
      </View>

      <View style={styles.metricsRow}>
        {garden.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </View>
    </View>
  );
}

function BottomNav() {
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <Pressable key={item.label} style={styles.navItem}>
          <View style={[styles.navIconWrap, item.active && styles.navIconWrapActive]}>
            <Ionicons
              name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={22}
              color={item.active ? COLORS.white : '#98a694'}
            />
          </View>
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <MenuButton />
          <Text style={styles.brand}>The Curator</Text>
        </View>

        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0neqxOAI_M_CBibB23sz_usMUgzGtz_1tbvJFY6JqqenWa7rt83LRyYvXsKC3efNqgRmjrFQ2ZkhWR02OBrxmrUvBu0GT_Kcnhe_1-ehrIfo3p1kI79gRKhuX6AbHPPTF15r04KKv_TE6P8RqGN7J-sFikWddXpv6NZDy-jrcQVMKFm-yLzPvfZlxfUhv3jPNJKqHxLKIrCBxc11U-7G86497fFavMRh7bNOKy3sKD8HzGiC8B-Mo3BnV1ZegWSY4lL-3r26i3-0',
          }}
          style={styles.avatar}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCopy}>
          <Text style={styles.heading}>Meus Jardins</Text>
          <Text style={styles.subheading}>
            Curadoria botanica de seus espacos vivos. Gerencie a vitalidade e
            nutricao de cada ambiente.
          </Text>
        </View>

        {mockGardens.map((garden) => (
          <GardenCard key={garden.id} garden={garden} />
        ))}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/gardens/new')}>
        <Ionicons name="add" size={34} color={COLORS.white} />
      </Pressable>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  menuButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: {
    width: 24,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  menuLineShort: {
    width: 18,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  brand: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: COLORS.surfaceHigh,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 148,
    gap: 18,
  },
  heroCopy: {
    gap: 10,
    marginBottom: 10,
  },
  heading: {
    color: COLORS.primary,
    fontSize: 54,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  subheading: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 28,
    maxWidth: '84%',
  },
  lightCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    padding: 20,
    gap: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  thumbImageWrap: {
    width: 106,
    height: 106,
    borderRadius: 24,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: COLORS.surfaceHigh,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  lightCardContent: {
    flex: 1,
    minWidth: 0,
  },
  lightCardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardTitle: {
    color: COLORS.primary,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  cardPlants: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  vitalitySection: {
    gap: 10,
  },
  vitalityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  vitalityLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  vitalityValue: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHigh,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 116,
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: COLORS.tertiaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#301400',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: 'rgba(251, 249, 245, 0.96)',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  navItem: {
    alignItems: 'center',
    gap: 8,
  },
  navIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: {
    backgroundColor: COLORS.primary,
  },
  navLabel: {
    color: '#98a694',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
});
