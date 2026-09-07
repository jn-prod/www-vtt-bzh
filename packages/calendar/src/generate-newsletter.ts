import 'dotenv/config';

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

import { createClient } from 'repository';
import { duplicateKey, normalizeEvents, type PublicCalendarEvent, type RawCalendarEvent } from './normalize-events';

const MAX_EVENTS = 200;
const HORIZON_DAYS = 35;
const NEW_EVENT_DAYS = 35;
const PROJECT_ROOT = join(__dirname, '..', '..', '..');
export const DEFAULT_NEWSLETTER_TEMPLATE = join(__dirname, '..', 'templates', 'newsletter.md');

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

export const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const monthLabel = (period: string): string =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(
    new Date(`${period}-15T12:00:00Z`)
  );

const nextMonth = (period: string): string => {
  const date = new Date(`${period}-15T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1, 1);
  return date.toISOString().slice(0, 10);
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

const plural = (count: number, singular: string, pluralForm = `${singular}s`): string =>
  count > 1 ? pluralForm : singular;

const eventLine = (event: PublicCalendarEvent, isNew: boolean): string => {
  const title = `${longDate(event.date)} — ${escapeMarkdown(event.name)}${isNew ? ' — nouveau' : ''}`;
  const location = `${escapeMarkdown(event.city)} (${event.departement})`;
  const details = [event.hour, event.price].filter(Boolean).map(escapeMarkdown).join(' · ');
  return `- **${title}**  \n  ${location}${details ? ` · ${details}` : ''}`;
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

const validateDraftContract = (markdown: string, period: string): void => {
  const requiredLines = [
    'layout: newsletter-edition',
    `newsletter_id: vtt-bzh-${period}`,
    `permalink: /newsletter/${period}/`,
    'sent: false',
    'published: false',
  ];
  for (const line of requiredLines) {
    if (!markdown.split('\n').includes(line)) throw new Error(`Contrat absent du template rendu : ${line}.`);
  }
};

export const renderNewsletter = ({
  period,
  generatedAt,
  generatedAtIso = `${generatedAt}T12:00:00.000Z`,
  agenda,
  newEvents,
  template = readFileSync(DEFAULT_NEWSLETTER_TEMPLATE, 'utf8'),
}: {
  period: string;
  generatedAt: string;
  generatedAtIso?: string;
  agenda: PublicCalendarEvent[];
  newEvents: PublicCalendarEvent[];
  template?: string;
}): string => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/u.test(period)) throw new Error('La période doit être au format YYYY-MM.');
  if (agenda.length === 0) throw new Error('Aucune rando dans les cinq prochaines semaines : édition non créée.');

  const agendaKeys = new Set(agenda.map(duplicateKey));
  const newKeys = new Set(newEvents.map(duplicateKey));
  const later = newEvents.filter((event) => !agendaKeys.has(duplicateKey(event)));
  const newCount = agenda.filter((event) => newKeys.has(duplicateKey(event))).length + later.length;
  const label = monthLabel(period);
  const description = `${agenda.length} ${plural(agenda.length, 'rando')} à venir dans les cinq prochaines semaines${
    newCount ? `, dont ${newCount} ${plural(newCount, 'nouvelle')}` : ''
  }.`;
  const agendaLines = agenda.map((event) => eventLine(event, newKeys.has(duplicateKey(event)))).join('\n');
  const markdown = renderTemplate(
    template,
    {
      TITLE: JSON.stringify(`Randos VTT Bretagne — ${label}`),
      DESCRIPTION: JSON.stringify(description),
      GENERATED_AT: generatedAt,
      GENERATED_AT_ISO: generatedAtIso,
      PERIOD: period,
      PERIOD_END: nextMonth(period),
      AGENDA_COUNT: String(agenda.length),
      AGENDA_LABEL: plural(agenda.length, 'rando'),
      AGENDA_LINES: agendaLines,
      LATER_LINES: later.map((event) => eventLine(event, true)).join('\n'),
    },
    { HAS_LATER: later.length > 0 }
  );
  validateDraftContract(markdown, period);
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

const loadNewsletterEvents = async (today: string): Promise<NewsletterEvents> => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_KEY;
  const table = process.env.SUPABASE_TABLE;
  if (!url || !key || !table) {
    throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_KEY) et SUPABASE_TABLE sont requis.');
  }

  const db = createClient(url, key);
  const projection = 'date,name,city,departement,hour,price,canceled,active,created_at';
  const lastNewEventDate = new Date(`${today}T12:00:00Z`);
  lastNewEventDate.setUTCDate(lastNewEventDate.getUTCDate() - NEW_EVENT_DAYS);

  const agendaQuery = db
    .from(table)
    .select(projection)
    .eq('active', true)
    .or('canceled.is.false,canceled.is.null')
    .gte('date', today)
    .lt('date', addDays(today, HORIZON_DAYS))
    .order('date', { ascending: true })
    .limit(MAX_EVENTS);
  const newEventsQuery = db
    .from(table)
    .select(projection)
    .eq('active', true)
    .or('canceled.is.false,canceled.is.null')
    .gte('date', today)
    .lt('date', addDays(today, 365))
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
  status: 'created' | 'updated' | 'finalized';
  path: string;
};

export const saveNewsletterDraft = ({
  postsDirectory,
  period,
  generatedAt,
  markdown,
  update,
}: {
  postsDirectory: string;
  period: string;
  generatedAt: string;
  markdown: string;
  update: boolean;
}): NewsletterDraftResult => {
  mkdirSync(postsDirectory, { recursive: true });
  const newsletterId = `newsletter_id: vtt-bzh-${period}`;
  const duplicate = readdirSync(postsDirectory).find((name) => {
    const path = join(postsDirectory, name);
    return name.endsWith('.md') && readFileSync(path, 'utf8').split('\n').includes(newsletterId);
  });

  if (duplicate) {
    const output = join(postsDirectory, duplicate);
    const existing = readFileSync(output, 'utf8');
    const isDraft = existing.split('\n').includes('sent: false') && existing.split('\n').includes('published: false');
    if (!isDraft) return { status: 'finalized', path: output };
    if (!update)
      throw new Error(`L’édition ${period} existe déjà dans ${duplicate}. Utiliser --update pour la régénérer.`);
    writeFileSync(output, markdown, 'utf8');
    return { status: 'updated', path: output };
  }

  const filename = `${generatedAt}-agenda-vtt-bretagne-${period}.md`;
  const output = join(postsDirectory, filename);
  if (existsSync(output)) throw new Error(`${filename} existe déjà.`);
  writeFileSync(output, markdown, { encoding: 'utf8', flag: 'wx' });
  return { status: 'created', path: output };
};

const main = async (): Promise<void> => {
  const args = parseArgs();
  const now = typeof args.date === 'string' ? new Date(`${args.date}T12:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error('La date doit être au format YYYY-MM-DD.');
  const generatedAt = parisDate(now);
  const period = typeof args.period === 'string' ? args.period : generatedAt.slice(0, 7);
  const events = await loadNewsletterEvents(generatedAt);
  const requestedTemplate = typeof args.template === 'string' ? args.template : DEFAULT_NEWSLETTER_TEMPLATE;
  const templatePath = isAbsolute(requestedTemplate) ? requestedTemplate : join(PROJECT_ROOT, requestedTemplate);
  const template = readFileSync(templatePath, 'utf8');
  const markdown = renderNewsletter({ period, generatedAt, generatedAtIso: now.toISOString(), template, ...events });

  if (args.stdout === true) {
    process.stdout.write(markdown);
    return;
  }

  const result = saveNewsletterDraft({
    postsDirectory: join(PROJECT_ROOT, 'www', '_posts'),
    period,
    generatedAt,
    markdown,
    update: args.update === true,
  });
  if (result.status === 'finalized') {
    console.log(`[newsletter] édition ${period} déjà finalisée : ${result.path}. Aucun contenu écrasé.`);
    return;
  }
  console.log(`[newsletter] brouillon ${result.status === 'created' ? 'créé' : 'mis à jour'} : ${result.path}`);
  console.log(
    '[newsletter] relire, copier dans Kit, envoyer, puis passer sent et published à true avant publication Git.'
  );
};

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(`[newsletter] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
