import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export type AccessibilityPrefs = { screenReader: boolean; reduceMotion: boolean };

/** Leitor de tela e "reduzir movimento" do sistema, atualizados quando a pessoa muda a configuração. */
export function useAccessibilityPrefs(): AccessibilityPrefs {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>({ screenReader: false, reduceMotion: false });
  useEffect(() => {
    let active = true;
    const update = (patch: Partial<AccessibilityPrefs>) => { if (active) setPrefs((current) => ({ ...current, ...patch })); };
    AccessibilityInfo.isScreenReaderEnabled().then((screenReader) => update({ screenReader }), () => undefined);
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => update({ reduceMotion }), () => undefined);
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', (screenReader) => update({ screenReader }));
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) => update({ reduceMotion }));
    return () => { active = false; reader.remove(); motion.remove(); };
  }, []);
  return prefs;
}
