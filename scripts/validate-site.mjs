import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { parse } from 'parse5';

const SITE = join(process.cwd(), 'www', '_site');
const HOSTS = new Set(['www.vtt.bzh', 'vtt.bzh']);
const failures = [];

const filesRecursively = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesRecursively(path) : [path];
  });

const attributes = (node) => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));

const nodes = (root) => {
  const result = [];
  const visit = (node) => {
    result.push(node);
    (node.childNodes ?? []).forEach(visit);
    if (node.content) visit(node.content);
  };
  visit(root);
  return result;
};

const resolvePublicPath = (pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const clean = decoded.replace(/^\/+/, '');
  const candidates = [];
  if (!clean || clean.endsWith('/')) candidates.push(join(SITE, clean, 'index.html'));
  else {
    candidates.push(join(SITE, clean));
    if (!extname(clean)) {
      candidates.push(join(SITE, `${clean}.html`));
      candidates.push(join(SITE, clean, 'index.html'));
    }
  }
  return candidates.find(existsSync) ?? null;
};

const internalPath = (value) => {
  if (!value || /^(?:#|mailto:|tel:|data:|javascript:)/iu.test(value)) return null;
  try {
    const url = new URL(value, 'https://www.vtt.bzh');
    return HOSTS.has(url.hostname) ? url.pathname : null;
  } catch {
    return null;
  }
};

if (!existsSync(SITE)) {
  console.error('[validate-site] www/_site absent : lancez le build');
  process.exit(1);
}

const htmlFiles = filesRecursively(SITE).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const document = parse(html);
  for (const node of nodes(document)) {
    const attrs = attributes(node);
    const values = [];
    if (node.nodeName === 'a' && attrs.href) values.push(attrs.href);
    if (['img', 'script'].includes(node.nodeName) && attrs.src) values.push(attrs.src);
    if (node.nodeName === 'link' && attrs.href) values.push(attrs.href);
    if (node.nodeName === 'source' && attrs.srcset) {
      values.push(...attrs.srcset.split(',').map((candidate) => candidate.trim().split(/\s+/u)[0]));
    }
    for (const value of values) {
      const pathname = internalPath(value);
      if (pathname && !resolvePublicPath(pathname)) {
        failures.push(`${relative(SITE, file)} : cible interne absente ${pathname}`);
      }
    }
  }

  const forbidden = [
    /12(?:&nbsp;|\s)000\s+vététistes/iu,
    /12(?:&nbsp;|\s)000\s+vues/iu,
    /en ligne le lendemain/iu,
    /mes publications/iu,
    /(?:|||Ã.|â€)/u,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(html)) failures.push(`${relative(SITE, file)} : formulation interdite ${pattern}`);
  }
}

const eventsPath = join(SITE, 'calendrier', 'events.json');
let events = [];
try {
  events = JSON.parse(readFileSync(eventsPath, 'utf8'));
} catch (error) {
  failures.push(`calendrier/events.json illisible : ${error.message}`);
}

if (!Array.isArray(events) || events.length === 0) failures.push('calendrier/events.json est vide');
const ids = new Set();
for (const event of events) {
  if (!String(event.id ?? '').startsWith('event-')) failures.push(`identifiant événement invalide : ${event.id}`);
  if (ids.has(event.id)) failures.push(`identifiant événement dupliqué : ${event.id}`);
  ids.add(event.id);
  if (event.website && !/^https?:\/\//u.test(event.website)) failures.push(`URL événement non HTTP(S) : ${event.id}`);
  if ('origin' in event) failures.push(`origine interne exposée dans le JSON public : ${event.id}`);
}

const home = readFileSync(join(SITE, 'index.html'), 'utf8');
const homeEvents = nodes(parse(home)).filter((node) => {
  const attrs = attributes(node);
  return node.nodeName === 'details' && attrs.class?.split(/\s+/u).includes('event');
});
if (homeEvents.length !== Math.min(20, events.length)) {
  failures.push(`la home contient ${homeEvents.length} événements initiaux au lieu de ${Math.min(20, events.length)}`);
}
if (events.length > 20 && !existsSync(join(SITE, 'calendrier', 'page', '2', 'index.html'))) {
  failures.push('la pagination statique du calendrier est absente');
}

const merci = readFileSync(join(SITE, 'merci.html'), 'utf8');
if (!/<meta\s+name="robots"\s+content="noindex, follow"\s*\/>/u.test(merci))
  failures.push('merci.html doit être noindex, follow');
const sitemap = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
if (sitemap.includes('/merci.html')) failures.push('merci.html ne doit pas figurer dans le sitemap');

const eventSuccessPath = join(SITE, 'calendrier', 'soumission-confirmee.html');
const eventSuccess = readFileSync(eventSuccessPath, 'utf8');
if (!/<meta\s+name="robots"\s+content="noindex, follow"\s*\/>/u.test(eventSuccess))
  failures.push('soumission-confirmee.html doit être noindex, follow');
if (sitemap.includes('/calendrier/soumission-confirmee.html'))
  failures.push('soumission-confirmee.html ne doit pas figurer dans le sitemap');

const organizerForm = nodes(parse(readFileSync(join(SITE, 'calendrier', 'ajouter.html'), 'utf8'))).find((node) => {
  const attrs = attributes(node);
  return node.nodeName === 'form' && attrs.id === 'event-form';
});
const organizerFormAttrs = attributes(organizerForm ?? {});
if (organizerFormAttrs.method !== 'post') failures.push('le formulaire organisateur doit utiliser POST');
if (!organizerFormAttrs.action?.endsWith('/functions/v1/submit-event'))
  failures.push('le formulaire organisateur doit cibler submit-event');

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`[validate-site] ${failure}`));
  process.exit(1);
}

console.log(`[validate-site] OK : ${htmlFiles.length} pages, ${events.length} événements, liens et assets résolus`);
