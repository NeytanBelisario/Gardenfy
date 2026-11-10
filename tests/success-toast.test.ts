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

test('a toast can carry an action and a tone without changing the default', () => {
  let undone = 0;
  showSuccessToast('Rega registrada', 'Monstera', { tone: 'water', action: { label: 'Desfazer', onPress: () => { undone++; } } });
  const toast = getSuccessToast();
  assert.equal(toast?.tone, 'water');
  toast?.action?.onPress();
  assert.equal(undone, 1);
  showSuccessToast('Planta adicionada');
  assert.equal(getSuccessToast()?.action, undefined);
  assert.equal(getSuccessToast()?.tone, undefined);
  dismissSuccessToast();
});
