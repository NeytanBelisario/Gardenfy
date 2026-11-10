import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, font, minTouch, space } from '../../theme/tokens';
import { remindersSupported } from '../reminders/scheduler';
import { useReminderSettings, useReminderSettingsLoaded } from '../reminders/settings';
import type { GardenDetails } from '../gardens/types';
import { getFirstSteps, nextFirstStep, type FirstStepKey } from './firstSteps';

const DISMISSED_KEY = 'gardenfy.first-steps.dismissed.v1';

/** Checklist de boas-vindas na tela inicial. Some sozinho quando os passos terminam ou se a pessoa dispensar. */
export function FirstStepsCard({ gardens }: { gardens: GardenDetails[] }) {
  const router = useRouter();
  const reminders = useReminderSettings();
  const remindersLoaded = useReminderSettingsLoaded();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((value) => setDismissed(value === '1'), () => setDismissed(false));
  }, []);

  const steps = getFirstSteps(gardens, { supported: remindersSupported, enabled: reminders.enabled });
  const next = nextFirstStep(steps);
  // Sem jardim, o estado vazio da tela inicial já é o primeiro passo.
  if (dismissed !== false || !remindersLoaded || !gardens.length || !next) return null;

  const done = steps.filter((step) => step.done).length;
  const open = (key: FirstStepKey) => {
    if (key === 'garden') router.push('/gardens/new');
    else if (key === 'plant') router.push({ pathname: '/gardens/[id]/plants/add', params: { id: gardens[0].id } });
    else router.push('/profile');
  };
  const dismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => undefined);
  };

  return (
    <Card tone="muted">
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>Primeiros passos</Text>
          <Text style={styles.progress}>{done} de {steps.length} concluídos</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Dispensar primeiros passos" onPress={dismiss} style={styles.close}>
          <Ionicons name="close" size={20} color={colors.accent} />
        </Pressable>
      </View>
      {steps.map((step) => (
        <View key={step.key} accessible accessibilityLabel={step.title + (step.done ? ', concluído' : ', pendente')} style={styles.step}>
          <Ionicons name={step.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={step.done ? colors.accentStrong : colors.borderStrong} />
          <View style={styles.copy}>
            <Text style={[styles.stepTitle, step.done && styles.stepDone]}>{step.title}</Text>
            {step.key === next.key ? <Text style={styles.hint}>{step.hint}</Text> : null}
          </View>
        </View>
      ))}
      <Button label={next.key === 'plant' ? 'Adicionar planta' : next.key === 'reminders' ? 'Ativar lembretes' : 'Criar jardim'} icon="arrow-forward" onPress={() => open(next.key)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  copy: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontSize: font.title - 2, fontWeight: '800' },
  progress: { color: colors.text, fontSize: font.caption },
  close: { width: minTouch, height: minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: minTouch / 2 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  stepTitle: { color: colors.ink, fontSize: font.body, fontWeight: '700' },
  stepDone: { color: colors.text, textDecorationLine: 'line-through', fontWeight: '600' },
  hint: { color: colors.text, fontSize: font.caption, lineHeight: 20 },
});
