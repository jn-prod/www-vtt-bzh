import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { abonnesDuForm, assurerTag, kit, sleep, taguer } from './kit-api.mjs';

const MAX_PAGES = 20;
const TAG_SUBSCRIBER_DELAY_MS = 120;
const VISITEURS_FORM_ID = '9677378';
const AGENDA_MENSUEL_TAG = 'agenda-mensuel';
const FORBIDDEN_DATA_KEYS = new Set(['email', 'phone', 'organisateur', 'website']);
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

export async function loadEdition(period, root = process.cwd()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new Error('Newsletter period must be formatted YYYY-MM.');
  }

  const dataPath = path.join(root, 'www', '_data', 'newsletters', `${period}.json`);
  const contentPath = path.join(root, 'www', '_includes', 'newsletters', `${period}.html`);
  const receiptPath = path.join(root, 'www', '_data', 'newsletters', `${period}.delivery.json`);
  const [content, rawData] = await Promise.all([readFile(contentPath, 'utf8'), readFile(dataPath, 'utf8')]);
  const data = JSON.parse(rawData);

  validateEdition({ period, content, data });
  return {
    period,
    content,
    data,
    receiptPath,
    contentHash: sha256(content),
    dataHash: sha256(`${JSON.stringify(data)}\n`),
  };
}

