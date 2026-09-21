import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  normalizeNewsletterEvents,
  renderNewsletter,
  renderTemplate,
  saveNewsletterDraft,
} from './generate-newsletter';

const event = {
  date: '2026-09-12',
  name: 'Rando des bois',
  city: 'Pontivy',
  departement: 56,
  active: true,
  canceled: false,
  hour: '8h30',
  price: '6 €',
  organisateur: 'Club privé',
  email: 'person@example.com',
  phone: '0600000000',
  created_at: '2026-09-01T08:00:00Z',
};

test('produit un brief factuel, prêt à alimenter l’édition éditoriale', () => {
  const normalized = normalizeNewsletterEvents({ agenda: [event], newEvents: [event] });
  const markdown = renderNewsletter({
    start: '2026-09-01',
    end: '2026-09-30',
    generatedAt: '2026-09-07',
    ...normalized,
  });

  assert.match(markdown, /source_id: vtt-bzh-2026-09-01_2026-09-30/u);
  assert.match(markdown, /source: calendrier-vtt-bzh/u);
  assert.match(markdown, /Matière calendrier VTT/u);
  assert.match(markdown, /## Agenda par week-end/u);
  assert.match(markdown, /## Nouveautés récentes/u);
  assert.match(markdown, /\*\*56\*\* : 1/u);
  assert.match(markdown, /Rando des bois/u);
  assert.match(markdown, /utm_source=vtt-bzh/u);
  assert.doesNotMatch(markdown, /sent: false|published: false|newsletter_id:/u);
  assert.doesNotMatch(markdown, /person@example\.com|0600000000|Club privé/u);
  assert.doesNotMatch(markdown, /<li|<p|style=/u);
});

test('refuse une édition vide', () => {
  assert.throws(
    () =>
      renderNewsletter({
        start: '2026-09-01',
        end: '2026-09-30',
        generatedAt: '2026-09-07',
        agenda: [],
        newEvents: [],
      }),
    /Aucune rando/u
  );
});

test('refuse une fenêtre dont les dates sont invalides ou inversées', () => {
  const normalized = normalizeNewsletterEvents({ agenda: [event], newEvents: [] });

  assert.throws(
    () => renderNewsletter({ start: '2026-02-30', end: '2026-03-01', generatedAt: '2026-09-07', ...normalized }),
    /YYYY-MM-DD/u
  );
  assert.throws(
    () => renderNewsletter({ start: '2026-10-02', end: '2026-10-01', generatedAt: '2026-09-07', ...normalized }),
    /précéder/u
  );
});

test('le template porte la structure sans IA', () => {
  const normalized = normalizeNewsletterEvents({ agenda: [event], newEvents: [event] });
  const markdown = renderNewsletter({
    start: '2026-09-01',
    end: '2026-09-30',
    generatedAt: '2026-09-07',
    template: `---
source_id: vtt-bzh-@@START@@_@@END@@
source: calendrier-vtt-bzh
---
Édition @@START@@ à @@END@@
## Agenda par week-end
@@AGENDA_GROUPS@@
@@IF_HAS_NEW_EVENTS@@Nouveautés
@@NEW_EVENT_LINES@@@@END_HAS_NEW_EVENTS@@`,
    ...normalized,
  });

  assert.match(markdown, /Édition 2026-09-01 à 2026-09-30/u);
  assert.match(markdown, /Rando des bois/u);
  assert.match(markdown, /Nouveautés/u);
});

test('refuse un template avec une variable inconnue', () => {
  assert.throws(() => renderTemplate('@@VARIABLE_INCONNUE@@', {}, {}), /Variable inconnue/u);
});

test('met à jour le même brouillon sans créer un second fichier', () => {
  const root = mkdtempSync(join(tmpdir(), 'newsletter-draft-'));
  try {
    const first = saveNewsletterDraft({
      draftsDirectory: root,
      start: '2026-09-01',
      end: '2026-09-30',
      markdown: 'source_id: vtt-bzh-2026-09-01_2026-09-30\ngenerated_at: 1\n',
      update: false,
    });
    const second = saveNewsletterDraft({
      draftsDirectory: root,
      start: '2026-09-01',
      end: '2026-09-30',
      markdown: 'source_id: vtt-bzh-2026-09-01_2026-09-30\ngenerated_at: 2\n',
      update: true,
    });

    assert.equal(first.status, 'created');
    assert.equal(second.status, 'updated');
    assert.equal(second.path, first.path);
    assert.match(readFileSync(first.path, 'utf8'), /generated_at: 2/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refuse un brief existant sans demande de mise à jour', () => {
  const root = mkdtempSync(join(tmpdir(), 'newsletter-existing-'));
  try {
    const path = join(root, '2026-09-01_2026-09-30-la-sortie.md');
    writeFileSync(path, 'source_id: vtt-bzh-2026-09-01_2026-09-30\ngenerated_at: 1\n', 'utf8');
    assert.throws(
      () =>
        saveNewsletterDraft({
          draftsDirectory: root,
          start: '2026-09-01',
          end: '2026-09-30',
          markdown: 'source_id: vtt-bzh-2026-09-01_2026-09-30\ngenerated_at: 2\n',
          update: false,
        }),
      /Utiliser --update/u
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
