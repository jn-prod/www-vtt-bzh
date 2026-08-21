import 'dotenv/config';
import { createClient, find } from 'repository';
import { normalizeEvents, type RawCalendarEvent } from './normalize-events';
import { evaluateBuildGuard } from './build-guard';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

const db = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_PUBLISHABLE_KEY as string);

const parisDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const main = async () => {
  const now = new Date();
  const today = parisDate(now);
  const horizon = addDays(today, 365);

  const projection = [
    'date',
    'place',
    'name',
    'email',
    'phone',
    'price',
    'canceled',
    'departement',
    'hour',
    'organisateur',
    'city',
    'description',
    'website',
    'origin',
  ].join(',');

  const res = await find<RawCalendarEvent>(
    db,
    process.env.SUPABASE_TABLE as string,
    [
      { column: 'active', operator: 'eq', value: true },
      { column: 'date', operator: 'gte', value: today },
      { column: 'date', operator: 'lte', value: horizon },
    ],
    projection,
    { order: { column: 'date', ascending: true } }
  );

  if (!res.ok) {
    console.error('[generate-events-json] fetch failed', res.error);
    process.exit(1);
  }

  const rawEvents = res.value ?? [];
  const { events, health, duplicateGroups } = normalizeEvents(rawEvents);
  let previousCount: number | undefined;
  try {
    const previous = await fetch('https://www.vtt.bzh/calendrier/events.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (previous.ok) {
      const previousEvents: unknown = await previous.json();
      if (Array.isArray(previousEvents)) previousCount = previousEvents.length;
    }
  } catch {
    console.warn('[generate-events-json] baseline production indisponible');
  }

  if (previousCount === undefined) {
    const bootstrapPath = join(__dirname, '..', 'baseline', 'events-count.json');
    if (existsSync(bootstrapPath)) {
      try {
        const bootstrap = JSON.parse(readFileSync(bootstrapPath, 'utf8')) as { count?: unknown };
        if (Number.isInteger(bootstrap.count) && Number(bootstrap.count) > 0) {
          previousCount = Number(bootstrap.count);
          console.warn(`[generate-events-json] baseline d'amorçage utilisée : ${previousCount} événements`);
        }
      } catch {
        console.error('[generate-events-json] baseline d’amorçage illisible');
      }
    }
  }

  const guard = evaluateBuildGuard(events.length, previousCount, process.env.CI === 'true');
  if (!guard.ok) {
    if (guard.reason === 'empty_calendar') {
      console.error('[generate-events-json] aucun événement publiable : build interrompu');
    } else if (guard.reason === 'missing_production_baseline') {
      console.error('[generate-events-json] baseline production obligatoire en CI : build interrompu');
    } else {
      console.error(
        `[generate-events-json] baisse anormale : ${events.length} événements contre ${previousCount} en production`
      );
    }
    process.exit(1);
  }

  const outPath = join(__dirname, '..', 'out', 'events.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(events, null, 2));

  const countUntil = (date: string) => events.filter((event) => event.date >= today && event.date <= date).length;

  console.log(
    `[calendar-health] total=${health.published} j30=${countUntil(addDays(today, 30))} j90=${countUntil(
      addDays(today, 90)
    )} j365=${countUntil(horizon)} invalides=${health.invalid} doublons=${health.duplicates} réparés=${health.repaired}`
  );
  console.log(
    `[calendar-health] manquants=${JSON.stringify(health.missing)} origines=${JSON.stringify(health.origins)}`
  );
  for (const duplicate of duplicateGroups) console.warn(`[calendar-health] doublon écarté : ${duplicate}`);
  console.log(`[generate-events-json] wrote ${events.length} events to ${outPath}`);
};

main();