export async function readReceipt(receiptPath) {
  try {
    return JSON.parse(await readFile(receiptPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function deliverEdition({ edition, receipt, sourceCommit, client }) {
  const source = {
    content_sha256: edition.contentHash,
    data_sha256: edition.dataHash,
    source_commit: sourceCommit,
  };
  if (receipt?.newsletter_id === edition.data.newsletter_id && sameSource(receipt.source, source)) {
    return { action: 'unchanged', receipt };
  }

  const tagId = await client.ensureTag(edition.data.audience.tag);
  const recipients = await client.listFormSubscriberIds(edition.data.audience.form_id);
  if (!recipients.length) throw new Error('Kit audience is empty; draft creation aborted.');
  await client.tagSubscribers(tagId, recipients);

  const payload = {
    ...buildPayload(edition.data, edition.content),
    subscriber_filter: [{ all: [{ type: 'tag', ids: [tagId] }], any: null, none: null }],
  };
  let broadcastId = receipt?.kit_broadcast_id ?? null;
  let action = 'created';

  if (broadcastId != null) {
    const broadcast = await client.getBroadcast(broadcastId);
    assertDraft(broadcast, edition.data.newsletter_id);
    await client.updateBroadcast(broadcastId, payload);
    action = 'updated';
  } else {
    const existing = await client.findBroadcastByDescription(payload.description);
    if (existing) {
      assertDraft(existing, edition.data.newsletter_id);
      broadcastId = existing.id;
      await client.updateBroadcast(broadcastId, payload);
      action = 'updated';
    } else {
      const broadcast = await client.createBroadcast(payload);
      broadcastId = broadcast.id;
    }
  }

  return {
    action,
    receipt: {
      schema_version: 1,
      newsletter_id: edition.data.newsletter_id,
      kit_broadcast_id: broadcastId,
      delivered_at: new Date().toISOString(),
      source,
    },
  };
}

export function buildPayload(data, content) {
  return {
    subject: data.subject,
    preview_text: data.preview_text,
    description: `newsletter_id:${data.newsletter_id}`,
    content,
    public: false,
    published_at: new Date().toISOString(),
    send_at: null,
  };
}

export function createKitClient() {
  return {
    ensureTag: assurerTag,
    listFormSubscriberIds: abonnesDuForm,
    tagSubscribers: async (tagId, subscriberIds) => {
      for (const [index, subscriberId] of subscriberIds.entries()) {
        await taguer(tagId, subscriberId);
        if (index < subscriberIds.length - 1) await sleep(TAG_SUBSCRIBER_DELAY_MS);
      }
    },
    getBroadcast: async (id) => (await kit(`/broadcasts/${id}`)).broadcast,
    updateBroadcast: async (id, payload) =>
      (
        await kit(`/broadcasts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      ).broadcast,
    createBroadcast: async (payload) =>
      (
        await kit('/broadcasts', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      ).broadcast,
    findBroadcastByDescription,
  };
}

async function findBroadcastByDescription(description) {
  let after = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const query = new URLSearchParams({ per_page: '1000', ...(after ? { after } : {}) });
    const payload = await kit(`/broadcasts?${query}`);
    const existing = (payload.broadcasts ?? []).find((broadcast) => broadcast.description === description);
    if (existing) return existing;
    if (!payload.pagination?.has_next_page || !payload.pagination.end_cursor) return null;
    after = payload.pagination.end_cursor;
  }
  throw new Error(`Kit API pagination exceeds ${MAX_PAGES} pages for broadcasts.`);
}

function validateEdition({ period, content, data }) {
  if (!content.trim() || /<script\b/i.test(content)) {
    throw new Error('Newsletter fragment must contain HTML without scripts.');
  }
  if (EMAIL_PATTERN.test(content)) throw new Error('Newsletter fragment must not contain email addresses.');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Newsletter data must be an object.');
  if (data.schema_version !== 1) throw new Error('Newsletter data schema_version must be 1.');
  if (data.newsletter_id !== `vtt-bzh-${period}`) throw new Error('newsletter_id must match the period.');
  for (const key of ['subject', 'preview_text']) {
    if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error(`Newsletter data ${key} is required.`);
  }
  if (
    !data.audience ||
    data.audience.tag !== AGENDA_MENSUEL_TAG ||
    String(data.audience.form_id ?? '') !== VISITEURS_FORM_ID
  ) {
    throw new Error('Newsletter data must target the agenda-mensuel visitor audience.');
  }
  assertSafeData(data);
}

function assertSafeData(value, key = '') {
  if (Array.isArray(value)) return value.forEach((item) => assertSafeData(item));
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      if (FORBIDDEN_DATA_KEYS.has(childKey.toLowerCase())) {
        throw new Error(`Newsletter data contains forbidden key ${childKey}.`);
      }
      assertSafeData(child, childKey);
    }
    return;
  }
  if (typeof value === 'string' && EMAIL_PATTERN.test(value)) {
    throw new Error(`Newsletter data contains an email-shaped value${key ? ` at ${key}` : ''}.`);
  }
}

function assertDraft(broadcast, newsletterId) {
  if (!broadcast || broadcast.send_at != null || broadcast.public !== false) {
    throw new Error(`Kit broadcast for ${newsletterId} is no longer a draft; refusing to overwrite it.`);
  }
}

function sameSource(left, right) {
  return (
    left?.content_sha256 === right.content_sha256 &&
    left?.data_sha256 === right.data_sha256 &&
    left?.source_commit === right.source_commit
  );
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const separator = arg.indexOf('=');
      if (separator === -1) return [arg.slice(2), true];
      return [arg.slice(2, separator), arg.slice(separator + 1)];
    })
  );
  if (!args.period || !args['source-commit']) {
    if (!args.period || !args.validate) {
      throw new Error('Usage: --period=YYYY-MM [--validate | --source-commit=SHA]');
    }
  }

  const edition = await loadEdition(args.period);
  if (args.validate) {
    console.log(`Newsletter ${edition.data.newsletter_id}: valid.`);
    return;
  }
  if (!process.env.KIT_API_KEY) throw new Error('KIT_API_KEY is required.');
  const receipt = await readReceipt(edition.receiptPath);
  const result = await deliverEdition({
    edition,
    receipt,
    sourceCommit: args['source-commit'],
    client: createKitClient(),
  });
  if (result.action !== 'unchanged') {
    await writeFile(edition.receiptPath, `${JSON.stringify(result.receipt, null, 2)}\n`, 'utf8');
  }
  console.log(`Newsletter ${edition.data.newsletter_id}: ${result.action}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
