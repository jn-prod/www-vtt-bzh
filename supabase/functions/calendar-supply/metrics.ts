export type EventRecord = {
  created_at: string;
  date: string;
  active: boolean;
  canceled: boolean;
  origin: string | null;
};

const DAY_MS = 86_400_000;
const PARIS = 'Europe/Paris';

const parisDate = (value: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PARIS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const originBucket = (origin: string | null): string => {
  if (origin?.startsWith('public-form/')) return 'public_form';
  if (!origin) return 'unknown';
  return 'other';
};

export const buildCalendarSupplyMetrics = (records: EventRecord[], now = new Date()) => {
  const today = parisDate(now);
  const daysFromToday = (days: number) => {
    const target = new Date(now);
    target.setUTCDate(target.getUTCDate() + days);
    return parisDate(target);
  };
  const createdSince = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  const created = (days: number) => records.filter((record) => record.created_at >= createdSince(days));
  const futureActive = (days: number) =>
    records.filter((record) => record.active && !record.canceled && record.date >= today && record.date <= daysFromToday(days));
  const canceledUpcoming = (days: number) =>
    records.filter((record) => record.canceled && record.date >= today && record.date <= daysFromToday(days));
  const publicSubmissions = records
    .filter((record) => record.origin?.startsWith('public-form/'))
    .map((record) => record.created_at)
    .sort()
    .at(-1);

  return {
    generated_at: now.toISOString(),
    additions: { '1d': created(1).length, '7d': created(7).length, '30d': created(30).length },
    last_public_submission_at: publicSubmissions ?? null,
    active_future: { '30d': futureActive(30).length, '60d': futureActive(60).length, '90d': futureActive(90).length },
    canceled_upcoming: { '30d': canceledUpcoming(30).length },
    additions_by_origin_30d: Object.fromEntries(
      Object.entries(
        created(30).reduce<Record<string, number>>((counts, record) => {
          const bucket = originBucket(record.origin);
          counts[bucket] = (counts[bucket] ?? 0) + 1;
          return counts;
        }, {}),
      ).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
};
