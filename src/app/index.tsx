import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';
import { useGardenSummaries } from '../features/gardens/store';
import { currentUser } from '../features/user/profile';

const C = {
  bg: '#f5f3ed',
  primary: '#17361d',
  secondary: '#476644',
  white: '#ffffff',
  surface: '#fbf9f5',
  surfaceLow: '#f0eeea',
  textMuted: '#6b7469',
  textSoft: '#8ea086',
  banner: '#1c3422',
  bannerDark: '#152819',
  taskActive: '#eaf3e8',
  taskActiveBorder: '#c6dfc2',
  dot: '#4a9a50',
  achievBadgeBg: '#e4ede2',
  arBg: '#d6e8d2',
} as const;

const MONSTERA_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAW5RM8NQiyde1JOvFVLUhl5EOpwlZz1vGUsIcviqLknYVqO2qqvyCVdCwdoLQ11SxstqZ31uB9kw5S2FbiyI2i_n6Jtr6s_WDSxg0mB10bdQXTTCIgl92sbhJRfkd1ZWC2BT2KRo9vkABZJ4-NIDuuSK6HAKtaStyGYX0T2Dv9pvRPwBUWn1DPVr6X_ZfbsBepIyFuUKbjv7H8C5iWHxebTl6UaVHpVhdNbWn4WuarCeGNb7bbua7JfsINvnZYG_cB_gTlB865EBA';

const TODAY_TASKS = [
  { time: '08:00', icon: 'water-outline' as const, label: 'Regar', plant: 'Costela-de-adão', done: true, active: false },
  { time: '12:00', icon: 'flower-outline' as const, label: 'Adubar', plant: 'Jade', done: false, active: false },
  { time: '18:00', icon: 'leaf-outline' as const, label: 'Limpar folhas', plant: 'Samambaia', done: false, active: true },
  { time: '20:00', icon: 'cloud-outline' as const, label: 'Nebulizar', plant: 'Orquídea', done: false, active: false },
];

function metricLabel(value: number, kind: 'water' | 'light'): string {
  if (kind === 'water') {
    if (value >= 60) return 'Ideal';
    if (value >= 35) return 'Moderado';
    return 'Baixo';
  }
  if (value >= 60) return 'Perfeita';
  if (value >= 35) return 'Adequada';
  return 'Baixa';
}

function healthFromVitality(v: number): string {
  if (v >= 90) return 'Excelente';
  if (v >= 70) return 'Boa';
  if (v >= 50) return 'Regular';
  if (v >= 30) return 'Ruim';
  return 'Crítica';
}

