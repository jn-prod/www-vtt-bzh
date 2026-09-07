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

test('produit un seul Markdown non publié, prêt à relire', () => {
  const normalized = normalizeNewsletterEvents({ agenda: [event], newEvents: [event] });
  const markdown = renderNewsletter({
    period: '2026-09',
    generatedAt: '2026-09-07',
    ...normalized,
  });

  assert.match(markdown, /permalink: \/newsletter\/2026-09\//u);
  assert.match(markdown, /sent: false\npublished: false/u);
  assert.match(markdown, /Rando des bois — nouveau/u);
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
layout: newsletter-edition
newsletter_id: vtt-bzh-@@PERIOD@@
permalink: /newsletter/@@PERIOD@@/
sent: false
published: false
---
Édition @@PERIOD@@
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
      markdown: 'newsletter_id: vtt-bzh-2026-09\nsent: false\npublished: false\ngenerated_at: 1\n',
      update: false,
    });
    const second = saveNewsletterDraft({
      postsDirectory: root,
      period: '2026-09',
      generatedAt: '2026-09-02',
      markdown: 'newsletter_id: vtt-bzh-2026-09\nsent: false\npublished: false\ngenerated_at: 2\n',
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

test('n’écrase jamais une édition finalisée', () => {
  const root = mkdtempSync(join(tmpdir(), 'newsletter-finalized-'));
  try {
    const path = join(root, '2026-09-01-agenda.md');
    const finalized = 'newsletter_id: vtt-bzh-2026-09\nsent: true\npublished: true\n';
    writeFileSync(path, finalized, 'utf8');
    const result = saveNewsletterDraft({
      postsDirectory: root,
      period: '2026-09',
      generatedAt: '2026-09-02',
      markdown: 'newsletter_id: vtt-bzh-2026-09\nsent: false\npublished: false\n',
      update: true,
    });

    assert.equal(result.status, 'finalized');
    assert.equal(readFileSync(path, 'utf8'), finalized);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
