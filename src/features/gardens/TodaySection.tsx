import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PlantPhoto } from '../../components/PlantPhoto';
import { plantPhotos } from './photoStorage';
import { getTodayOverview, type TodayPlant } from './today';
import { describeWaterStatus } from './watering';
import { WaterNowButton } from './WaterNowButton';
import type { GardenDetails } from './types';
import { remindersSupported } from '../reminders/scheduler';
import { useReminderSettings, useReminderSettingsLoaded } from '../reminders/settings';

const COLLAPSED_COUNT = 4;

function todayLabel(now: Date) {
  const text = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function nextLabel(next: TodayPlant) {
  const days = next.status.daysUntil ?? 0;
  return 'Próxima rega: ' + next.plant.name + (days === 1 ? ', amanhã' : ', em ' + days + ' dias');
}

export function TodaySection({ gardens }: { gardens: GardenDetails[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const reminders = useReminderSettings();
  const remindersLoaded = useReminderSettingsLoaded();
  const now = new Date();
  if (!gardens.some((garden) => garden.plantCount > 0)) return null;
  const { due, tracked, next } = getTodayOverview(gardens, now);
  const visible = expanded ? due : due.slice(0, COLLAPSED_COUNT);
  const open = (gardenId: string, plantId: string) => router.push({ pathname: '/gardens/[id]/plants/[plantId]', params: { id: gardenId, plantId } });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, !due.length && styles.headerIconCalm]}>
          <Ionicons name={due.length ? 'water' : 'leaf'} size={22} color={due.length ? '#fff' : '#2f6b2a'} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={styles.title}>Para hoje</Text>
          <Text style={styles.date}>{todayLabel(now)}</Text>
        </View>
        {due.length ? <View style={styles.count} accessibilityLabel={due.length + ' para regar'}><Text style={styles.countText}>{due.length}</Text></View> : null}
      </View>

      {due.length ? <>
        <Text style={styles.lead}>{due.length === 1 ? '1 planta precisa de água' : due.length + ' plantas precisam de água'}</Text>
        <View style={styles.list}>
          {visible.map(({ garden, plant, status }, index) => {
            const late = status.state === 'overdue';
            return (
              <View key={garden.id + '-' + plant.id} style={[styles.row, index > 0 && styles.divider]}>
                <Pressable accessibilityRole="button" accessibilityLabel={'Abrir ' + plant.name + ', ' + garden.name + '. ' + describeWaterStatus(status)}
                  onPress={() => open(garden.id, plant.id)} style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
                  <PlantPhoto uri={plantPhotos.resolve(plant.imageUrl)} compact style={styles.thumb} label={'Foto de ' + plant.name} />
                  <View style={styles.rowCopy}>
                    <Text style={styles.plantName} numberOfLines={1}>{plant.name}</Text>
                    <View style={styles.meta}>
                      <View style={[styles.pill, late ? styles.pillLate : styles.pillToday]}>
                        <Text style={[styles.pillText, late ? styles.pillTextLate : styles.pillTextToday]}>{late ? 'Atrasada ' + -(status.daysUntil ?? 0) + 'd' : 'Hoje'}</Text>
                      </View>
                      <Text style={styles.garden} numberOfLines={1}>{garden.name}</Text>
                    </View>
                  </View>
                </Pressable>
                <WaterNowButton gardenId={garden.id} plant={plant} urgent />
              </View>
            );
          })}
        </View>
        {due.length > COLLAPSED_COUNT ? (
          <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} style={styles.more}>
            <Text style={styles.moreText}>{expanded ? 'Mostrar menos' : 'Ver mais ' + (due.length - COLLAPSED_COUNT)}</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#2f6f8f" />
          </Pressable>
        ) : null}
      </> : (
        <View style={styles.calm}>
          <Text style={styles.calmTitle}>{tracked ? 'Tudo em dia por hoje 🌿' : 'Comece a acompanhar as regas'}</Text>
          <Text style={styles.calmText}>{!tracked
            ? 'Defina a frequência de rega nas suas plantas para ver aqui o que regar a cada dia.'
            : next ? nextLabel(next) : 'Registre a primeira rega das plantas para ver as próximas aqui.'}</Text>
        </View>
      )}
      {remindersSupported && remindersLoaded && !reminders.enabled && tracked ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Ativar lembretes de rega" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.invite, pressed && styles.pressed]}>
          <Ionicons name="notifications-outline" size={18} color="#9a6700" />
          <Text style={styles.inviteText}>Quer um aviso por dia quando for hora de regar?</Text>
          <Text style={styles.inviteAction}>Ativar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 18, gap: 14, backgroundColor: '#eaf3f7', borderWidth: 1, borderColor: '#d3e5ee' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2f6f8f' },
  headerIconCalm: { backgroundColor: '#d6ebcf' },
  headerCopy: { flex: 1, gap: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#17361d' },
  date: { fontSize: 13, color: '#4d6470' },
  count: { minWidth: 32, height: 32, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2f6f8f' },
  countText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  lead: { fontSize: 15, fontWeight: '700', color: '#1f4a5e' },
  list: { borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#edf1f3' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  thumb: { width: 48, height: 48, borderRadius: 14 },
  rowCopy: { flex: 1, gap: 4 },
  plantName: { fontSize: 16, fontWeight: '800', color: '#17361d' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  pillToday: { backgroundColor: '#fbf0d6' },
  pillLate: { backgroundColor: '#fbe3dd' },
  pillText: { fontSize: 12, fontWeight: '800' },
  pillTextToday: { color: '#8a5f00' },
  pillTextLate: { color: '#a3321f' },
  garden: { flexShrink: 1, fontSize: 12, color: '#586653' },
  more: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 12 },
  moreText: { fontSize: 14, fontWeight: '700', color: '#2f6f8f' },
  calm: { gap: 4, padding: 14, borderRadius: 18, backgroundColor: '#fff' },
  calmTitle: { fontSize: 16, fontWeight: '800', color: '#17361d' },
  calmText: { fontSize: 14, lineHeight: 21, color: '#586653' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#fff8e8' },
  inviteText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#5c4a1f' },
  inviteAction: { fontSize: 13, fontWeight: '800', color: '#17361d' },
  pressed: { opacity: 0.7 },
});
