import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCalendarSupplyMetrics } from './metrics.ts';

test('builds privacy-safe calendar supply metrics', () => {
  const now = new Date('2026-08-23T12:00:00.000Z');
  const metrics = buildCalendarSupplyMetrics([
    { created_at: '2026-08-23T11:00:00.000Z', date: '2026-08-25', active: true, canceled: false, origin: 'public-form/edge/a' },
    { created_at: '2026-08-20T12:00:00.000Z', date: '2026-09-10', active: true, canceled: false, origin: 'manual' },
    { created_at: '2026-08-01T12:00:00.000Z', date: '2026-08-28', active: true, canceled: true, origin: null },
  ], now);
  assert.deepEqual(metrics.additions, { '1d': 1, '7d': 2, '30d': 3 });
  assert.equal(metrics.last_public_submission_at, '2026-08-23T11:00:00.000Z');
  assert.deepEqual(metrics.active_future, { '30d': 2, '60d': 2, '90d': 2 });
  assert.deepEqual(metrics.canceled_upcoming, { '30d': 1 });
  assert.deepEqual(metrics.additions_by_origin_30d, { other: 1, public_form: 1, unknown: 1 });
});
