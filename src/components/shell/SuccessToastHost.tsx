import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dismissSuccessToast, useSuccessToast } from './successToastStore';

const VISIBLE_MS = 2600;

export function SuccessToastHost() {
  const toast = useSuccessToast();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.message ? `${toast.title}. ${toast.message}` : toast.title);
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true })
        .start(() => dismissSuccessToast(toast.id));
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, progress]);

  if (!toast) return null;

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 72 }]}>
      <Animated.View style={{ opacity: progress, transform: [{ translateY }, { scale }] }}>
        <Pressable accessibilityRole="button" accessibilityLabel={toast.message ? `${toast.title}. ${toast.message}` : toast.title}
          accessibilityHint="Toque para fechar" onPress={() => dismissSuccessToast(toast.id)} style={styles.toast}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={22} color="#ffffff" />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 520, minHeight: 56,
    paddingVertical: 12, paddingLeft: 12, paddingRight: 18, borderRadius: 20, backgroundColor: '#17361d',
    shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f8a45' },
  body: { flexShrink: 1, gap: 2 },
  title: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  message: { color: '#d8e6d2', fontSize: 13, lineHeight: 18 },
});
