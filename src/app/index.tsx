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

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';
import { GardenMetric, GardenSummary } from '../features/gardens/types';
import { useGardenSummaries } from '../features/gardens/store';
import { useNavbarVisibilityOnScroll } from '../hooks/useNavbarVisibilityOnScroll';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  surface: '#f5f3ef',
  surfaceHigh: '#eae8e4',
  surfaceVariant: '#e4e2de',
  textMuted: '#424841',
  textSoft: '#8ea086',
  tertiaryDark: '#6a3200',
  alertBg: '#ffdad6',
  alertText: '#93000a',
  white: '#ffffff',
} as const;

const EMPTY_GARDENS_ART = require('../public/nogardenicon.png');

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
  const router = useRouter();
  const badgeColors =
    garden.alert?.tone === 'warning'
      ? { backgroundColor: '#ffb783', color: '#4f2500' }
      : { backgroundColor: COLORS.alertBg, color: COLORS.alertText };

  return (
    <Pressable
      style={styles.lightCard}
      onPress={() =>
        router.push({
          pathname: '/gardens/[id]',
          params: { id: garden.id },
        })
      }
    >
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
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  const gardens = useGardenSummaries();
  const hasGardens = gardens.length > 0;

  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => handleNavbarScroll(event.nativeEvent.contentOffset.y)}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCopy}>
          <Text style={styles.heading}>Meus Jardins</Text>
        </View>

        {hasGardens ? (
          gardens.map((garden) => <GardenCard key={garden.id} garden={garden} />)
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIllustrationWrap}>
              <Image
                source={EMPTY_GARDENS_ART}
                style={styles.emptyStateIllustration}
                resizeMode="contain"
              />
            </View>

            <View style={styles.emptyStateCopy}>
              <Text style={styles.emptyStateTitle}>Ainda não há jardins cadastrados</Text>
              <Text style={styles.emptyStateText}>
                Crie seu primeiro jardim e comece a cuidar dos seus espacos vivos.
              </Text>
            </View>

            <Pressable
              style={styles.emptyStateButton}
              onPress={() => router.push('/gardens/new')}
            >
              <Ionicons name="add" size={26} color={COLORS.white} />
              <Text style={styles.emptyStateButtonText}>Criar meu jardim</Text>
            </Pressable>

            <View style={styles.emptyStateSecondaryButton}>
              <Ionicons name="leaf-outline" size={18} color={COLORS.textSoft} />
              <Text style={styles.emptyStateSecondaryText}>Saiba como funciona</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {hasGardens ? (
        <Pressable style={styles.fab} onPress={() => router.push('/gardens/new')}>
          <Ionicons name="add" size={34} color={COLORS.white} />
        </Pressable>
      ) : null}

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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 12,
  },
  heroCopy: {
    width: '100%',
    marginTop: 2,
    marginBottom: 6,
  },
  heading: {
    color: COLORS.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
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
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    minHeight: 500,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#17361d',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  emptyStateIllustrationWrap: {
    width: '100%',
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  emptyStateIllustration: {
    width: '100%',
    maxWidth: 230,
    height: 138,
  },
  emptyStateCopy: {
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    color: COLORS.primary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
    maxWidth: 190,
  },
  emptyStateText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 210,
  },
  emptyStateButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'center',
    marginTop: 14,
    shadowColor: '#17361d',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  emptyStateButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyStateSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 0,
  },
  emptyStateSecondaryText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f7a43',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#301400',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
