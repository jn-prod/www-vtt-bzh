import 'dotenv/config';
import { createClient, find } from '../lib/repository';
import type { CalendarEvent } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const db = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string,
);

const toISODate = (d: Date): string => d.toISOString().split('T')[0];

const escapeYamlString = (value: string): string =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const toYamlValue = (value: unknown): string => {
  if (value === null || value === undefined) return '~';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  return escapeYamlString(String(value));
};

const eventsToYaml = (events: CalendarEvent[]): string => {
  if (events.length === 0) return '[]\n';
  return (
    events
      .map((event) => {
        const entries = Object.entries(event).filter(
          ([, v]) => v !== null && v !== undefined,
        );
        const [firstKey, firstValue] = entries[0];
        const rest = entries
          .slice(1)
          .map(([k, v]) => `  ${k}: ${toYamlValue(v)}`)
          .join('\n');
        return `- ${firstKey}: ${toYamlValue(firstValue)}\n${rest}`;
      })
      .join('\n') + '\n'
  );
};

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
    { order: { column: 'date', ascending: true } },
  );

  if (!res.ok) {
    console.error('[generate-events-yaml] fetch failed', res.error);
    process.exit(1);
  }

  const dateToFrench = (d: string | Date | undefined) =>
    d ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(d as string)) : '';

  const enriched = res.value.map((e) => ({ ...e, dateFormatted: dateToFrench(e.date) }));

  const outPath = join(__dirname, '..', '..', '..', 'www', '_data', 'events.yaml');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, eventsToYaml(enriched as CalendarEvent[]));
  console.log(`[generate-events-yaml] wrote ${res.value.length} events to ${outPath}`);
};

main();