function FloatingPlant() {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [translateY, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.Image
      source={{ uri: MONSTERA_URI }}
      style={[styles.plantImage, animStyle]}
      resizeMode="contain"
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const gardens = useGardenSummaries();
  const garden = gardens[0];

  const vitality = garden?.vitality ?? 98;
  const health = healthFromVitality(vitality);
  const waterMetric = garden?.metrics.find((m) => m.kind === 'water');
  const lightMetric = garden?.metrics.find((m) => m.kind === 'light');
  const waterLabel = waterMetric ? metricLabel(waterMetric.value, 'water') : 'Ideal';
  const lightLabel = lightMetric ? metricLabel(lightMetric.value, 'light') : 'Perfeita';
  const firstName = currentUser.name.split(' ')[0];

  const handleGardenPress = () => {
    if (garden) {
      router.push(`/gardens/${garden.id}` as never);
    } else {
      router.push('/gardens' as never);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* Greeting text (normal flow, left column) */}
          <View style={styles.heroTextArea}>
            <Text style={styles.heroGreeting}>Bom dia, {firstName}!</Text>
            <Text style={styles.heroTitle}>
              {'Seu jardim\nestá florescendo 🌿'}
            </Text>
            <Text style={styles.heroSub}>
              {'Acompanhe, cuide e veja suas\nplantas prosperarem.'}
            </Text>
          </View>

          {/* Weather card — absolute top-right */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherTop}>
              <Ionicons name="partly-sunny-outline" size={22} color="#e08c3a" />
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherEnv}>ESTUFA</Text>
                <Text style={styles.weatherTemp}>24°C</Text>
              </View>
            </View>
            <Text style={styles.weatherHumidity}>Umidade: 68%</Text>
          </View>

          {/* Plant pedestal circle */}
          <View style={styles.plantCircleWrap}>
            <View style={styles.plantCircle} />
          </View>

          {/* Animated plant */}
          <View style={styles.plantWrap}>
            <FloatingPlant />
          </View>

          {/* Vitality block — absolute bottom-left */}
          <View style={styles.vitalityBlock}>
            <Text style={styles.vitalityPct}>{vitality}%</Text>
            <Text style={styles.vitalityLabel}>Vitalidade</Text>
            <View style={styles.healthRow}>
              <View style={styles.healthDot} />
              <Text style={styles.healthText}>{health}</Text>
            </View>
          </View>

          {/* Metrics column — absolute right */}
          <View style={styles.metricsCol}>
            <View style={styles.metricChip}>
              <Ionicons name="water-outline" size={16} color={C.primary} />
              <View>
                <Text style={styles.metricKind}>Rega</Text>
                <Text style={styles.metricVal}>{waterLabel}</Text>
              </View>
            </View>
            <View style={styles.metricChip}>
              <Ionicons name="sunny-outline" size={16} color={C.primary} />
              <View>
                <Text style={styles.metricKind}>Luz</Text>
                <Text style={styles.metricVal}>{lightLabel}</Text>
              </View>
            </View>
            <View style={styles.metricChip}>
              <Ionicons name="leaf-outline" size={16} color={C.primary} />
              <View>
                <Text style={styles.metricKind}>Ar</Text>
                <Text style={styles.metricVal}>Ótimo</Text>
              </View>
            </View>
          </View>

          {/* CTA button */}
          <Pressable
            style={({ pressed }) => [styles.gardenBtn, pressed && { opacity: 0.82 }]}
            onPress={handleGardenPress}
          >
            <Text style={styles.gardenBtnText}>JARDIM PRINCIPAL</Text>
            <Ionicons name="arrow-forward" size={14} color={C.white} />
          </Pressable>
        </View>

        {/* ── Visão Inteligente banner ── */}
        <Pressable style={styles.visionBanner}>
          <View style={styles.visionLeft}>
            <View style={styles.visionTitleRow}>
              <Ionicons name="sparkles" size={14} color="#a8f0b0" />
              <Text style={styles.visionTitle}>Visão Inteligente</Text>
            </View>
            <Text style={styles.visionBody}>
              {'Detectamos 1 folha com sinais\nde desidratação.'}
            </Text>
            <View style={styles.visionBtn}>
              <Text style={styles.visionBtnText}>Ver análise</Text>
            </View>
          </View>

          {/* Scan frame visualization */}
          <View style={styles.visionRight}>
            <Image
              source={{ uri: MONSTERA_URI }}
              style={styles.visionBgPlant}
              resizeMode="cover"
            />
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.scanTL]} />
              <View style={[styles.scanCorner, styles.scanTR]} />
              <View style={[styles.scanCorner, styles.scanBL]} />
              <View style={[styles.scanCorner, styles.scanBR]} />
              <View style={styles.scanRing} />
            </View>
          </View>

          {/* Carousel dots */}
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </Pressable>

        {/* ── Hoje no seu jardim ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Ionicons name="calendar-outline" size={15} color={C.primary} />
            <Text style={styles.sectionTitle}>Hoje no seu jardim</Text>
          </View>
          <Pressable>
            <Text style={styles.seeAll}>Ver agenda →</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tasksRow}
          style={styles.tasksScroll}
        >
          {TODAY_TASKS.map((task, i) => (
            <View
              key={i}
              style={[styles.taskCard, task.active && styles.taskCardActive]}
            >
              <Text style={[styles.taskTime, task.active && styles.taskTimeActive]}>
                {task.time}
              </Text>
              <Ionicons
                name={task.icon}
                size={26}
                color={task.active ? '#2d6a2f' : C.primary}
                style={styles.taskIcon}
              />
              <Text style={[styles.taskLabel, task.active && styles.taskLabelActive]}>
                {task.label}
              </Text>
              <Text style={styles.taskPlant}>{task.plant}</Text>
              <View style={[styles.taskCheck, task.done && styles.taskCheckDone]}>
                {task.done && <Ionicons name="checkmark" size={13} color={C.white} />}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Progress + Conquistas ── */}
        <View style={styles.statsRow}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="trending-up-outline" size={14} color={C.primary} />
              <Text style={styles.progressTitle}>Progresso da semana</Text>
            </View>
            <Text style={styles.progressValue}>+15%</Text>
            <Text style={styles.progressSub}>de vitalidade geral</Text>
            {/* Squiggle line decoration */}
            <View style={styles.squiggle}>
              <View style={styles.squiggleLine} />
            </View>
          </View>

          <View style={styles.achievCard}>
            <Text style={styles.achievHeader}>Conquistas</Text>
            <View style={styles.achievRow}>
              <View style={styles.achievBadge}>
                <Ionicons name="leaf-outline" size={22} color={C.secondary} />
              </View>
              <View style={styles.achievInfo}>
                <Text style={styles.achievName}>{'Jardineiro\nDedicado'}</Text>
                <Text style={styles.achievSub}>3/10 conquistas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── AR Banner ── */}
        <Pressable
          style={({ pressed }) => [styles.arBanner, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/preview' as never)}
        >
          <View style={styles.arLeft}>
            <Text style={styles.arTitle}>{'Explore novas plantas\nno seu espaço'}</Text>
            <Text style={styles.arSub}>{'Use o AR para visualizar\nantes de adicionar'}</Text>
          </View>
          <View style={styles.arCenter}>
            <View style={styles.arScanBtn}>
              <Ionicons name="scan" size={26} color={C.white} />
            </View>
            <Text style={styles.arLabel}>AR</Text>
          </View>
          <Image
            source={{ uri: MONSTERA_URI }}
            style={styles.arPlantImg}
            resizeMode="cover"
          />
        </Pressable>

        <View style={styles.bottomPad} />
      </ScrollView>

      <AppNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* Hero */
  hero: {
    height: 400,
    marginBottom: 16,
    position: 'relative',
  },
  heroTextArea: {
    paddingTop: 4,
    width: '60%',
    zIndex: 2,
  },
  heroGreeting: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: {
    color: C.primary,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },

  /* Weather card */
  weatherCard: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 12,
    minWidth: 122,
    shadowColor: C.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 3,
  },
  weatherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weatherInfo: {
    gap: 1,
  },
  weatherEnv: {
    color: C.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  weatherTemp: {
    color: C.primary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  weatherHumidity: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },

  /* Plant */
  plantCircleWrap: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
  },
  plantCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(220,230,218,0.38)',
  },
  plantWrap: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  plantImage: {
    width: 210,
    height: 270,
  },

  /* Vitality */
  vitalityBlock: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    zIndex: 2,
  },
  vitalityPct: {
    color: C.primary,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
    letterSpacing: -2,
  },
  vitalityLabel: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.dot,
  },
  healthText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Metrics */
  metricsCol: {
    position: 'absolute',
    right: 0,
    top: 130,
    gap: 8,
    zIndex: 2,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 110,
    shadowColor: C.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metricKind: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
  metricVal: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },

  /* Garden CTA */
  gardenBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  gardenBtnText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  /* Visão Inteligente */
  visionBanner: {
    backgroundColor: C.banner,
    borderRadius: 24,
    marginBottom: 20,
    minHeight: 148,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  visionLeft: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 10,
    zIndex: 2,
  },
  visionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visionTitle: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },
  visionBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  visionBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  visionBtnText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  visionRight: {
    width: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  visionBgPlant: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  scanFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: '#5ef07a',
    borderRadius: 2,
  },
  scanTL: { top: 20, left: 20, borderTopWidth: 2, borderLeftWidth: 2 },
  scanTR: { top: 20, right: 20, borderTopWidth: 2, borderRightWidth: 2 },
  scanBL: { bottom: 20, left: 20, borderBottomWidth: 2, borderLeftWidth: 2 },
  scanBR: { bottom: 20, right: 20, borderBottomWidth: 2, borderRightWidth: 2 },
  scanRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#5ef07a',
    opacity: 0.7,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: C.white,
    width: 16,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: C.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  seeAll: {
    color: C.secondary,
    fontSize: 12,
    fontWeight: '600',
  },

  /* Tasks */
  tasksScroll: {
    marginBottom: 20,
  },
  tasksRow: {
    paddingBottom: 4,
    paddingRight: 16,
    gap: 10,
  },
  taskCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 14,
    width: 108,
    alignItems: 'flex-start',
    gap: 4,
    shadowColor: C.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskCardActive: {
    backgroundColor: C.taskActive,
    borderWidth: 1.5,
    borderColor: C.taskActiveBorder,
  },
  taskTime: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  taskTimeActive: {
    color: '#2d6a2f',
  },
  taskIcon: {
    marginVertical: 4,
  },
  taskLabel: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  taskLabelActive: {
    color: '#2d6a2f',
  },
  taskPlant: {
    color: C.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  taskCheck: {
    marginTop: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckDone: {
    backgroundColor: C.dot,
    borderColor: C.dot,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  progressCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    shadowColor: C.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  progressTitle: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressValue: {
    color: C.primary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  progressSub: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  squiggle: {
    marginTop: 12,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  squiggleLine: {
    height: 2.5,
    backgroundColor: C.dot,
    borderRadius: 2,
    opacity: 0.5,
    width: '90%',
  },
  achievCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: C.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  achievHeader: {
    color: C.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  achievRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  achievBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.achievBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievInfo: {
    gap: 3,
  },
  achievName: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  achievSub: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },

  /* AR Banner */
  arBanner: {
    backgroundColor: C.arBg,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    height: 112,
    paddingLeft: 20,
  },
  arLeft: {
    flex: 1,
    gap: 5,
    paddingVertical: 18,
  },
  arTitle: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  arSub: {
    color: C.secondary,
    fontSize: 11,
    lineHeight: 15,
  },
  arCenter: {
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 16,
  },
  arScanBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arLabel: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  arPlantImg: {
    width: 110,
    height: 112,
  },

  bottomPad: {
    height: 20,
  },
});
