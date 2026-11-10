import assert from 'node:assert/strict';
import test from 'node:test';
import { getFirstSteps, nextFirstStep } from '../src/features/onboarding/firstSteps';
import type { GardenDetails } from '../src/features/gardens/types';

const garden = (plants: number) => ({ plants: Array.from({ length: plants }, (_, index) => ({ id: 'p' + index })) } as unknown as GardenDetails);

test('first steps follow what already exists on the device', () => {
  const on = { supported: true, enabled: false };
  assert.equal(nextFirstStep(getFirstSteps([], on))?.key, 'garden');
  assert.equal(nextFirstStep(getFirstSteps([garden(0)], on))?.key, 'plant');
  assert.equal(nextFirstStep(getFirstSteps([garden(0), garden(2)], on))?.key, 'reminders');
  assert.equal(nextFirstStep(getFirstSteps([garden(1)], { supported: true, enabled: true })), undefined);
});

test('reminders step is left out where notifications are not supported', () => {
  const steps = getFirstSteps([garden(1)], { supported: false, enabled: false });
  assert.deepEqual(steps.map((step) => step.key), ['garden', 'plant']);
  assert.equal(nextFirstStep(steps), undefined);
});
