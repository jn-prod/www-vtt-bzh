import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execute = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCRIPT = join(ROOT, 'scripts', 'generate-la-sortie.rb');
const FIXTURE = join(ROOT, 'tests', 'fixtures', 'la-sortie-feed.xml');

const generate = async (feed) => {
  const directory = await mkdtemp(join(tmpdir(), 'la-sortie-feed-'));
  const output = join(directory, 'latest.json');
  await execute('bundle', ['exec', 'ruby', SCRIPT], {
    cwd: join(ROOT, 'www'),
    env: {
      ...process.env,
      LA_SORTIE_FEED_FILE: feed,
      LA_SORTIE_OUTPUT: output,
    },
  });
  return {
    data: JSON.parse(await readFile(output, 'utf8')),
    cleanup: () => rm(directory, { recursive: true, force: true }),
  };
};

test('génère les données statiques de la dernière édition', async (context) => {
  const result = await generate(FIXTURE);
  context.after(result.cleanup);

  assert.equal(result.data.title, 'La Sortie #2 — chemins & forêt');
  assert.equal(result.data.description, 'Trois idées pour sortir en Bretagne.');
  assert.equal(result.data.image_url, 'https://www.nicolasjouanno.com/images/posts/foret.webp');
  assert.equal(result.data.image_alt, 'Un chemin dans la forêt');
  assert.equal(result.data.published_at, '2026-10-31T08:00:00Z');
  assert.match(result.data.url, /utm_content=latest-issue/u);
  assert.equal(result.data.source, 'rss');
});

test('produit un repli statique quand le flux est invalide', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'la-sortie-invalid-'));
  const feed = join(directory, 'invalid.xml');
  await writeFile(feed, '<rss>');
  const result = await generate(feed);
  context.after(async () => {
    await result.cleanup();
    await rm(directory, { recursive: true, force: true });
  });

  assert.equal(result.data.title, 'La Sortie');
  assert.equal(result.data.source, 'fallback');
  assert.equal(result.data.image_url, null);
});
