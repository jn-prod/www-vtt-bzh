// Backup complet des entries Wufoo dans wufoo.json.
// Exécution : node --env-file=.env scripts/backup-wufoo.mjs
// Sortie : ./wufoo.json (gitignored). Exit 2 si count fichier ≠ count Wufoo.

import { writeFileSync } from 'node:fs';

const { WUFOO_USERNAME, WUFOO_PASSWORD, WUFOO_DOMAIN, WUFOO_FORM } = process.env;
if (!WUFOO_USERNAME || !WUFOO_PASSWORD || !WUFOO_DOMAIN || !WUFOO_FORM) {
  console.error('[backup] missing WUFOO_* env vars (need USERNAME, PASSWORD, DOMAIN, FORM)');
  process.exit(1);
}

const base = `https://${WUFOO_DOMAIN}/api/v3/forms/${WUFOO_FORM}`;
const auth = `Basic ${Buffer.from(`${WUFOO_USERNAME}:${WUFOO_PASSWORD}`).toString('base64')}`;

async function getJson(path, params = {}) {
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: auth, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Wufoo ${res.status} ${res.statusText} on ${url.pathname}`);
  return res.json();
}

const { EntryCount } = await getJson('/entries/count.json');
const total = Number(EntryCount);
console.log(`[backup] Wufoo reports ${total} entries on ${WUFOO_DOMAIN}/${WUFOO_FORM}`);

const pageSize = 25;
const entries = [];
let safety = 0;
while (entries.length < total) {
  if (++safety > 1000) throw new Error('pagination safety break');
  const { Entries } = await getJson('/entries.json', { pageStart: entries.length, pageSize });
  if (!Array.isArray(Entries) || Entries.length === 0) break;
  entries.push(...Entries);
  console.log(`[backup] fetched ${entries.length}/${total}`);
}

const out = new URL('../wufoo.json', import.meta.url).pathname;
const payload = {
  fetchedAt: new Date().toISOString(),
  source: { domain: WUFOO_DOMAIN, form: WUFOO_FORM },
  expected: total,
  count: entries.length,
  entries,
};
writeFileSync(out, JSON.stringify(payload, null, 2));
console.log(`[backup] wrote ${entries.length} entries to ${out}`);

if (entries.length !== total) {
  console.warn(`[backup] WARNING: count mismatch (got ${entries.length}, expected ${total})`);
  process.exit(2);
}
console.log('[backup] OK — count matches');
