import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useAccessibilityPrefs } from './useAccessibilityPrefs';

/**
 * Escala que dá um pequeno "pulo" quando `active` passa de falso para verdadeiro
 * (ex.: planta acabou de ser regada). Não anima no primeiro render nem com "reduzir movimento".
 */
export function usePopOnTrue(active: boolean) {
  const scale = useRef(new Animated.Value(1)).current;
  const previous = useRef(active);
  const { reduceMotion } = useAccessibilityPrefs();
  useEffect(() => {
    const turnedOn = active && !previous.current;
    previous.current = active;
    if (!turnedOn || reduceMotion) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [active, reduceMotion, scale]);
  return scale;
}
