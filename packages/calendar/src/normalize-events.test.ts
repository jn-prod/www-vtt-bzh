import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateKey, normalizeEvents, normalizeWebsite, repairMojibake } from './normalize-events';

const event = (overrides: Record<string, unknown> = {}) => ({
  date: '2026-09-20',
  name: 'La Rando 2026',
  city: 'Pontivy',
  departement: 56,
  hour: '08:30:00',
  place: 'Place du marché',
  organisateur: 'Club VTT',
  email: 'club@example.org',
  lock: false,
  ...overrides,
});

test('normalise les champs publics sans réécriture éditoriale', () => {
  const { events, health } = normalizeEvents([
    event({ name: '  Rando dâ\u0080\u0099automne 2026  ', price: '5 EUROS', website: 'https://example.org/a' }),
  ]);

  assert.equal(events.length, 1);
  assert.equal(events[0].name, 'Rando d’automne');
  assert.equal(events[0].hour, '8h30');
  assert.equal(events[0].price, '5 €');
  assert.equal(events[0].website, 'https://example.org/a');
  assert.match(events[0].id, /^event-2026-09-20-56-/u);
  assert.equal(health.repaired, 1);
});

test('écarte les événements legacy sans minimum publiable', () => {
  const { events, health } = normalizeEvents([event({ name: '2026' }), event({ city: '' }), event()]);
  assert.equal(events.length, 1);
  assert.equal(health.invalid, 2);
});

test('fusionne uniquement date, ville et nom normalisés identiques', () => {
  const a = event({ name: 'La Staobinaise 2026', city: 'Plouarzel', description: '' });
  const b = event({ name: 'la staobinaise', city: 'PLOUARZEL', description: 'Parcours balisé' });
  const distinct = event({ name: 'Raid de Penguily', city: 'Plouarzel' });
  const { events, health } = normalizeEvents([a, b, distinct]);

  assert.equal(events.length, 2);
  assert.equal(health.duplicates, 1);
  assert.equal(events.find((item) => duplicateKey(item).includes('staobinaise'))?.description, 'Parcours balisé');
});

test('ne rend cliquables que les URL HTTP(S)', () => {
  assert.equal(normalizeWebsite('javascript:alert(1)'), undefined);
  assert.equal(normalizeWebsite('mailto:test@example.org'), undefined);
  assert.equal(normalizeWebsite('https://example.org'), 'https://example.org/');
  assert.equal(normalizeWebsite('www.example.org/inscription'), 'https://www.example.org/inscription');
  assert.equal(normalizeWebsite('page facebook : mon club'), undefined);
});

test('répare seulement les séquences mojibake reconnues', () => {
  assert.deepEqual(repairMojibake('CafÃ©'), { value: 'Café', repaired: true });
  assert.deepEqual(repairMojibake('Déjà correct'), { value: 'Déjà correct', repaired: false });
});

test('ne publie pas l’origine interne et garantit des identifiants distincts', () => {
  const commonPrefix = 'Rando avec un nom volontairement très long qui partage exactement le même préfixe ';
  const { events } = normalizeEvents([
    event({ name: `${commonPrefix}A`, origin: 'public-form/edge/identifiant-interne' }),
    event({ name: `${commonPrefix}B`, origin: 'public-form/edge/autre-identifiant' }),
  ]);

  assert.equal(events.length, 2);
  assert.notEqual(events[0].id, events[1].id);
  assert.equal('origin' in events[0], false);
  assert.equal('origin' in events[1], false);
});
