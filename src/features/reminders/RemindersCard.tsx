import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGardensState } from '../gardens/store';
import { buildReminderSchedule, REMINDER_HOURS } from './reminderPlan';
import { getNotificationPermission, remindersSupported, requestNotificationPermission, type NotificationPermission } from './scheduler';
import { saveReminderSettings, useReminderSettings } from './settings';

function formatNext(date: Date, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((day - today) / 86400000);
  const when = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'numeric' });
  return when + ' às ' + date.getHours() + 'h';
}

export function RemindersCard() {
  const settings = useReminderSettings();
  const { gardens } = useGardensState();
  const [permission, setPermission] = useState<NotificationPermission>('undetermined');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (remindersSupported) getNotificationPermission().then(setPermission).catch(() => undefined);
  }, []);

  const run = async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { await task(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.'); }
    finally { busyRef.current = false; setBusy(false); }
  };

  const toggle = (enabled: boolean) => run(async () => {
    if (enabled) {
      const result = permission === 'granted' ? 'granted' : await requestNotificationPermission();
      setPermission(result);
      if (result !== 'granted') return;
    }
    await saveReminderSettings({ ...settings, enabled });
  });

  const enabled = remindersSupported && settings.enabled && permission === 'granted';
  const next = enabled ? buildReminderSchedule(gardens, settings).find((item) => item.kind === 'water') : undefined;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Ionicons name={enabled ? 'notifications' : 'notifications-outline'} size={22} color="#9a6700" /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={styles.title}>Lembretes de rega</Text>
          <Text style={styles.text}>Um aviso por dia, só quando alguma planta precisa de água.</Text>
        </View>
        <Switch accessibilityLabel="Lembretes de rega" value={enabled} disabled={!remindersSupported || busy} onValueChange={toggle}
          trackColor={{ false: '#d5d9cf', true: '#8fbf86' }} thumbColor={enabled ? '#17361d' : '#ffffff'} />
      </View>

      {!remindersSupported ? (
        <Text style={styles.note}>Os lembretes funcionam no app Android. No navegador, acompanhe pelo “Para hoje” na tela inicial.</Text>
      ) : permission === 'denied' && !enabled ? (
        <View style={styles.warning}>
          <Text style={styles.warningText}>As notificações do Gardenfy estão bloqueadas no aparelho. Libere nas configurações para ativar os lembretes.</Text>
          <Pressable accessibilityRole="button" onPress={() => { Linking.openSettings().catch(() => undefined); }} style={styles.link}>
            <Text style={styles.linkText}>Abrir configurações</Text>
          </Pressable>
        </View>
      ) : null}

      {enabled ? <>
        <Text style={styles.label}>Horário do aviso</Text>
        <View style={styles.hours}>
          {REMINDER_HOURS.map((hour) => {
            const selected = settings.hour === hour;
            return (
              <Pressable key={hour} accessibilityRole="button" accessibilityLabel={'Avisar às ' + hour + ' horas'} accessibilityState={{ selected, disabled: busy }} disabled={busy}
                onPress={() => run(() => saveReminderSettings({ ...settings, hour }))} style={[styles.hour, selected && styles.hourSelected]}>
                <Text style={[styles.hourText, selected && styles.hourTextSelected]}>{hour}h</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.next}>
          <Ionicons name="time-outline" size={18} color="#476644" />
          <Text style={styles.nextText}>{next
            ? 'Próximo aviso: ' + formatNext(next.date) + ' · ' + (next.plantCount === 1 ? '1 planta' : next.plantCount + ' plantas')
            : 'Nenhuma rega prevista nos próximos dias. Defina a frequência e registre as regas para receber avisos.'}</Text>
        </View>
        <Text style={styles.note}>Os avisos são agendados para as próximas duas semanas e renovados sempre que você abre o app.</Text>
      </> : null}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, gap: 14, borderWidth: 1, borderColor: '#e7e9e0' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf3d7' },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: '#17361d', fontSize: 18, fontWeight: '800' },
  text: { color: '#586653', fontSize: 13, lineHeight: 19 },
  label: { color: '#17361d', fontSize: 14, fontWeight: '700' },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: { minWidth: 52, minHeight: 40, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#c2c8bf' },
  hourSelected: { backgroundColor: '#17361d', borderColor: '#17361d' },
  hourText: { color: '#17361d', fontSize: 14, fontWeight: '700' },
  hourTextSelected: { color: '#ffffff' },
  next: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 14, backgroundColor: '#f1f3ec' },
  nextText: { flex: 1, color: '#33452f', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  note: { color: '#6b7666', fontSize: 12, lineHeight: 18 },
  warning: { gap: 6, padding: 12, borderRadius: 14, backgroundColor: '#fbf0d6' },
  warningText: { color: '#6b4a00', fontSize: 13, lineHeight: 20 },
  link: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  linkText: { color: '#17361d', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
  error: { color: '#93000a', fontSize: 13 },
});
