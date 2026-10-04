import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/shell/AppHeader';

export function PlantArScreen() {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <AppHeader title="Realidade aumentada" mode="back" onPressLeading={() => router.canGoBack() ? router.back() : router.replace('/')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="cube-outline" size={52} color="#476644" /></View>
          <Text style={styles.badge}>EM BREVE</Text>
          <Text accessibilityRole="header" style={styles.title}>Um novo jeito de imaginar seu jardim</Text>
          <Text style={styles.text}>A realidade aumentada chega em uma pr?xima vers?o. Por enquanto, seu espa?o j? est? pronto para guardar plantas e acompanhar os cuidados.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.button}>
            <Text style={styles.buttonText}>Voltar aos meus jardins</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 480, alignItems: 'center', backgroundColor: '#fff', borderRadius: 28, padding: 28, gap: 20, borderWidth: 1, borderColor: '#e7e9e0' },
  icon: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: '#eef2e8' },
  badge: { color: '#476644', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#17361d', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  text: { color: '#586653', fontSize: 16, lineHeight: 25, textAlign: 'center' },
  button: { backgroundColor: '#17361d', borderRadius: 16, padding: 18, minHeight: 52, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
