#!/usr/bin/env node
/**
 * Récupère les N derniers articles du flux Atom de nicolasjouanno.com
 * et les écrit dans www/_data/posts.json, consommé au build par Jekyll.
 *
 * Pourquoi au build et pas côté client :
 *  - zéro JS tiers, zéro dépendance au CORS, pas d'échec silencieux
 *  - les articles sont dans le HTML (indexables, pas de layout shift)
 *  - le site rebuild tous les jours (cron github-pages 05:30 UTC) → fraîcheur suffisante
 *
 * Tolérant à la panne : si le flux est injoignable ou illisible, on CONSERVE
 * le posts.json existant et on sort en 0 (ne jamais casser le build du calendrier
 * pour un bloc secondaire).
 */

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FEED_URL = 'https://www.nicolasjouanno.com/feed.xml';
const UTM = 'utm_source=vtt-bzh&utm_medium=site&utm_campaign=home-card';
const LIMIT = 3;
const EXCERPT_MAX = 150;
const TIMEOUT_MS = 10_000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'www', '_data', 'posts.json');

/** Décode les entités XML/HTML les plus courantes. */
function decode(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decode(m[1]) : '';
}

function pickLink(block) {
  // Atom : <link href="..." rel="alternate" />  |  RSS : <link>...</link>
  const atom = block.match(/<link[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (atom) return atom[1].trim();
  return pick(block, 'link');
}

/**
 * Extrait un chapô court. `<description>` contient l'accroche de l'article,
 * suivie d'un encart « Initialement publié sur … » ajouté par le flux : on le
 * coupe. Puis on tronque sur une frontière de mot.
 */
function pickExcerpt(block) {
  let text = pick(block, 'description') || pick(block, 'summary');
  if (!text) return '';
  text = text.split(/Initialement publié sur/i)[0].replace(/\s+/g, ' ').trim();
  if (text.length <= EXCERPT_MAX) return text;
  const cut = text.slice(0, EXCERPT_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_MAX).trimEnd()}…`;
}

function parseFeed(xml) {
  const blocks = xml.match(/<(entry|item)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks
    .map((b) => {
      const url = pickLink(b);
      const title = pick(b, 'title');
      const date = pick(b, 'published') || pick(b, 'pubDate') || pick(b, 'updated');
      if (!url || !title) return null;
      const sep = url.includes('?') ? '&' : '?';
      const d = new Date(date);
      return {
        title,
        excerpt: pickExcerpt(b),
        url: `${url}${sep}${UTM}`,
        date: Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10),
        date_label: Number.isNaN(d.getTime())
          ? ''
          : d.toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
      };
    })
    .filter(Boolean)
    .slice(0, LIMIT);
}

async function keepExisting(reason) {
  console.warn(`[fetch-posts] ${reason} → conservation de posts.json existant.`);
  try {
    const current = JSON.parse(await readFile(OUT, 'utf8'));
    console.warn(`[fetch-posts] ${current.length} article(s) conservé(s).`);
  } catch {
    await writeFile(OUT, '[]\n', 'utf8');
    console.warn("[fetch-posts] aucun posts.json → écriture d'un tableau vide.");
  }
  process.exit(0);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

let xml;
try {
  const res = await fetch(FEED_URL, { signal: controller.signal });
  if (!res.ok) await keepExisting(`flux HTTP ${res.status}`);
  xml = await res.text();
} catch (err) {
  await keepExisting(`flux injoignable (${err.message})`);
} finally {
  clearTimeout(timer);
}

const posts = parseFeed(xml);
if (posts.length === 0) await keepExisting('flux illisible ou vide');

await writeFile(OUT, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
console.log(`[fetch-posts] ${posts.length} article(s) écrits dans _data/posts.json`);
for (const p of posts) console.log(`  · ${p.date} — ${p.title}`);
