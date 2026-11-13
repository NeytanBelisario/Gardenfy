import assert from 'node:assert/strict';
import test from 'node:test';
import { formatHistoryDay } from '../src/features/gardens/plantHistory';
import { spotPhrase } from '../src/features/gardens/light';

const now = new Date(2026, 10, 13, 15, 0);
const at = (year: number, month: number, day: number) => new Date(year, month, day, 9, 5).toISOString();

test('timeline day uses today/yesterday, then day and month, adding the year only when it differs', () => {
  assert.match(formatHistoryDay(at(2026, 10, 13), now), /^Hoje · 09:05$/);
  assert.match(formatHistoryDay(at(2026, 10, 12), now), /^Ontem · 09:05$/);
  assert.match(formatHistoryDay(at(2026, 10, 4), now), /^4 nov · 09:05$/);
  assert.match(formatHistoryDay(at(2025, 11, 31), now), /^31 dez 2025 · 09:05$/);
});

test('light spot reads as a sentence', () => {
  assert.equal(spotPhrase('bright'), 'Fica na claridade');
  assert.equal(spotPhrase('sun'), 'Fica no sol direto');
  assert.equal(spotPhrase('shade'), 'Fica com pouca luz');
});
