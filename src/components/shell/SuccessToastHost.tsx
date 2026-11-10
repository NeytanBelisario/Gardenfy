import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dismissSuccessToast, useSuccessToast } from './successToastStore';

const VISIBLE_MS = 2600;
const VISIBLE_WITH_ACTION_MS = 5000;

const toneStyle = {
  success: { badge: '#4f8a45', icon: 'checkmark' },
  water: { badge: '#2f6f8f', icon: 'water' },
  error: { badge: '#c0412b', icon: 'alert' },
} as const;

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
    }, toast.action ? VISIBLE_WITH_ACTION_MS : VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast, progress]);

  if (!toast) return null;

  const tone = toneStyle[toast.tone ?? 'success'];
  const action = toast.action;
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });

  return (
    <View style={[styles.host, { top: insets.top + 72 }]}>
      <Animated.View style={{ opacity: progress, transform: [{ translateY }, { scale }] }}>
        <View style={[styles.toast, toast.tone === 'error' && styles.errorToast]}>
          <Pressable accessibilityRole="button" accessibilityLabel={toast.message ? `${toast.title}. ${toast.message}` : toast.title}
            accessibilityHint="Toque para fechar" onPress={() => dismissSuccessToast(toast.id)} style={styles.main}>
            <View style={[styles.check, { backgroundColor: tone.badge }]}>
              <Ionicons name={tone.icon} size={22} color="#ffffff" />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
            </View>
          </Pressable>
          {action ? (
            <Pressable accessibilityRole="button" accessibilityLabel={action.label} hitSlop={6}
              onPress={() => { dismissSuccessToast(toast.id); action.onPress(); }} style={styles.action}>
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', pointerEvents: 'box-none' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 520, minHeight: 56,
    paddingVertical: 10, paddingLeft: 12, paddingRight: 10, borderRadius: 20, backgroundColor: '#17361d',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.18)',
  },
  errorToast: { backgroundColor: '#5c1a10' },
  main: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 8 },
  action: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)' },
  actionText: { color: '#c8ecc1', fontSize: 14, fontWeight: '800' },
  check: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4f8a45' },
  body: { flexShrink: 1, gap: 2 },
  title: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  message: { color: '#d8e6d2', fontSize: 13, lineHeight: 18 },
});
