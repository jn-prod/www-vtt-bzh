export const EVENT_FIELDS = [
  'name',
  'date',
  'hour',
  'city',
  'departement',
  'place',
  'organisateur',
  'price',
  'website',
  'email',
  'phone',
  'description',
  'consent',
  'website_url',
] as const;

type EventField = (typeof EVENT_FIELDS)[number];

export type EventSubmission = {
  name: string;
  date: string;
  hour: string;
  city: string;
  departement: number;
  place: string;
  organisateur: string;
  price?: string;
  website?: string;
  email: string;
  phone?: string;
  description?: string;
};

export type ValidationResult =
  { ok: true; value: EventSubmission } | { ok: false; fields: Partial<Record<EventField | 'payload', string>> };

const LIMITS: Record<Exclude<EventField, 'consent' | 'website_url' | 'departement' | 'date'>, number> = {
  name: 120,
  hour: 40,
  city: 80,
  place: 120,
  organisateur: 120,
  price: 40,
  website: 200,
  email: 120,
  phone: 30,
  description: 2000,
};

const REQUIRED = ['name', 'date', 'hour', 'city', 'departement', 'place', 'organisateur', 'email'] as const;
const TEXT_FIELDS = EVENT_FIELDS.filter((field) => !['consent', 'departement'].includes(field));
const DEPARTEMENTS = new Set([22, 29, 35, 44, 56]);
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

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

const normalize = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/gu, ' ')
    .trim()
    .normalize('NFC');

const isRealISODate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const validateSubmission = (payload: unknown, now = new Date()): ValidationResult => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, fields: { payload: 'Le contenu envoyé est invalide.' } };
  }

  const source = payload as Record<string, unknown>;
  const allowed = new Set<string>(EVENT_FIELDS);
  if (Object.keys(source).some((key) => !allowed.has(key))) {
    return { ok: false, fields: { payload: 'Le contenu contient un champ non autorisé.' } };
  }

  const fields: Partial<Record<EventField | 'payload', string>> = {};
  for (const field of TEXT_FIELDS) {
    if (source[field] !== undefined && typeof source[field] !== 'string') {
      fields[field] = 'Ce champ doit contenir du texte.';
    }
  }
  if (source.departement !== undefined && typeof source.departement !== 'number') {
    fields.departement = 'Le département est invalide.';
  }
  const values = Object.fromEntries(
    EVENT_FIELDS.filter((field) => !['consent', 'departement'].includes(field)).map((field) => [
      field,
      normalize(source[field]),
    ])
  ) as Record<Exclude<EventField, 'consent' | 'departement'>, string>;

  if (values.website_url) fields.website_url = 'Envoi rejeté.';
  if (source.consent !== true) fields.consent = 'Le consentement est requis pour publier ces informations.';

  for (const field of REQUIRED) {
    if (field === 'departement') continue;
    if (!values[field]) fields[field] = 'Ce champ est requis.';
  }

  for (const [field, limit] of Object.entries(LIMITS) as Array<[keyof typeof LIMITS, number]>) {
    const raw = source[field];
    const value = values[field];
    if (typeof raw === 'string' && CONTROL_CHARACTERS.test(raw)) {
      fields[field] = 'Ce champ contient un caractère non autorisé.';
    } else if (value.length > limit) {
      fields[field] = `Ce champ est limité à ${limit} caractères.`;
    }
  }

  const departement = Number(source.departement);
  if (!DEPARTEMENTS.has(departement)) fields.departement = 'Choisissez un département proposé.';

  const today = parisDate(now);
  if (!isRealISODate(values.date)) {
    fields.date = 'La date est invalide.';
  } else if (values.date < today || values.date > addDays(today, 365)) {
    fields.date = "La date doit être comprise entre aujourd'hui et les 365 prochains jours.";
  }

  if (values.email && !EMAIL.test(values.email)) fields.email = "L'adresse email est invalide.";

  if (values.website) {
    try {
      const url = new URL(values.website);
      if (!['http:', 'https:'].includes(url.protocol))
        fields.website = "L'adresse doit commencer par http:// ou https://.";
      else values.website = url.toString();
    } catch {
      fields.website = "L'adresse du site est invalide.";
    }
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };

  return {
    ok: true,
    value: {
      name: values.name,
      date: values.date,
      hour: values.hour,
      city: values.city,
      departement,
      place: values.place,
      organisateur: values.organisateur,
      email: values.email,
      ...(values.price && { price: values.price }),
      ...(values.website && { website: values.website }),
      ...(values.phone && { phone: values.phone }),
      ...(values.description && { description: values.description }),
    },
  };
};
