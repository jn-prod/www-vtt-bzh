import type { CalendarEvent } from './types';
import { createHash } from 'node:crypto';

export type RawCalendarEvent = Omit<Partial<CalendarEvent>, 'date'> & {
  date?: Date | string;
  id?: string;
};

export type PublicCalendarEvent = {
  id: string;
  date: string;
  dateFormatted: string;
  name: string;
  city: string;
  departement: number;
  hour?: string;
  website?: string;
  place?: string;
  organisateur?: string;
  price?: string;
  email?: string;
  phone?: string;
  description?: string;
  canceled: boolean;
};

type NormalizedCalendarEvent = PublicCalendarEvent & {
  origin?: string;
};

export type CalendarHealth = {
  fetched: number;
  published: number;
  invalid: number;
  duplicates: number;
  repaired: number;
  missing: Record<string, number>;
  origins: Record<string, number>;
};

const DEPARTEMENTS = new Set([22, 29, 35, 44, 56]);
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â.|\u0080|\u0091|\u0092|\u0093|\u0094|\u0096|\u0097)/g;

const REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['â‚¬', '€'],
  ['â€™', '’'],
  ['â€˜', '‘'],
  ['â€œ', '“'],
  ['â€', '”'],
  ['â€“', '–'],
  ['â€”', '—'],
  ['â¬', '€'],
  ['â', '’'],
  ['â', '‘'],
  ['â', '“'],
  ['â', '”'],
  ['â', '–'],
  ['â', '—'],
  ['Ã©', 'é'],
  ['Ã¨', 'è'],
  ['Ãª', 'ê'],
  ['Ã«', 'ë'],
  ['Ã ', 'à'],
  ['Ã¢', 'â'],
  ['Ã®', 'î'],
  ['Ã¯', 'ï'],
  ['Ã´', 'ô'],
  ['Ã¶', 'ö'],
  ['Ã¹', 'ù'],
  ['Ã»', 'û'],
  ['Ã¼', 'ü'],
  ['Ã§', 'ç'],
  ['Ã‰', 'É'],
  ['Â°', '°'],
  ['Â', ''],
  ['\u0080', '€'],
  ['\u0091', '‘'],
  ['\u0092', '’'],
  ['\u0093', '“'],
  ['\u0094', '”'],
  ['\u0096', '–'],
  ['\u0097', '—'],
];

const markerCount = (value: string): number => value.match(MOJIBAKE_MARKERS)?.length ?? 0;

export const repairMojibake = (value: string): { value: string; repaired: boolean } => {
  let repairedValue = value;
  for (const [from, to] of REPLACEMENTS) repairedValue = repairedValue.split(from).join(to);
  const repaired = repairedValue !== value && markerCount(repairedValue) < markerCount(value);
  return { value: repaired ? repairedValue : value, repaired };
};

const normalizeWhitespace = (value: string): string =>
  value.replace(CONTROL_CHARACTERS, '').replace(/\s+/gu, ' ').trim().normalize('NFC');

const normalizeText = (value: unknown): { value: string; repaired: boolean } => {
  const repaired = repairMojibake(String(value ?? ''));
  return { value: normalizeWhitespace(repaired.value), repaired: repaired.repaired };
};

const normalizeName = (value: unknown): { value: string; repaired: boolean } => {
  const normalized = normalizeText(value);
  return {
    ...normalized,
    value: normalized.value.replace(/(?:\s+|^)(?:19|20)\d{2}$/u, '').trim(),
  };
};

const normalizeHour = (value: unknown): { value: string; repaired: boolean } => {
  const normalized = normalizeText(value);
  const match = normalized.value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/u);
  return {
    ...normalized,
    value: match ? `${Number(match[1])}h${match[2]}` : normalized.value,
  };
};

const normalizePrice = (value: unknown): { value: string; repaired: boolean } => {
  const normalized = normalizeText(value);
  return {
    ...normalized,
    value: normalized.value
      .replace(/\s*(?:euros?)\s*$/iu, ' €')
      .replace(/\s*€\s*$/u, ' €')
      .trim(),
  };
};

const normalizeDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/u);
  return match?.[1] ?? '';
};

