// Suivi hebdomadaire interne de santé calendrier vtt.bzh.
// Indicateur défini en T-047. Statuts : OK / WATCH / RISK.
//
// Local : node --env-file=.env scripts/calendar-health.mjs
// Supabase Management API — nécessite SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF.
// Ne pas exposer les résultats publiquement ; usage interne uniquement.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[health] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

async function runQuery(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

const QUERY = `
with active_future as (
  select
    date::date as event_date,
    departement,
    origin
  from public.events
  where active = true
    and date::date >= current_date
    and date::date <= current_date + interval '365 days'
),
metrics as (
  select
    count(*) filter (where event_date <= current_date + interval '30 days') as events_30d,
    count(*) filter (where event_date <= current_date + interval '90 days') as events_90d,
    count(*) as events_365d,
    count(*) filter (
      where event_date <= current_date + interval '30 days'
        and origin like 'public-form/%'
    ) as public_form_30d,
    count(*) filter (
      where event_date <= current_date + interval '90 days'
        and origin like 'public-form/%'
    ) as public_form_90d,
    min(event_date) as next_event_date,
    count(distinct departement) filter (
      where event_date <= current_date + interval '90 days'
    ) as departments_90d
  from active_future
)
select
  events_30d,
  events_90d,
  events_365d,
  public_form_30d,
  public_form_90d,
  case
    when next_event_date is null then null
    else (next_event_date - current_date)::int
  end as days_until_next_event,
  departments_90d,
  case
    when events_30d = 0
      or next_event_date is null
      or (next_event_date - current_date) > 30
      then 'RISK'
    when public_form_90d = 0
      or departments_90d < 3
      then 'WATCH'
    else 'OK'
  end as freshness_status
from metrics;
`;

const rows = await runQuery(QUERY);
const m = rows[0];

const date = new Date().toISOString().slice(0, 10);
const status = m.freshness_status;

const lines = [
  `# Santé calendrier vtt.bzh — ${date}`,
  '',
  `## Statut : ${status}`,
  '',
  '## Métriques',
  '',
  `| Signal | Valeur |`,
  `| --- | --- |`,
  `| events_30d | ${m.events_30d} |`,
  `| events_90d | ${m.events_90d} |`,
  `| events_365d | ${m.events_365d} |`,
  `| public_form_30d | ${m.public_form_30d} |`,
  `| public_form_90d | ${m.public_form_90d} |`,
  `| days_until_next_event | ${m.days_until_next_event ?? 'n/a'} |`,
  `| departments_90d | ${m.departments_90d} |`,
  '',
  '## Lecture',
];

if (status === 'RISK') {
  lines.push('- RISK : aucune rando active dans les 30 prochains jours, ou trou > 30 jours. Action immédiate requise.');
} else if (status === 'WATCH') {
  lines.push('- WATCH : couverture présente mais public_form_90d = 0 ou départements < 3. Surveiller activation organisateurs.');
} else {
  lines.push('- OK : calendrier vivant, contributions organisateurs actives, couverture régionale suffisante.');
}

if (m.public_form_90d === 0) {
  lines.push('- ALERTE : aucune contribution organisateur via formulaire public sur 90 jours (public_form_90d = 0).');
}

const report = lines.join('\n') + '\n';

console.log(report);

const outDir = join(process.cwd(), 'logs', 'calendar-health');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${date}.md`);
writeFileSync(outFile, report);
console.log(`[health] rapport écrit : ${outFile}`);
