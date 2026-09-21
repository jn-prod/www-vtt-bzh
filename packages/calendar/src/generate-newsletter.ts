import 'dotenv/config';

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import { createClient } from 'repository';
import { duplicateKey, normalizeEvents, type PublicCalendarEvent, type RawCalendarEvent } from './normalize-events';

const MAX_EVENTS = 200;
const NEW_EVENT_DAYS = 35;
const PROJECT_ROOT = join(__dirname, '..', '..', '..');
export const DEFAULT_NEWSLETTER_TEMPLATE = join(__dirname, '..', 'templates', 'newsletter.md');
export const DEFAULT_NEWSLETTER_DRAFTS_DIR = join(PROJECT_ROOT, '_drafts');

type NewsletterSourceEvent = RawCalendarEvent & {
  active?: boolean;
  created_at?: string;
};

type NewsletterEvents = {
  agenda: PublicCalendarEvent[];
  newEvents: PublicCalendarEvent[];
};

export const parisDate = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const escapeMarkdown = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/([\\`*_[\]<>])/gu, '\\$1');

const longDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  }).format(new Date(`${isoDate}T12:00:00Z`));

const shortDate = (isoDate: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(`${isoDate}T12:00:00Z`));

const shortDay = (isoDate: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(`${isoDate}T12:00:00Z`));

const monthYear = (isoDate: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  }).format(new Date(`${isoDate}T12:00:00Z`));

const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  count > 1 ? pluralForm : singular;

const eventLine = (event: PublicCalendarEvent): string => {
  const title = escapeMarkdown(event.name);
  const location = `${escapeMarkdown(event.city)} (${event.departement})`;
  return `- **${title}** — ${shortDay(event.date)} · ${location}`;
};

const eventLineWithDate = (event: PublicCalendarEvent): string =>
  `- **${escapeMarkdown(event.name)}** — ${longDate(event.date)} · ${escapeMarkdown(event.city)} (${event.departement})`;

type AgendaGroup = {
  key: string;
  label: string;
  events: PublicCalendarEvent[];
};

const weekendKey = (isoDate: string): string => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const groupAgenda = (agenda: PublicCalendarEvent[]): AgendaGroup[] => {
  const groups = new Map<string, PublicCalendarEvent[]>();
  for (const event of agenda) {
    const key = [0, 6].includes(new Date(`${event.date}T12:00:00Z`).getUTCDay()) ? weekendKey(event.date) : event.date;
    const events = groups.get(key) ?? [];
    events.push(event);
    groups.set(key, events);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, events]) => {
      const dates = [...new Set(events.map((event) => event.date))].sort();
      const lastDate = dates[dates.length - 1];
      const isWeekend = new Date(`${key}T12:00:00Z`).getUTCDay() === 6;
      const sameMonth = key.slice(0, 7) === lastDate.slice(0, 7);
      const label = isWeekend
        ? lastDate === key
          ? `Week-end du ${shortDate(key)}`
          : sameMonth
            ? `Week-end des ${new Date(`${key}T12:00:00Z`).getUTCDate()} et ${new Date(`${lastDate}T12:00:00Z`).getUTCDate()} ${monthYear(key)}`
            : `Week-end du ${shortDate(key)} au ${shortDate(lastDate)}`
        : `Le ${longDate(key)}`;
      return { key, label, events };
    });
};

const departmentCounts = (events: PublicCalendarEvent[]): string => {
  const counts = new Map<number, number>();
  for (const event of events) counts.set(event.departement, (counts.get(event.departement) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([departement, count]) => `**${departement}** : ${count}`)
    .join(' · ');
};

export const renderTemplate = (
  template: string,
  variables: Record<string, string>,
  sections: Record<string, boolean>
): string => {
  const sectionPattern = /@@IF_([A-Z][A-Z0-9_]*)@@([\s\S]*?)@@END_\1@@/gu;
  const withSections = template.replace(sectionPattern, (_match, name: string, content: string) => {
    if (!(name in sections)) throw new Error(`Section inconnue dans le template : ${name}.`);
    return sections[name] ? content : '';
  });
  const unresolvedSection = withSections.match(/@@(?:IF_|END_)([A-Z][A-Z0-9_]*)@@/u);
  if (unresolvedSection) throw new Error(`Section invalide dans le template : ${unresolvedSection[1]}.`);

  const placeholders = new Set([...withSections.matchAll(/@@([A-Z][A-Z0-9_]*)@@/gu)].map((match) => match[1]));
  for (const placeholder of placeholders) {
    if (!(placeholder in variables)) throw new Error(`Variable inconnue dans le template : ${placeholder}.`);
  }
  const rendered = withSections.replace(/@@([A-Z][A-Z0-9_]*)@@/gu, (_match, name: string) => variables[name]);
  return rendered.endsWith('\n') ? rendered : `${rendered}\n`;
};

const validateBriefContract = (markdown: string, start: string, end: string): void => {
  const requiredLines = [`source_id: vtt-bzh-${start}_${end}`, 'source: calendrier-vtt-bzh', '## Agenda par week-end'];
  for (const line of requiredLines) {
    if (!markdown.includes(line)) throw new Error(`Contrat absent du brief rendu : ${line}.`);
  }
};

export const renderNewsletter = ({
  start,
  end,
  generatedAt,
  generatedAtIso = `${generatedAt}T12:00:00.000Z`,
  agenda,
  newEvents,
  template = readFileSync(DEFAULT_NEWSLETTER_TEMPLATE, 'utf8'),
}: {
  start: string;
  end: string;
  generatedAt: string;
  generatedAtIso?: string;
  agenda: PublicCalendarEvent[];
  newEvents: PublicCalendarEvent[];
  template?: string;
}): string => {
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) throw new Error('Les dates doivent être au format YYYY-MM-DD.');
  if (start > end) throw new Error('La date de début doit précéder la date de fin.');
  if (agenda.length === 0) throw new Error('Aucune rando dans la fenêtre demandée : édition non créée.');

  const agendaKeys = new Set(agenda.map(duplicateKey));
  const newAgenda = newEvents.filter((event) => agendaKeys.has(duplicateKey(event)));
  const agendaGroups = groupAgenda(agenda)
    .map((group) => `### ${group.label}\n\n${group.events.map(eventLine).join('\n')}`)
    .join('\n\n');
  const markdown = renderTemplate(
    template,
    {
      TITLE: `du ${shortDate(start)} au ${shortDate(end)}`,
      GENERATED_AT: generatedAt,
      GENERATED_AT_ISO: generatedAtIso,
      START: start,
      END: end,
      AGENDA_COUNT: String(agenda.length),
      AGENDA_LABEL: plural(agenda.length, 'rando'),
      DEPARTMENT_COUNTS: departmentCounts(agenda),
      NEW_COUNT: String(newAgenda.length),
      NEW_LABEL: plural(newAgenda.length, 'nouvelle rando', 'nouvelles randos'),
      AGENDA_GROUPS: agendaGroups,
      NEW_EVENT_LINES: newAgenda.map(eventLineWithDate).join('\n'),
    },
    { HAS_NEW_EVENTS: newAgenda.length > 0 }
  );
  validateBriefContract(markdown, start, end);
  return markdown;
};

export const normalizeNewsletterEvents = ({
  agenda,
  newEvents,
}: {
  agenda: NewsletterSourceEvent[];
  newEvents: NewsletterSourceEvent[];
}): NewsletterEvents => ({
  agenda: normalizeEvents(agenda).events,
  newEvents: normalizeEvents(newEvents).events,
});

const loadNewsletterEvents = async ({
  start,
  end,
  generatedAt,
}: {
  start: string;
  end: string;
  generatedAt: string;
}): Promise<NewsletterEvents> => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_KEY;
  const table = process.env.SUPABASE_TABLE;
  if (!url || !key || !table) {
    throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_KEY) et SUPABASE_TABLE sont requis.');
  }

  const db = createClient(url, key);
  const projection = 'date,name,city,departement,hour,price,canceled,active,created_at';
  const lastNewEventDate = new Date(`${generatedAt}T12:00:00Z`);
  lastNewEventDate.setUTCDate(lastNewEventDate.getUTCDate() - NEW_EVENT_DAYS);

  const agendaQuery = db
    .from(table)
    .select(projection)
    .eq('active', true)
    .or('canceled.is.false,canceled.is.null')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .limit(MAX_EVENTS);
  const newEventsQuery = db
    .from(table)
    .select(projection)
    .eq('active', true)
    .or('canceled.is.false,canceled.is.null')
    .gte('date', start)
    .lte('date', end)
    .gte('created_at', lastNewEventDate.toISOString())
    .order('date', { ascending: true })
    .limit(MAX_EVENTS);

  const [agendaResult, newEventsResult] = await Promise.all([agendaQuery, newEventsQuery]);
  if (agendaResult.error) throw new Error(`Supabase agenda : ${agendaResult.error.message}`);
  if (newEventsResult.error) throw new Error(`Supabase nouveautés : ${newEventsResult.error.message}`);

  return normalizeNewsletterEvents({
    agenda: (agendaResult.data ?? []) as NewsletterSourceEvent[],
    newEvents: (newEventsResult.data ?? []) as NewsletterSourceEvent[],
  });
};