export const normalizeWebsite = (value: unknown): string | undefined => {
  let normalized = normalizeText(value).value;
  if (!normalized) return undefined;
  if (/^(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:[/?#]|$)/iu.test(normalized)) normalized = `https://${normalized}`;
  try {
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const comparable = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim();

export const duplicateKey = (event: Pick<PublicCalendarEvent, 'date' | 'city' | 'name'>): string =>
  `${event.date}|${comparable(event.city)}|${comparable(event.name)}`;

const slugify = (value: string): string =>
  comparable(value).replace(/\s+/gu, '-').replace(/^-|-$/gu, '').slice(0, 72) || 'rando';

const richness = (event: NormalizedCalendarEvent): number =>
  event.name.length * 10 +
  [
    event.city,
    event.hour,
    event.place,
    event.organisateur,
    event.price,
    event.website,
    event.email,
    event.phone,
    event.description,
  ].filter(Boolean).length;

const toOptional = (value: { value: string; repaired: boolean }): string | undefined => value.value || undefined;

const normalizeOne = (raw: RawCalendarEvent): { event?: NormalizedCalendarEvent; repaired: boolean } => {
  const date = normalizeDate(raw.date);
  const name = normalizeName(raw.name);
  const city = normalizeText(raw.city);
  const departement = Number(raw.departement);
  const hour = normalizeHour(raw.hour);
  const place = normalizeText(raw.place);
  const organisateur = normalizeText(raw.organisateur);
  const price = normalizePrice(raw.price);
  const email = normalizeText(raw.email);
  const phone = normalizeText(raw.phone);
  const description = normalizeText(raw.description);
  const origin = normalizeText(raw.origin);
  const website = normalizeWebsite(raw.website);

  const repaired = [name, city, hour, place, organisateur, price, email, phone, description, origin].some(
    (field) => field.repaired
  );

  if (!date || !name.value || !city.value || !DEPARTEMENTS.has(departement)) return { repaired };

  const identity = `${date}|${departement}|${comparable(city.value)}|${comparable(name.value)}`;
  const identityHash = createHash('sha256').update(identity).digest('hex').slice(0, 10);
  const event: NormalizedCalendarEvent = {
    id: `event-${date}-${departement}-${slugify(city.value)}-${slugify(name.value)}-${identityHash}`,
    date,
    dateFormatted: new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeZone: 'Europe/Paris',
    }).format(new Date(`${date}T12:00:00Z`)),
    name: name.value,
    city: city.value,
    departement,
    canceled: raw.canceled === true,
  };

  const optionalFields = {
    hour: toOptional(hour),
    place: toOptional(place),
    organisateur: toOptional(organisateur),
    price: toOptional(price),
    website,
    email: toOptional(email),
    phone: toOptional(phone),
    description: toOptional(description),
    origin: toOptional(origin),
  };

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value) Object.assign(event, { [key]: value });
  }

  return { event, repaired };
};

export const normalizeEvents = (
  rawEvents: RawCalendarEvent[]
): { events: PublicCalendarEvent[]; health: CalendarHealth; duplicateGroups: string[] } => {
  const normalized = rawEvents.map(normalizeOne);
  const valid = normalized.flatMap(({ event }) => (event ? [event] : []));
  const byKey = new Map<string, NormalizedCalendarEvent>();
  const duplicateGroups: string[] = [];

  for (const event of valid) {
    const key = duplicateKey(event);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, event);
      continue;
    }
    duplicateGroups.push(`${event.date} · ${event.city} · ${event.name}`);
    if (richness(event) > richness(current)) byKey.set(key, event);
  }

  const normalizedEvents = [...byKey.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
  );
  const missingFields = ['hour', 'place', 'organisateur', 'price', 'website', 'email', 'phone', 'description'] as const;
  const missing = Object.fromEntries(
    missingFields.map((field) => [field, normalizedEvents.filter((event) => !event[field]).length])
  );
  const origins = normalizedEvents.reduce<Record<string, number>>((acc, event) => {
    const origin = event.origin?.split('/')[0] || 'inconnue';
    acc[origin] = (acc[origin] ?? 0) + 1;
    return acc;
  }, {});
  const events: PublicCalendarEvent[] = normalizedEvents.map((event) => {
    const publicEvent = { ...event };
    delete publicEvent.origin;
    return publicEvent;
  });

  return {
    events,
    duplicateGroups,
    health: {
      fetched: rawEvents.length,
      published: normalizedEvents.length,
      invalid: normalized.filter(({ event }) => !event).length,
      duplicates: valid.length - normalizedEvents.length,
      repaired: normalized.filter(({ repaired }) => repaired).length,
      missing,
      origins,
    },
  };
};
