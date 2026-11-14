import type { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { colors } from '../../theme/tokens';
import type { WaterState, WaterStatus } from './watering';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const longDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
export const pluralDays = (count: number) => count + (count === 1 ? ' dia' : ' dias');

/** Headline, date line and cycle badge for the next watering, shared by the plant page and the garden list. */
export function describeNextWatering(status: WaterStatus, due: Date | undefined, loading = false) {
  switch (status.state) {
    case 'unknown': return { title: 'Sem frequência', line: loading ? 'Buscando a referência da espécie…' : 'Defina de quanto em quanto tempo você rega', badge: undefined };
    case 'never': return { title: 'Primeira rega', line: 'Registre para começar o ciclo', badge: undefined };
    case 'overdue': return { title: 'Atrasada', line: (due ? 'Era em ' + longDate(due) + ' · ' : '') + 'há ' + pluralDays(-(status.daysUntil ?? 0)), badge: 'Atrasada' };
    case 'due': return { title: 'Hoje', line: due ? longDate(due) : '', badge: 'Hoje' };
    case 'soon': return { title: 'Amanhã', line: due ? longDate(due) : '', badge: 'Amanhã' };
    default: return { title: 'Em ' + pluralDays(status.daysUntil ?? 0), line: due ? longDate(due) : '', badge: 'Em dia' };
  }
}

/** Accent and soft background for the watering state: green on track, amber today, red when late. */
export function waterStateColors(state: WaterState) {
  if (state === 'overdue') return { tone: colors.danger, tint: colors.dangerTint };
  if (state === 'due') return { tone: colors.sun, tint: colors.sunTint };
  return { tone: colors.accentStrong, tint: colors.leafTint };
}

/** Summary pill next to the plant name; reflects only the watering calendar. */
export const careSummary: Record<WaterState, { label: string; icon: IoniconName; color: string; tint: string }> = {
  ok: { label: 'Cuidados em dia', icon: 'checkmark', color: colors.accentStrong, tint: colors.leafTint },
  soon: { label: 'Cuidados em dia', icon: 'checkmark', color: colors.accentStrong, tint: colors.leafTint },
  due: { label: 'Regar hoje', icon: 'water-outline', color: colors.sun, tint: colors.sunTint },
  overdue: { label: 'Rega atrasada', icon: 'alert-circle-outline', color: colors.danger, tint: colors.dangerTint },
  never: { label: 'Primeira rega pendente', icon: 'water-outline', color: colors.text, tint: colors.surfaceWarmHigh },
  unknown: { label: 'Defina a rega', icon: 'options-outline', color: colors.text, tint: colors.surfaceWarmHigh },
};