const parseArgs = (): Record<string, string | true> =>
  Object.fromEntries(
    process.argv.slice(2).map((argument) => {
      const separator = argument.indexOf('=');
      return separator === -1
        ? [argument.replace(/^--/u, ''), true]
        : [argument.slice(2, separator), argument.slice(separator + 1)];
    })
  );

export type NewsletterDraftResult = {
  status: 'created' | 'updated';
  path: string;
};

export const saveNewsletterDraft = ({
  draftsDirectory,
  start,
  end,
  markdown,
  update,
}: {
  draftsDirectory: string;
  start: string;
  end: string;
  markdown: string;
  update: boolean;
}): NewsletterDraftResult => {
  mkdirSync(draftsDirectory, { recursive: true });
  const sourceId = `source_id: vtt-bzh-${start}_${end}`;
  const duplicate = readdirSync(draftsDirectory).find((name) => {
    const path = join(draftsDirectory, name);
    return name.endsWith('.md') && readFileSync(path, 'utf8').split('\n').includes(sourceId);
  });

  if (duplicate) {
    const output = join(draftsDirectory, duplicate);
    if (!update)
      throw new Error(
        `La fenêtre ${start} → ${end} existe déjà dans ${duplicate}. Utiliser --update pour la régénérer.`
      );
    writeFileSync(output, markdown, 'utf8');
    return { status: 'updated', path: output };
  }

  const filename = `${start}_${end}-la-sortie.md`;
  const output = join(draftsDirectory, filename);
  if (existsSync(output)) throw new Error(`${filename} existe déjà.`);
  writeFileSync(output, markdown, { encoding: 'utf8', flag: 'wx' });
  return { status: 'created', path: output };
};

