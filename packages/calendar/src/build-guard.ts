export type BuildGuardResult =
  { ok: true } | { ok: false; reason: 'empty_calendar' | 'missing_production_baseline' | 'abnormal_drop' };

export const evaluateBuildGuard = (
  currentCount: number,
  previousCount: number | undefined,
  requireBaseline: boolean
): BuildGuardResult => {
  if (currentCount === 0) return { ok: false, reason: 'empty_calendar' };
  if (previousCount === undefined) {
    return requireBaseline ? { ok: false, reason: 'missing_production_baseline' } : { ok: true };
  }
  if (previousCount > 0 && currentCount < Math.ceil(previousCount / 2)) {
    return { ok: false, reason: 'abnormal_drop' };
  }
  return { ok: true };
};
