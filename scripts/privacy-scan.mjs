// Contrôle de confidentialité des fichiers versionnés : noms de tiers et de mineurs
// (denylist), puis données personnelles par motif (e-mail hors contact@ et nicolas@,
// téléphone, IBAN/RIB).
//
//   node scripts/privacy-scan.mjs
//
// La denylist n'est jamais versionnée : variable PRIVACY_DENYLIST (secret GitHub
// Actions, un terme par ligne) ou fichier PRIVACY_DENYLIST_FILE, par défaut
// ~/corp-ai/.privacy-denylist. Sans denylist, le contrôle échoue (fail-closed).
// Les motifs ne s'appliquent ni aux tests, ni aux attributs placeholder, ni aux domaines
// d'exemple, ni aux fichiers listés dans .privacy-allow (coordonnées publiques assumées,
// un chemin par ligne). La denylist, elle, s'applique partout.
// Les journaux de CI sont publics : seul l'emplacement est affiché, jamais le terme.
// Fichier identique dans www-nicolasjouanno-com et www-vtt-bzh.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TESTS = /(^|\/)tests?\/|\.(test|spec)\.[cm]?[jt]s$/;
const SKIP =
  /(^|\/)(pnpm-lock\.yaml|Gemfile\.lock|package-lock\.json)$|\.(jpe?g|png|webp|gif|ico|svg|pdf|woff2?|ttf|zip|gz|mp4|mov)$/i;
const PATTERNS = [
  [
    'e-mail',
    /(?<![A-Za-z0-9._%+-])(?!(?:contact|nicolas)@)[A-Za-z0-9._%+-]+@(?!(?:[a-z0-9-]+\.)*ex[ea]mple\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i,
  ],
  ['IBAN', /\bFR\d{2}(?: ?[A-Za-z0-9]){23}\b/i],
  ['RIB', /\b\d{5} ?\d{5} ?[A-Za-z0-9]{11} ?\d{2}\b/],
  ['téléphone', /(?<![A-Za-z0-9])(?:\+33|0)[ .-]?[1-9](?:[ .-]?\d{2}){4}(?![A-Za-z0-9])/],
];

const listFile = process.env.PRIVACY_DENYLIST_FILE ?? join(homedir(), 'corp-ai', '.privacy-denylist');
const rawList = process.env.PRIVACY_DENYLIST ?? (existsSync(listFile) ? readFileSync(listFile, 'utf8') : null);
if (!rawList?.trim()) {
  console.error(`privacy : denylist introuvable (PRIVACY_DENYLIST ou ${listFile}). Contrôle refusé.`);
  process.exit(1);
}
const terms = rawList
  .split('\n')
  .map((term) => term.trim().toLowerCase())
  .filter((term) => term && !term.startsWith('#'));

const allowed = new Set(
  existsSync('.privacy-allow')
    ? readFileSync('.privacy-allow', 'utf8')
        .split('\n')
        .map((path) => path.trim())
        .filter((path) => path && !path.startsWith('#'))
    : []
);
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((file) => file && !SKIP.test(file));
const findings = [];
for (const file of files) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  if (text.includes('\0')) continue;
  const checkPatterns = !TESTS.test(file) && !allowed.has(file);
  text.split('\n').forEach((line, index) => {
    const lower = line.toLowerCase();
    if (terms.some((term) => lower.includes(term))) findings.push(`${file}:${index + 1} terme de la denylist`);
    if (!checkPatterns || line.includes('placeholder=')) return;
    for (const [kind, pattern] of PATTERNS) if (pattern.test(line)) findings.push(`${file}:${index + 1} ${kind}`);
  });
}

if (findings.length > 0) {
  console.error(`privacy : ${findings.length} donnée(s) à retirer avant publication :\n  ${findings.join('\n  ')}`);
  process.exit(1);
}
console.log(`privacy : ${files.length} fichiers contrôlés, rien à signaler.`);
