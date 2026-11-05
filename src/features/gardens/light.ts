import { getPlantCareProfile, type LightFit } from './careProfiles';
import type { GardenPlant, PlantLightSpot } from './types';

export const lightSpotOptions: { spot: PlantLightSpot; label: string; hint: string; icon: 'sunny' | 'partly-sunny' | 'cloudy' }[] = [
  { spot: 'sun', label: 'Sol direto', hint: 'Recebe sol batendo nas folhas por parte do dia.', icon: 'sunny' },
  { spot: 'bright', label: 'Claridade', hint: 'Perto de janela, bem iluminada, sem sol direto.', icon: 'partly-sunny' },
  { spot: 'shade', label: 'Pouca luz', hint: 'Longe de janelas ou em meia-sombra.', icon: 'cloudy' },
];

export const lightFitLabels: Record<LightFit, string> = { ideal: 'Ideal', ok: 'Aceitável', poor: 'Evite' };

export type LightStatus = {
  spot?: PlantLightSpot;
  /** Undefined when the species has no guide to compare with. */
  fit?: LightFit;
  /** Spot the species prefers, when known. */
  ideal?: PlantLightSpot;
  level: number;
};

const fitLevel: Record<LightFit, number> = { ideal: 1, ok: 0.6, poor: 0.25 };

export function getLightStatus(plant: GardenPlant): LightStatus {
  const lightFit = getPlantCareProfile(plant)?.lightFit;
  const ideal = lightFit ? lightSpotOptions.find((option) => lightFit[option.spot] === 'ideal')?.spot : undefined;
  if (!plant.lightSpot) return { ideal, level: 0 };
  const fit = lightFit?.[plant.lightSpot];
  return { spot: plant.lightSpot, fit, ideal, level: fit ? fitLevel[fit] : 0 };
}

export function spotLabel(spot: PlantLightSpot) {
  return lightSpotOptions.find((option) => option.spot === spot)!.label;
}

export function describeLightStatus(status: LightStatus) {
  if (!status.spot) return 'Onde ela fica?';
  if (!status.fit) return spotLabel(status.spot);
  if (status.fit === 'ideal') return 'Local ideal';
  if (status.fit === 'ok') return 'Local aceitável';
  return status.spot === 'sun' ? 'Sol forte demais para ela' : 'Pouca luz para ela';
}

export function describeLightDetail(status: LightStatus) {
  if (!status.spot) return 'Conte onde a planta fica para comparar com o que a espécie prefere.';
  if (!status.fit) return 'Sem ficha da espécie para comparar com o local.';
  const where = 'Fica em: ' + spotLabel(status.spot).toLowerCase();
  if (status.fit === 'ideal' || !status.ideal) return where;
  return where + ' · ela prefere ' + spotLabel(status.ideal).toLowerCase();
}
