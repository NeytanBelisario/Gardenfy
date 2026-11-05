import type { CareMeterTone } from '../../components/CareMeter';
import type { LightFit } from './careProfiles';
import type { RoutineStatus } from './routine';
import type { WaterState } from './watering';

export const waterTone: Record<WaterState, CareMeterTone> = { ok: 'good', soon: 'warn', due: 'alert', overdue: 'alert', never: 'neutral', unknown: 'neutral' };
export const lightTone: Record<LightFit, CareMeterTone> = { ideal: 'good', ok: 'warn', poor: 'alert' };
export const routineTone: Record<RoutineStatus['state'], CareMeterTone> = { good: 'good', fair: 'warn', behind: 'alert', none: 'neutral' };
