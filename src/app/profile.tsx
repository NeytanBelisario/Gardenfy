import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppHeader } from '../components/shell/AppHeader';
import { AppNavbar } from '../components/shell/AppNavbar';
import { useGardenSummaries } from '../features/gardens/store';
import { useNavbarVisibilityOnScroll } from '../hooks/useNavbarVisibilityOnScroll';
import { RemindersCard } from '../features/reminders/RemindersCard';
import { colors } from '../theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const gardens = useGardenSummaries();
  const plantsCount = gardens.reduce((total, garden) => total + garden.plantCount, 0);
  const { navbarHidden, handleNavbarScroll } = useNavbarVisibilityOnScroll();
  return (
    <View style={styles.screen}>
      <AppHeader mode="menu" />
      <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={event => handleNavbarScroll(event.nativeEvent.contentOffset.y)} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.icon}><Ionicons name="leaf-outline" size={36} color={colors.ink} /></View>
          <Text accessibilityRole="header" style={styles.title}>Seu espaço verde</Text>
          <Text style={styles.subtitle}>Cada planta, um novo começo. Cada cuidado, uma pequena conquista.</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.value}>{gardens.length}</Text><Text style={styles.label}>{gardens.length === 1 ? 'Jardim' : 'Jardins'}</Text></View>
          <View style={styles.stat}><Text style={styles.value}>{plantsCount}</Text><Text style={styles.label}>{plantsCount === 1 ? 'Planta' : 'Plantas'}</Text></View>
        </View>
        <RemindersCard />
        <View style={styles.card}>
          <Ionicons name="phone-portrait-outline" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Seu jardim acompanha você</Text>
          <Text style={styles.text}>Jardins, plantas e cuidados ficam salvos neste aparelho. Não há conta ou sincronização entre dispositivos por enquanto.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Ionicons name="leaf-outline" size={22} color={colors.ink} /><Text style={styles.actionText}>Ver meus jardins</Text><Ionicons name="arrow-forward" size={20} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/gardens/new')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Ionicons name="add-circle-outline" size={22} color={colors.ink} /><Text style={styles.actionText}>Criar um jardim</Text><Ionicons name="arrow-forward" size={20} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/privacy')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.ink} /><Text style={styles.actionText}>Seus dados e privacidade</Text><Ionicons name="arrow-forward" size={20} color={colors.ink} />
        </Pressable>
      </ScrollView>
      <AppNavbar hidden={navbarHidden} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 140, gap: 16 },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 14 },
  icon: { width: 80, height: 80, borderRadius: 26, backgroundColor: '#e6eddc', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.text, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 22, padding: 22, gap: 5 },
  value: { color: colors.ink, fontSize: 32, fontWeight: '800' },
  label: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 22, gap: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '700' },
  text: { color: colors.text, fontSize: 14, lineHeight: 23 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderRadius: 18, padding: 18, backgroundColor: '#e9efe4' },
  actionText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
