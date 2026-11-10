import type { GardenDetails } from '../gardens/types';

export type FirstStepKey = 'garden' | 'plant' | 'reminders';

export type FirstStep = {
  key: FirstStepKey;
  title: string;
  hint: string;
  done: boolean;
};

/**
 * Os três primeiros passos, derivados do que já existe no aparelho: nada é marcado à mão,
 * então um passo feito por outro caminho (ex.: pelo menu) também conta.
 */
export function getFirstSteps(gardens: GardenDetails[], reminders: { supported: boolean; enabled: boolean }): FirstStep[] {
  const steps: FirstStep[] = [
    { key: 'garden', title: 'Crie seu primeiro jardim', hint: 'Um jardim agrupa as plantas de um cômodo ou da varanda.', done: gardens.length > 0 },
    { key: 'plant', title: 'Adicione uma planta', hint: 'Pelo catálogo ou por foto, para acompanhar regas e luz.', done: gardens.some((garden) => garden.plants.length > 0) },
  ];
  if (reminders.supported) {
    steps.push({ key: 'reminders', title: 'Ative os lembretes', hint: 'Um aviso por dia, só quando alguma planta precisar de água.', done: reminders.enabled });
  }
  return steps;
}

export function nextFirstStep(steps: FirstStep[]) {
  return steps.find((step) => !step.done);
}
