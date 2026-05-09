// Backup quotidien Supabase via Management API.
// Dump JSON de toutes les tables publiques + schema (information_schema).
// Output : ./backups/vtt-bzh-<ISO>/{events,schema}.json + checksums.sha256
//
// Local : node --env-file=.env scripts/backup-supabase.mjs
// CI    : SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF en env, output dans $GITHUB_WORKSPACE/backups/

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[backup] missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF env vars');
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

async function runQuery(query) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function dumpTable(table) {
  const rows = await runQuery(`select coalesce(json_agg(t.*), '[]'::json) as data from public.${table} t;`);
  return rows[0].data;
}

const tag = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
const outDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups', `vtt-bzh-${tag}`);
mkdirSync(outDir, { recursive: true });
console.log(`[backup] target: ${outDir}`);

// Tables publiques à dumper. `subscribers` a été dropped le 2026-05-07 (RGPD, T-072).
const tables = ['events'];
const filenames = [];
for (const t of tables) {
  const data = await dumpTable(t);
  const file = join(outDir, `${t}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`[backup] ${t}: ${data.length} rows → ${file}`);
  filenames.push(`${t}.json`);
}

// Schema snapshot (utile au restore : montre les colonnes attendues à un instant T)
const schema = await runQuery(
  `select table_name, column_name, data_type, is_nullable, column_default
   from information_schema.columns
   where table_schema = 'public'
   order by table_name, ordinal_position;`
);
const schemaFile = join(outDir, 'schema.json');
writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
console.log(`[backup] schema: ${schema.length} columns → ${schemaFile}`);
filenames.push('schema.json');

// Checksums (intégrité fichier — pas chiffrement)
const checksums = filenames
  .map((f) => {
    const hash = createHash('sha256')
      .update(readFileSync(join(outDir, f)))
      .digest('hex');
    return `${hash}  ${f}`;
  })
  .join('\n');
writeFileSync(join(outDir, 'checksums.sha256'), `${checksums}\n`);
console.log(`[backup] checksums.sha256 written`);

// Manifest (pour pouvoir comparer entre runs)
const manifest = {
  tag,
  generatedAt: new Date().toISOString(),
  projectRef: SUPABASE_PROJECT_REF,
  tables: tables.map((t, i) => ({ name: t, file: filenames[i] })),
  schemaFile: 'schema.json',
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`[backup] OK`);
