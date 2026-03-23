import 'dotenv/config';
import { createClient, find } from 'repository';
import type { CalendarEvent } from './types';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const db = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_KEY as string);

const toISODate = (d: Date): string => d.toISOString().split('T')[0];

const main = async () => {
  const from = new Date();
  const to = new Date(from);
  to.setFullYear(from.getFullYear() + 1);

  const projection = [
    'date',
    'place',
    'name',
    'contact',
    'price',
    'canceled',
    'departement',
    'hour',
    'organisateur',
    'city',
    'description',
  ].join(',');

  const res = await find<CalendarEvent>(
    db,
    process.env.SUPABASE_TABLE as string,
    [
      { column: 'active', operator: 'eq', value: true },
      { column: 'date', operator: 'gte', value: toISODate(from) },
      { column: 'date', operator: 'lte', value: toISODate(to) },
    ],
    projection,
    { order: { column: 'date', ascending: true } }
  );

  if (!res.ok) {
    console.error('[generate-events-json] fetch failed', res.error);
    process.exit(1);
  }

  const dateToFrench = (d: string | Date | undefined) =>
    d ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(d as string)) : '';

  const events = res.value ?? [];
  const enriched = events.map((e) => ({ ...e, dateFormatted: dateToFrench(e.date) }));

  const outPath = join(__dirname, '..', 'out', 'events.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(enriched, null, 2));
  console.log(`[generate-events-json] wrote ${events.length} events to ${outPath}`);
};

main();
