import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { describeStreak, type StreakStatus } from './streak';

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return names[0] + ' e ' + names[1];
  return names[0] + ', ' + names[1] + ' e mais ' + (names.length - 2);
}

export function StreakDialog({ streak, onClose }: { streak: StreakStatus; onClose: () => void }) {
  const broken = streak.current === 0 && streak.lateToday.length > 0;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <View style={[styles.flame, broken && styles.flameOff]}>
                <Ionicons name="flame" size={40} color={broken ? '#b9a58a' : '#f08a24'} />
              </View>
              <Text style={styles.number} accessibilityRole="header">{streak.current}</Text>
              <Text style={styles.unit}>{streak.current === 1 ? 'dia seguido com tudo em dia' : 'dias seguidos com tudo em dia'}</Text>
            </View>

            {broken ? (
              <View style={styles.restart}>
                <Ionicons name="water" size={18} color="#2f6f8f" />
                <Text style={styles.restartText}>Recomece hoje: regue {joinNames(streak.lateToday)} para voltar a contar.</Text>
              </View>
            ) : streak.current > 0 ? (
              <Text style={styles.cheer}>{streak.current >= 7 ? 'Que ritmo! Suas plantas agradecem. 🌿' : 'Bom começo. Cada dia em dia conta. 🌱'}</Text>
            ) : null}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="trophy-outline" size={20} color="#9a6700" />
                <Text style={styles.statValue}>{describeStreak(streak.best)}</Text>
                <Text style={styles.statLabel}>Melhor sequência</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="leaf-outline" size={20} color="#476644" />
                <Text style={styles.statValue}>{streak.trackedPlants} {streak.trackedPlants === 1 ? 'planta' : 'plantas'}</Text>
                <Text style={styles.statLabel}>Na contagem</Text>
              </View>
            </View>

            <Text style={styles.note}>Um dia conta quando nenhuma planta com frequência de rega está atrasada. Plantas sem frequência ou sem rega registrada ficam fora. Calculado só com os seus registros.</Text>

            <Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}>
              <Text style={styles.primaryText}>Fechar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,28,17,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: '#fbf9f5', borderRadius: 28 },
  content: { padding: 24, gap: 16 },
  hero: { alignItems: 'center', gap: 4 },
  flame: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebd6', marginBottom: 6 },
  flameOff: { backgroundColor: '#f1ece4' },
  number: { fontSize: 52, lineHeight: 58, fontWeight: '800', color: '#17361d' },
  unit: { fontSize: 15, color: '#586653', textAlign: 'center' },
  cheer: { fontSize: 15, lineHeight: 22, color: '#33452f', textAlign: 'center', fontWeight: '600' },
  restart: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 16, backgroundColor: '#eaf3f7' },
  restartText: { flex: 1, fontSize: 14, lineHeight: 21, color: '#1f4a5e', fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, gap: 4, padding: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e7e9e0' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#17361d' },
  statLabel: { fontSize: 12, color: '#586653' },
  note: { fontSize: 12, lineHeight: 18, color: '#6b7666' },
  primary: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17361d' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
