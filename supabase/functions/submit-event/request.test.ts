import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSubmissionRequest } from './request.ts';

test('parse le JSON sans modifier son contrat', () => {
  const parsed = parseSubmissionRequest('application/json; charset=utf-8', '{"name":"Rando"}');
  assert.deepEqual(parsed, {
    ok: true,
    payload: { name: 'Rando' },
    nativeForm: false,
    newsletter: false,
  });
});

test('convertit uniquement les champs natifs attendus', () => {
  const parsed = parseSubmissionRequest(
    'application/x-www-form-urlencoded',
    'name=Rando&departement=56&consent=on&newsletter=on&website_url='
  );
  assert.deepEqual(parsed, {
    ok: true,
    payload: { name: 'Rando', departement: 56, consent: true, website_url: '' },
    nativeForm: true,
    newsletter: true,
  });
});

test('refuse le JSON invalide et les formats inconnus', () => {
  assert.deepEqual(parseSubmissionRequest('application/json', '{'), { ok: false, error: 'invalid_json' });
  assert.deepEqual(parseSubmissionRequest('text/plain', 'name=Rando'), {
    ok: false,
    error: 'unsupported_media_type',
  });
});
