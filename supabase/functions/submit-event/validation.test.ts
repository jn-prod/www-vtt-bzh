import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSubmission } from './validation.ts';

const now = new Date('2026-08-19T10:00:00Z');
const validPayload = {
  name: 'Rando des bois',
  date: '2026-09-20',
  hour: '8h30',
  city: 'Pontivy',
  departement: 56,
  place: 'Place du marché',
  organisateur: 'Club VTT',
  price: '5 €',
  website: 'https://example.org/inscription',
  email: 'club@example.org',
  phone: '06 12 34 56 78',
  description: 'Deux parcours balisés.',
  consent: true,
  website_url: '',
};

test('accepte et normalise une soumission publique complète', () => {
  const result = validateSubmission(validPayload, now);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.name, 'Rando des bois');
    assert.equal(result.value.website, 'https://example.org/inscription');
    assert.equal('active' in result.value, false);
  }
});

test('refuse les champs système ou inconnus', () => {
  const result = validateSubmission({ ...validPayload, active: true }, now);
  assert.deepEqual(result, {
    ok: false,
    fields: { payload: 'Le contenu contient un champ non autorisé.' },
  });
});

test('refuse une date passée, à J+366 ou impossible', () => {
  for (const date of ['2026-08-18', '2027-08-20', '2026-02-30']) {
    const result = validateSubmission({ ...validPayload, date }, now);
    assert.equal(result.ok, false, date);
    if (!result.ok) assert.ok(result.fields.date, date);
  }
});

test('refuse les départements, protocoles et contrôles non autorisés', () => {
  const result = validateSubmission(
    {
      ...validPayload,
      departement: 75,
      website: 'javascript:alert(1)',
      description: 'Texte\u0000caché',
    },
    now
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.fields.departement);
    assert.ok(result.fields.website);
    assert.ok(result.fields.description);
  }
});

test('exige lieu, contact public et consentement', () => {
  const result = validateSubmission({ ...validPayload, place: '', email: '', consent: false }, now);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.fields.place);
    assert.ok(result.fields.email);
    assert.ok(result.fields.consent);
  }
});

test('refuse les types détournés au lieu de les convertir en texte', () => {
  const result = validateSubmission(
    {
      ...validPayload,
      name: { texte: 'Rando injectée' },
      city: ['Pontivy'],
      departement: '56',
    },
    now
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.fields.name);
    assert.ok(result.fields.city);
    assert.ok(result.fields.departement);
  }
});
