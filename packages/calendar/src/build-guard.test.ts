import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBuildGuard } from './build-guard';

test('refuse toujours un calendrier vide', () => {
  assert.deepEqual(evaluateBuildGuard(0, 75, false), { ok: false, reason: 'empty_calendar' });
});

test('refuse une baisse strictement supérieure à 50 %', () => {
  assert.deepEqual(evaluateBuildGuard(37, 75, true), { ok: false, reason: 'abnormal_drop' });
  assert.deepEqual(evaluateBuildGuard(38, 75, true), { ok: true });
});

test('exige la baseline de production en CI uniquement', () => {
  assert.deepEqual(evaluateBuildGuard(75, undefined, true), {
    ok: false,
    reason: 'missing_production_baseline',
  });
  assert.deepEqual(evaluateBuildGuard(75, undefined, false), { ok: true });
});
