import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import { getMockGardenById } from '../../features/gardens/mocks';
import {
  GardenDetails,
  GardenMetric,
  GardenPlant,
  PlantHealthTone,
} from '../../features/gardens/types';
import { AppHeader } from '../../components/shell/AppHeader';

const COLORS = {
  background: '#fbf9f5',
  primary: '#17361d',
  secondary: '#476644',
  tertiarySoft: '#ffb783',
  surfaceLow: '#f5f3ef',
  surfaceLowest: '#ffffff',
  surfaceHigh: '#eae8e4',
  surfaceVariant: '#e4e2de',
  outline: '#c2c8bf',
  textMuted: '#424841',
  white: '#ffffff',
  dangerBg: '#ffdad6',
  dangerText: '#93000a',
  stableBg: '#c8ecc1',
  stableText: '#304e2e',
  vitalBg: '#add0a6',
  vitalText: '#304e2e',
} as const;

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

function GardenMetricIcon({
  metric,
  colorOverride,
}: {
  metric: GardenMetric;
  colorOverride?: string;
}) {
  if (metric.kind === 'light') {
    return <Feather name="sun" size={14} color={colorOverride ?? COLORS.primary} />;
  }

  return (
    <Ionicons
      name="water-outline"
      size={14}
      color={colorOverride ?? COLORS.secondary}
    />
  );
}

function HealthPill({ tone, label }: { tone: PlantHealthTone; label: string }) {
  const toneStyles =
    tone === 'dry'
      ? { backgroundColor: COLORS.dangerBg, color: COLORS.dangerText }
      : tone === 'stable'
        ? { backgroundColor: COLORS.stableBg, color: COLORS.stableText }
        : { backgroundColor: COLORS.vitalBg, color: COLORS.vitalText };

  return (
    <View style={[styles.statusPill, { backgroundColor: toneStyles.backgroundColor }]}>
      <Text style={[styles.statusPillText, { color: toneStyles.color }]}>{label}</Text>
    </View>
  );
}

function PlantCard({ plant }: { plant: GardenPlant }) {
  return (
    <View style={styles.plantCard}>
      <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />

      <View style={styles.plantBody}>
        <View style={styles.plantHeader}>
          <View style={styles.plantHeaderCopy}>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantSubtitle}>{plant.subtitle}</Text>
          </View>

          <HealthPill tone={plant.status.tone} label={plant.status.label} />
        </View>

        <View style={styles.plantMetricsRow}>
          {plant.metrics.map((metric) => {
            const isDryWater = metric.kind === 'water' && plant.status.tone === 'dry';

            return (
              <View key={metric.label} style={styles.plantMetric}>
                <View style={styles.plantMetricIconWrap}>
                  <GardenMetricIcon
                    metric={metric}
                    colorOverride={isDryWater ? COLORS.dangerText : undefined}
                  />
                </View>
                <Text
                  style={[
                    styles.plantMetricValue,
                    isDryWater && styles.plantMetricValueDanger,
                  ]}
                >
                  {metric.value}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StatsCard({
  icon,
  value,
  label,
  iconColor,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  iconColor: string;
}) {
  return (
    <View style={styles.statsCard}>
      <View style={[styles.statsIconWrap, { backgroundColor: `${iconColor}12` }]}>{icon}</View>
      <View>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Jardim nao encontrado</Text>
      <Text style={styles.emptyText}>
        Esse mock ainda nao existe. Volte para a home e escolha um jardim valido.
      </Text>
    </View>
  );
}

function GardenDetailsView({ garden }: { garden: GardenDetails }) {
  return (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <Image source={{ uri: garden.imageUrl }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{garden.label}</Text>
            <Text style={styles.heroTitle}>{garden.name}</Text>
          </View>
        </View>
      </View>

      <View style={styles.vitalityCard}>
        <View style={styles.vitalityHeader}>
          <Text style={styles.vitalityLabel}>Garden Vitality</Text>
          <Text style={styles.vitalityValue}>{garden.vitality}%</Text>
        </View>
        <ProgressBar
          value={garden.vitality}
          color={COLORS.primary}
          trackColor={COLORS.surfaceVariant}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatsCard
          icon={<MaterialCommunityIcons name="sprout" size={24} color={COLORS.secondary} />}
          value={`${garden.plantCount}`}
          label="Active Plants"
          iconColor={COLORS.secondary}
        />
        <StatsCard
          icon={<Ionicons name="water-outline" size={24} color={COLORS.tertiarySoft} />}
          value={`${garden.averageHydration}%`}
          label="Avg. Hydration"
          iconColor={COLORS.tertiarySoft}
        />
      </View>

      <View style={styles.collectionHeader}>
        <Text style={styles.collectionTitle}>Current Collection</Text>
        <Text style={styles.collectionSort}>Vitality Sort</Text>
      </View>

      <View style={styles.plantsList}>
        {garden.plants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </View>
    </>
  );
}

export default function GardenDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = id ? getMockGardenById(id) : undefined;

  return (
    <View style={styles.screen}>
      <AppHeader mode="back" onPressLeading={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {garden ? <GardenDetailsView garden={garden} /> : <EmptyState />}
      </ScrollView>

      {garden ? (
        <Pressable style={styles.addPlantButton}>
          <Ionicons name="add" size={24} color={COLORS.white} />
          <Text style={styles.addPlantText}>Adicionar Planta</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 86,
    paddingBottom: 112,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  heroCard: {
    height: 260,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#17361d',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(23, 54, 29, 0.34)',
  },
  heroCopy: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    gap: 6,
  },
  heroEyebrow: {
    color: '#add0ac',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  vitalityCard: {
    marginTop: 22,
    marginHorizontal: 24,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 24,
    padding: 18,
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
    letterSpacing: 1.4,
  },
  vitalityValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 24,
    marginTop: 14,
  },
  statsCard: {
    flex: 1,
    minHeight: 112,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
  },
  statsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  statsLabel: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  collectionHeader: {
    marginTop: 30,
    marginBottom: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  collectionSort: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  plantsList: {
    paddingHorizontal: 24,
    gap: 14,
  },
  plantCard: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 28,
    padding: 14,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(194, 200, 191, 0.3)',
    shadowColor: '#17361d',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  plantImage: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
  plantBody: {
    flex: 1,
    gap: 10,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  plantHeaderCopy: {
    flex: 1,
  },
  plantName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  plantSubtitle: {
    marginTop: 3,
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  plantMetricsRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  plantMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plantMetricIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantMetricValue: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  plantMetricValueDanger: {
    color: COLORS.dangerText,
  },
  addPlantButton: {
    position: 'absolute',
    right: 24,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#17361d',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  addPlantText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyState: {
    marginHorizontal: 24,
    marginTop: 40,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 24,
    padding: 24,
    gap: 10,
  },
  emptyTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
