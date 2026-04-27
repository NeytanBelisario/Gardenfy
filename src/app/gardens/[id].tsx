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
} from '@expo/vector-icons';

import {
  GardenDetails,
  GardenMetric,
} from '../../features/gardens/types';
import { AppHeader } from '../../components/shell/AppHeader';
import { GardenIdentityIcon } from '../../features/gardens/icons';
import { useGardenDetails } from '../../features/gardens/store';

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

function statusColors(tone: GardenDetails['plants'][number]['status']['tone']) {
  if (tone === 'dry') {
    return {
      backgroundColor: COLORS.dangerBg,
      color: COLORS.dangerText,
    };
  }

  if (tone === 'vital') {
    return {
      backgroundColor: COLORS.vitalBg,
      color: COLORS.vitalText,
    };
  }

  return {
    backgroundColor: COLORS.stableBg,
    color: COLORS.stableText,
  };
}

function recommendedScanDays(vitality?: number) {
  if (typeof vitality !== 'number') {
    return null;
  }

  if (vitality <= 30) {
    return 1;
  }

  if (vitality <= 70) {
    return 2;
  }

  return 3;
}

function formatLastScan(value?: string) {
  if (!value) {
    return 'Sem scan';
  }

  const scanDate = new Date(value);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return 'Hoje';
  }

  if (diffDays === 1) {
    return '1 dia';
  }

  return `${diffDays} dias`;
}

function PlantCard({
  plant,
  onAnalyze,
}: {
  plant: GardenDetails['plants'][number];
  onAnalyze: () => void;
}) {
  const lightMetric = plant.metrics.find((metric) => metric.kind === 'light');
  const waterMetric = plant.metrics.find((metric) => metric.kind === 'water');
  const badge = statusColors(plant.status.tone);
  const nextScanDays = recommendedScanDays(plant.vitality);

  return (
    <View style={styles.plantCard}>
      <View style={styles.plantImageWrap}>
        <Image source={{ uri: plant.imageUrl }} style={styles.plantImage} />
        <View style={styles.scanBadgesColumn}>
          <View style={styles.scanBadge}>
            <Feather name="clock" size={11} color={COLORS.secondary} />
            <Text style={styles.scanBadgeText}>{formatLastScan(plant.lastAnalyzedAt)}</Text>
          </View>

          <View style={styles.scanBadge}>
            <MaterialCommunityIcons name="radar" size={12} color={COLORS.secondary} />
            <Text style={styles.scanBadgeText}>
              {nextScanDays ? `${nextScanDays}d` : 'Scan'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.plantBody}>
        <View style={styles.plantHeader}>
          <View style={styles.plantTitleWrap}>
            <Text style={styles.plantName}>{plant.name}</Text>
            <Text style={styles.plantSubtitle}>{plant.subtitle}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Analisar ${plant.name} com camera`}
            style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}
            onPress={onAnalyze}
          >
            <Ionicons name="camera" size={16} color={badge.color} />
          </Pressable>
        </View>

        <View style={styles.plantMetricsRow}>
          <View style={styles.inlineMetric}>
            <View style={styles.inlineMetricIcon}>
              <Ionicons name="pulse-outline" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.inlineMetricText}>{plant.vitality ?? 0}%</Text>
          </View>

          <View style={styles.inlineMetric}>
            <View style={styles.inlineMetricIcon}>
              <GardenMetricIcon metric={{ kind: 'light', label: 'Light', value: 0 }} />
            </View>
            <Text style={styles.inlineMetricText}>{lightMetric?.value ?? 0}%</Text>
          </View>

          <View style={styles.inlineMetric}>
            <View style={styles.inlineMetricIcon}>
              <GardenMetricIcon metric={{ kind: 'water', label: 'Water', value: 0 }} />
            </View>
            <Text style={styles.inlineMetricText}>{waterMetric?.value ?? 0}%</Text>
          </View>

          <View style={styles.inlineMetric}>
            <View style={styles.inlineMetricIcon}>
              <MaterialCommunityIcons name="sprout" size={14} color={COLORS.secondary} />
            </View>
            <Text style={styles.inlineMetricText}>
              {plant.growthDays ? `${plant.growthDays}d` : '--'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function GardenDetailsView({
  garden,
  onAddPlant,
  onAnalyzePlant,
}: {
  garden: GardenDetails;
  onAddPlant: () => void;
  onAnalyzePlant: (plantId: string) => void;
}) {
  return (
    <>
      <View style={styles.heroSection}>
        <View style={styles.heroCard}>
          <View style={styles.heroIdentity}>
            <View style={styles.heroIdentityBadge}>
              <GardenIdentityIcon icon={garden.icon} size={74} color={COLORS.white} />
            </View>
          </View>
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
        <Pressable
          style={styles.inlineAddPlantButton}
          onPress={onAddPlant}
        >
          <Ionicons name="add" size={16} color={COLORS.white} />
          <Text style={styles.inlineAddPlantText}>Adicionar Planta</Text>
        </Pressable>
      </View>

      {garden.plants.length > 0 ? (
        <View style={styles.plantList}>
          {garden.plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onAnalyze={() => onAnalyzePlant(plant.id)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCollectionCard}>
          <View style={styles.emptyCollectionIconWrap}>
            <MaterialCommunityIcons name="sprout" size={28} color={COLORS.secondary} />
          </View>
          <Text style={styles.emptyCollectionTitle}>Nenhuma planta adicionada ainda</Text>
          <Text style={styles.emptyCollectionText}>
            Comece adicionando a primeira especie deste jardim via catalogo ou
            escaneando uma planta.
          </Text>
        </View>
      )}
    </>
  );
}

export default function GardenDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const garden = useGardenDetails(id);

  return (
    <View style={styles.screen}>
      <AppHeader mode="back" onPressLeading={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {garden ? (
          <GardenDetailsView
            garden={garden}
            onAddPlant={() =>
              router.push({
                pathname: '/gardens/[id]/plants/add',
                params: { id: garden.id },
              })
            }
            onAnalyzePlant={(plantId) =>
              router.push({
                pathname: '/gardens/[id]/plants/[plantId]/scan',
                params: { id: garden.id, plantId },
              })
            }
          />
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 112,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  heroCard: {
    height: 260,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#315338',
    shadowColor: '#17361d',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroIdentity: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 54, 29, 0.18)',
  },
  heroIdentityBadge: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 22,
    marginBottom: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  collectionTitle: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -1,
    flex: 1,
  },
  inlineAddPlantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  inlineAddPlantText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  plantList: {
    paddingHorizontal: 24,
    gap: 14,
  },
  plantCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: 'rgba(194, 200, 191, 0.45)',
  },
  plantImageWrap: {
    width: 78,
    gap: 7,
  },
  plantImage: {
    width: '100%',
    height: 78,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHigh,
  },
  plantBody: {
    flex: 1,
    justifyContent: 'center',
    gap: 9,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  plantTitleWrap: {
    flex: 1,
    gap: 3,
  },
  plantName: {
    color: COLORS.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  plantSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  plantMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  inlineMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineMetricIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMetricText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  scanBadgesColumn: {
    gap: 5,
  },
  scanBadge: {
    minHeight: 22,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1,
    borderColor: 'rgba(194, 200, 191, 0.45)',
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scanBadgeText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyCollectionCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLow,
    padding: 24,
    alignItems: 'center',
  },
  emptyCollectionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(71, 102, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyCollectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCollectionText: {
    marginTop: 8,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
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
