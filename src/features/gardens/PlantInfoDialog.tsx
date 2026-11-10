import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantPhoto } from '../../components/PlantPhoto';
import { PlantCareInstructions } from './PlantCareInstructions';
import type { GardenPlant } from './types';
import { colors } from '../../theme/tokens';

const useNativeDriver = Platform.OS !== 'web';

export function PlantInfoDialog({ plant, onClose, onReviewSpecies }: { plant: GardenPlant; onClose: () => void; onReviewSpecies: () => void }) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver }).start();
  }, [progress]);

  const dismiss = useCallback((then?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver }).start(() => { onClose(); then?.(); });
  }, [onClose, progress]);

  const subtitle = [plant.species?.scientificName, plant.subtitle].filter(Boolean);

  return (
    <Modal transparent animationType="none" onRequestClose={() => dismiss()}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => dismiss()} />
        </Animated.View>
        <Animated.View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: 12 + insets.bottom, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) }] }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <PlantPhoto uri={plant.imageUrl} compact style={styles.thumb} label={'Foto de ' + plant.name} />
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>{plant.name}</Text>
              {subtitle.map((line, index) => <Text key={index} style={index === 0 && plant.species ? styles.scientific : styles.caption} numberOfLines={1}>{line}</Text>)}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar informações da planta" onPress={() => dismiss()} hitSlop={8} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <PlantCareInstructions plant={plant} />
            <Pressable accessibilityRole="button" onPress={() => dismiss(onReviewSpecies)} style={styles.review}>
              <Ionicons name="camera-outline" size={20} color={colors.accent} />
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewTitle}>{plant.species ? 'Revisar espécie por foto' : 'Identificar por foto'}</Text>
                <Text style={styles.caption}>{plant.species ? 'Não parece ser esta? Tire uma foto para conferir.' : 'Descubra a espécie e receba a ficha de cuidados.'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8a9585" />
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { backgroundColor: 'rgba(15,28,17,0.5)' },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '88%', backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#d5d9cf', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  thumb: { width: 64, height: 64, borderRadius: 18 },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink },
  scientific: { fontSize: 14, fontStyle: 'italic', color: colors.accent },
  caption: { fontSize: 13, color: colors.text },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.surfaceMuted, alignSelf: 'flex-start' },
  body: { paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  review: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
