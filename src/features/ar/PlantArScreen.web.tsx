import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppHeader } from '../../components/shell/AppHeader';

// Keep native Viro imports out of the web and server-rendering bundles.
export function PlantArScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return (
    <View style={styles.screen}>
      <AppHeader title="Visualizar em AR" mode="back" onPressLeading={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="cube-outline" size={40} color="#476644" /></View>
          <Text accessibilityRole="header" style={styles.title}>Um novo jeito de imaginar seu jardim</Text>
          <Text style={styles.text}>A realidade aumentada está disponível no app nativo, em aparelhos compatíveis. No navegador, você pode continuar organizando seus jardins e registrando cuidados.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}>
            <Text style={styles.buttonText}>Ir para meus jardins</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fbf9f5' },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 28, padding: 28, gap: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e7e9e0' },
  icon: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#eef2e8', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#17361d', fontSize: 27, lineHeight: 34, fontWeight: '800', textAlign: 'center' },
  text: { color: '#586653', fontSize: 15, lineHeight: 24, textAlign: 'center' },
  button: { minHeight: 48, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16, backgroundColor: '#17361d' },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