const main = async (): Promise<void> => {
  const args = parseArgs();
  const start = typeof args.start === 'string' ? args.start : '';
  const end = typeof args.end === 'string' ? args.end : '';
  if (!start || !end) throw new Error('Les paramètres --start=YYYY-MM-DD et --end=YYYY-MM-DD sont requis.');
  if (!isValidIsoDate(start) || !isValidIsoDate(end)) throw new Error('Les dates doivent être au format YYYY-MM-DD.');
  if (start > end) throw new Error('La date de début doit précéder la date de fin.');

  const now = new Date();
  const generatedAt = parisDate(now);
  const events = await loadNewsletterEvents({ start, end, generatedAt });
  const requestedTemplate = typeof args.template === 'string' ? args.template : DEFAULT_NEWSLETTER_TEMPLATE;
  const templatePath = isAbsolute(requestedTemplate) ? requestedTemplate : join(PROJECT_ROOT, requestedTemplate);
  const template = readFileSync(templatePath, 'utf8');
  const markdown = renderNewsletter({
    start,
    end,
    generatedAt,
    generatedAtIso: now.toISOString(),
    template,
    ...events,
  });

  if (args.stdout === true) {
    process.stdout.write(markdown);
    return;
  }

  const result = saveNewsletterDraft({
    draftsDirectory: process.env.NEWSLETTER_DRAFTS_DIR ?? DEFAULT_NEWSLETTER_DRAFTS_DIR,
    start,
    end,
    markdown,
    update: args.update === true,
  });
  console.log(`[newsletter] brief ${result.status === 'created' ? 'créé' : 'mis à jour'} : ${result.path}`);
  console.log(
    '[newsletter] sélectionner et contextualiser cette matière dans le Markdown La Sortie de nicolasjouanno.com, puis relire avant tout envoi manuel dans Kit.'
  );
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`[newsletter] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
