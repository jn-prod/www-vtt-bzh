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
    period: '2026-09',
    generatedAt: '2026-09-07',
    ...normalized,
  });

  assert.match(markdown, /source_id: vtt-bzh-2026-09/u);
  assert.match(markdown, /source: calendrier-vtt-bzh/u);
  assert.match(markdown, /Matière calendrier VTT/u);
  assert.match(markdown, /Rando des bois — nouveau/u);
  assert.match(markdown, /utm_source=vtt-bzh/u);
  assert.doesNotMatch(markdown, /sent: false|published: false|newsletter_id:/u);
  assert.doesNotMatch(markdown, /person@example\.com|0600000000|Club privé/u);
  assert.doesNotMatch(markdown, /<li|<p|style=/u);
});

test('refuse une édition vide', () => {
  assert.throws(
    () => renderNewsletter({ period: '2026-09', generatedAt: '2026-09-07', agenda: [], newEvents: [] }),
    /Aucune rando/u
  );
});

test('le template porte la structure sans IA', () => {
  const normalized = normalizeNewsletterEvents({ agenda: [event], newEvents: [event] });
  const markdown = renderNewsletter({
    period: '2026-09',
    generatedAt: '2026-09-07',
    template: `---
source_id: vtt-bzh-@@PERIOD@@
source: calendrier-vtt-bzh
---
Édition @@PERIOD@@
## Agenda des cinq prochaines semaines
@@AGENDA_LINES@@
@@IF_HAS_LATER@@Plus tard
@@LATER_LINES@@@@END_HAS_LATER@@`,
    ...normalized,
  });

  assert.match(markdown, /Édition 2026-09/u);
  assert.match(markdown, /Rando des bois — nouveau/u);
  assert.doesNotMatch(markdown, /Plus tard/u);
});

test('refuse un template avec une variable inconnue', () => {
  assert.throws(() => renderTemplate('@@VARIABLE_INCONNUE@@', {}, {}), /Variable inconnue/u);
});

test('met à jour le même brouillon sans créer un second fichier', () => {
  const root = mkdtempSync(join(tmpdir(), 'newsletter-draft-'));
  try {
    const first = saveNewsletterDraft({
      postsDirectory: root,
      period: '2026-09',
      generatedAt: '2026-09-01',
      markdown: 'source_id: vtt-bzh-2026-09\ngenerated_at: 1\n',
      update: false,
    });
    const second = saveNewsletterDraft({
      postsDirectory: root,
      period: '2026-09',
      generatedAt: '2026-09-02',
      markdown: 'source_id: vtt-bzh-2026-09\ngenerated_at: 2\n',
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
    const path = join(root, '2026-09-01-rando-bretagne-source.md');
    writeFileSync(path, 'source_id: vtt-bzh-2026-09\ngenerated_at: 1\n', 'utf8');
    assert.throws(
      () =>
        saveNewsletterDraft({
          postsDirectory: root,
          period: '2026-09',
          generatedAt: '2026-09-02',
          markdown: 'source_id: vtt-bzh-2026-09\ngenerated_at: 2\n',
          update: false,
        }),
      /Utiliser --update/u
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
