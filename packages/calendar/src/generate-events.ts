import 'dotenv/config';
import { count, createClient, find } from 'repository';
import { normalizeEvents, type RawCalendarEvent } from './normalize-events';
import { evaluateBuildGuard } from './build-guard';
import { mkdirSync, writeFileSync } from 'fs';
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

  const table = process.env.SUPABASE_TABLE as string;
  const filters = [
    { column: 'active', operator: 'eq', value: true },
    { column: 'date', operator: 'gte', value: today },
    { column: 'date', operator: 'lte', value: horizon },
  ];

  const res = await find<RawCalendarEvent>(db, table, filters, projection, {
    order: { column: 'date', ascending: true },
  });
  if (!res.ok) {
    console.error('[generate-events-json] fetch failed', res.error);
    process.exit(1);
  }

  const total = await count(db, table, filters);
  if (!total.ok) {
    console.error('[generate-events-json] count failed', total.error);
    process.exit(1);
  }

  const rawEvents = res.value ?? [];
  const { events, health, duplicateGroups } = normalizeEvents(rawEvents);

  const guard = evaluateBuildGuard(events.length, rawEvents.length, total.value);
  if (!guard.ok) {
    if (guard.reason === 'empty_calendar') {
      console.error('[generate-events-json] aucun événement publiable : build interrompu');
    } else if (guard.reason === 'source_mismatch') {
      console.error(
        `[generate-events-json] lecture incomplète : ${rawEvents.length} lignes lues contre ${total.value} dans Supabase`
      );
    } else {
      console.error(
        `[generate-events-json] normalisation anormale : ${events.length} événements publiés sur ${rawEvents.length} lus`
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
