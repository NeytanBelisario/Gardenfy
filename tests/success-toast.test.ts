import assert from 'node:assert/strict';
import test from 'node:test';

import { dismissSuccessToast, getSuccessToast, showSuccessToast } from '../src/components/shell/successToastStore';

test('a newer toast is not dismissed by the previous toast timer', () => {
  showSuccessToast('Planta adicionada', 'Jiboia agora faz parte de Varanda.');
  const first = getSuccessToast();
  showSuccessToast('Planta adicionada', 'Costela-de-adão agora faz parte de Varanda.');
  const second = getSuccessToast();

  assert.ok(first && second);
  assert.notEqual(first.id, second.id);

  dismissSuccessToast(first.id);
  assert.equal(getSuccessToast(), second);

  dismissSuccessToast(second.id);
  assert.equal(getSuccessToast(), null);
});
