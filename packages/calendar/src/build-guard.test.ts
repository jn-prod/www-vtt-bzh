import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBuildGuard } from './build-guard';

test('refuse toujours un calendrier vide', () => {
  assert.deepEqual(evaluateBuildGuard(0, 0, 0), { ok: false, reason: 'empty_calendar' });
});

test('accepte une baisse de saison quand la lecture correspond au comptage Supabase', () => {
  assert.deepEqual(evaluateBuildGuard(12, 12, 12), { ok: true });
});

test('refuse une lecture incomplète', () => {
  assert.deepEqual(evaluateBuildGuard(12, 12, 77), { ok: false, reason: 'source_mismatch' });
});

test('refuse une normalisation qui écarte plus de la moitié des lignes', () => {
  assert.deepEqual(evaluateBuildGuard(37, 75, 75), { ok: false, reason: 'normalization_drop' });
  assert.deepEqual(evaluateBuildGuard(38, 75, 75), { ok: true });
});
