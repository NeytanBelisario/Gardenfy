import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';
import { GardenIdentityIcon } from '../features/gardens/icons';
import type { GardenDetails } from '../features/gardens/types';
import { useGardensState } from '../features/gardens/store';
import { TodaySection } from '../features/gardens/TodaySection';
import { StreakDialog } from '../features/gardens/StreakDialog';
import { describeStreak, getStreak } from '../features/gardens/streak';
import { useNavbarVisibilityOnScroll } from '../hooks/useNavbarVisibilityOnScroll';

function GardenCard({ garden }: { garden: GardenDetails }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={'Abrir ' + garden.name + ', ' + garden.plantCount + (garden.plantCount === 1 ? ' planta' : ' plantas')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: '/gardens/[id]', params: { id: garden.id } })}>
      <View style={styles.cardHeader}>
        <View style={styles.gardenIcon}><GardenIdentityIcon icon={garden.icon} size={30} color="#17361d" /></View>
        <View style={styles.cardCopy}>
          <Text style={styles.gardenName}>{garden.name}</Text>
          <Text style={styles.secondary}>{garden.label} · {garden.plantCount} {garden.plantCount === 1 ? 'planta' : 'plantas'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#476644" />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { gardens } = useGardensState();
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  const [streakOpen, setStreakOpen] = useState(false);
  const streak = getStreak(gardens);
  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={event => handleNavbarScroll(event.nativeEvent.contentOffset.y)} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>UM POUCO DE VERDE, TODOS OS DIAS</Text>
          <Text style={styles.heroTitle}>Seu espaço para cultivar.</Text>
          <Text style={styles.heroText}>Reúna suas plantas e acompanhe cada cuidado, no seu ritmo.</Text>
          {streak.trackedPlants ? (
            <Pressable accessibilityRole="button" accessibilityLabel={(streak.current ? 'Sequência: ' + describeStreak(streak.current) : 'Sequência zerada') + '. Ver detalhes'} onPress={() => setStreakOpen(true)} style={({ pressed }) => [styles.streak, pressed && styles.pressed]}>
              <Ionicons name="flame" size={18} color={streak.current ? '#ffb547' : '#b8ceaf'} />
              <Text style={styles.streakText}>{streak.current ? describeStreak(streak.current) : 'Recomece sua sequência hoje'}</Text>
              <Ionicons name="chevron-forward" size={16} color="#c4d9b9" />
            </Pressable>
          ) : null}
        </View>
        <TodaySection gardens={gardens} />
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Meus jardins</Text>
          {gardens.length ? <Pressable accessibilityRole="button" accessibilityLabel="Criar jardim" onPress={() => router.push('/gardens/new')} style={styles.newButton}>
            <Ionicons name="add" size={20} color="#17361d" /><Text style={styles.newButtonText}>Novo jardim</Text>
          </Pressable> : null}
        </View>
        {gardens.length ? gardens.map(garden => <GardenCard key={garden.id} garden={garden} />) : (
          <View style={styles.empty}>
            <Image source={require('../public/nogardenicon.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>Tudo começa com um jardim</Text>
            <Text style={styles.emptyText}>Escolha um nome, adicione plantas pelo catálogo e registre regas e adubações.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Criar meu primeiro jardim" onPress={() => router.push('/gardens/new')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Ionicons name="add" size={22} color="#ffffff" /><Text style={styles.primaryButtonText}>Criar meu primeiro jardim</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <AppNavbar hidden={navbarHidden} />
      {streakOpen ? <StreakDialog streak={streak} onClose={() => setStreakOpen(false)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140, gap: 16 },
  hero: { backgroundColor: '#17361d', borderRadius: 28, padding: 26, gap: 12 },
  eyebrow: { color: '#c4d9b9', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { color: '#ffffff', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  heroText: { color: '#d6e2d0', fontSize: 15, lineHeight: 23, maxWidth: 420 },
  streak: { alignSelf: 'flex-start', marginTop: 6, minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  streakText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#17361d' },
  newButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 14, backgroundColor: '#e9efe4' },
  newButtonText: { color: '#17361d', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, gap: 16, borderWidth: 1, borderColor: '#e7e9e0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gardenIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#eef2e8', alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, minWidth: 0, gap: 5 },
  gardenName: { color: '#17361d', fontSize: 20, lineHeight: 26, fontWeight: '800' },
  secondary: { color: '#586653', fontSize: 13, lineHeight: 20 },
  empty: { borderRadius: 24, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7e9e0', padding: 24, alignItems: 'center', gap: 14 },
  emptyImage: { width: 180, height: 120 },
  emptyTitle: { color: '#17361d', fontSize: 23, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: '#586653', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340 },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: '#17361d', paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', maxWidth: 350 },
  primaryButtonText: { flexShrink: 1, color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
