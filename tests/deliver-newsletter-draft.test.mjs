import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildPayload, deliverEdition, loadEdition } from '../scripts/deliver-newsletter-draft.mjs';

const edition = {
  content: '<p>Bonjour</p>',
  contentHash: 'content-hash',
  dataHash: 'data-hash',
  data: {
    newsletter_id: 'vtt-bzh-2026-09',
    subject: 'Randos VTT Bretagne - septembre 2026',
    preview_text: 'Les randos a venir.',
    audience: { tag: 'agenda-mensuel', form_id: '9677378' },
  },
};

test('creates a visitor-only Kit draft without scheduling it', async () => {
  const calls = [];
  const result = await deliverEdition({
    edition,
    receipt: null,
    sourceCommit: 'a'.repeat(40),
    client: {
      ensureTag: async () => 12,
      listFormSubscriberIds: async () => [1, 2],
      tagSubscribers: async () => {},
      findBroadcastByDescription: async () => null,
      createBroadcast: async (payload) => {
        calls.push(payload);
        return { id: 42 };
      },
    },
  });

  assert.equal(result.receipt.kit_broadcast_id, 42);
  assert.equal(calls[0].send_at, null);
  assert.equal(calls[0].public, false);
  assert.deepEqual(calls[0].subscriber_filter, [{ all: [{ type: 'tag', ids: [12] }], any: null, none: null }]);
});

test('does not call Kit again when the receipt matches the merged commit', async () => {
  const receipt = {
    newsletter_id: 'vtt-bzh-2026-09',
    kit_broadcast_id: 42,
    source: { content_sha256: 'content-hash', data_sha256: 'data-hash', source_commit: 'a'.repeat(40) },
  };
  const result = await deliverEdition({
    edition,
    receipt,
    sourceCommit: 'a'.repeat(40),
    client: new Proxy({}, { get: () => () => assert.fail('Kit must not be called') }),
  });

  assert.equal(result.action, 'unchanged');
});

test('refuses to overwrite a scheduled broadcast', async () => {
  await assert.rejects(
    deliverEdition({
      edition,
      receipt: {
        newsletter_id: 'vtt-bzh-2026-09',
        kit_broadcast_id: 42,
        source: { content_sha256: 'old', data_sha256: 'old', source_commit: 'b'.repeat(40) },
      },
      sourceCommit: 'a'.repeat(40),
      client: {
        ensureTag: async () => 12,
        listFormSubscriberIds: async () => [1],
        tagSubscribers: async () => {},
        getBroadcast: async () => ({ id: 42, send_at: '2026-09-01T07:00:00Z', public: false }),
        updateBroadcast: async () => assert.fail('A scheduled broadcast must not be updated'),
      },
    }),
    /no longer a draft/
  );
});

test('validates the public edition files and rejects personal data', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'newsletter-vtt-'));
  const dataDirectory = path.join(root, 'www', '_data', 'newsletters');
  const contentDirectory = path.join(root, 'www', '_includes', 'newsletters');
  await Promise.all([mkdir(dataDirectory, { recursive: true }), mkdir(contentDirectory, { recursive: true })]);
  await writeFile(path.join(contentDirectory, '2026-09.html'), '<p>Bonjour</p>');
  await writeFile(path.join(dataDirectory, '2026-09.json'), JSON.stringify({ schema_version: 1, ...edition.data }));

  const loaded = await loadEdition('2026-09', root);
  assert.equal(loaded.period, '2026-09');
  assert.equal(buildPayload(edition.data, edition.content).description, 'newsletter_id:vtt-bzh-2026-09');

  await writeFile(
    path.join(dataDirectory, '2026-09.json'),
    JSON.stringify({ schema_version: 1, ...edition.data, email: 'person@example.com' })
  );
  await assert.rejects(loadEdition('2026-09', root), /forbidden key email/);
  await rm(root, { recursive: true, force: true });
});
