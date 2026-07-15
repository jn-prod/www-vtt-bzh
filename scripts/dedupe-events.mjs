// Dédoublonnage des events en base (Supabase) — fusion puis désactivation.
//
// Local : node --env-file=.env scripts/dedupe-events.mjs            # rapport seul
//         node --env-file=.env scripts/dedupe-events.mjs --apply    # écrit
//
// POURQUOI CE SCRIPT EXISTE. Deux canaux d'ingestion écrivent le même event sans se
// réconcilier : le scrape (`origin` = `/sortie/fiche-…`) et les formulaires (`form/NNN`,
// `public-form/…`). Résultat, le 2026-07-14 : 5 randos affichées EN DOUBLE sur vtt.bzh.
// Tant que la cause racine n'est pas traitée à l'ingestion, le stock se re-salit — ce
// script est donc fait pour être relancé, pas pour servir une fois.
//
// FUSION, PAS SUPPRESSION. Dans presque chaque paire, les deux fiches sont
// COMPLÉMENTAIRES : le scrape a le lieu et la vraie heure, le formulaire a le téléphone
// et le prix. Écraser l'une perd l'autre. On comble donc les trous de la fiche gardée
// avec ceux de la doublonne, puis on désactive la doublonne.
//
// RIEN N'EST SUPPRIMÉ : `active = false` (réversible d'un UPDATE). La ligne reste, avec
// son historique. Une sauvegarde tourne chaque matin (workflow supabase-backup).
//
// CE QUI N'EST **PAS** UN DOUBLON. Une clé jour+commune seule est dangereuse : le
// 15 août à Penguily, le comité des fêtes organise un RAID (7h45) *et* des RANDOS
// VTT/pédestres (8h) — deux events réels, deux fiches sources distinctes. La clé inclut
// donc le NOM. On préfère laisser passer un doublon que d'effacer un event qui existe.

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');

/**
 * Paires fusionnées SUR DÉCISION HUMAINE (`--fusionner <idA>,<idB>`).
 *
 * Aucune règle automatique ne peut les rattraper, et ce n'est pas une lacune du script :
 * « Rando des D » / « Randos des Diables » et « Rando VTT du comité des fêtes » /
 * « Rando VTT / pédestre » ont des noms trop éloignés. Une similarité par mots-clés,
 * elle, fusionnerait le RAID et les RANDOS de Penguily (qui partagent « vtt 15 août
 * penguily ») tout en ratant Cléguer — exactement l'inverse de ce qu'il faut.
 * Le script automatise donc le certain et SIGNALE le reste. L'humain trancher.
 */
const FUSIONS_MANUELLES = (args.find((a) => a.startsWith('--fusionner='))?.split('=')[1] ?? '')
  .split(';')
  .filter(Boolean)
  .map((p) => p.split(',').map((s) => s.trim()));

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[dedupe] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}

const sql = async (query) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return r.json();
};

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);

// --- Normalisation -----------------------------------------------------------

const plat = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** « les rives de la vilaine 2026 » → « les rives de la vilaine ». L'année est dans la date. */
const sansAnnee = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+(19|20)\d{2}$/, '');

/** `00:00:00` est une heure NON RENSEIGNÉE déguisée en donnée — la traiter comme vide. */
const vide = (v) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '00:00:00';
};

/**
 * Une valeur peut être présente ET inutilisable. La base contient des adresses email
 * recopiées dans le champ `website` (« http://<email d'organisateur> ») : les propager
 * dans la fiche gardée reviendrait à répandre la saleté au lieu de la contenir.
 * (Pas d'exemple réel ici — le gate privacy le refuse, et il a raison : un email
 * d'organisateur n'a rien à faire dans un commentaire de code versionné.)
 */
const utilisable = (champ, v) => {
  const s = String(v ?? '').trim();
  if (vide(s)) return false;
  if (champ === 'website' && s.includes('@')) return false;
  return true;
};

const commune = (s) =>
  plat(s)
    .replace(/\b\d{5}\b/g, '')
    .replace(/[^a-z]/g, '');

// Les champs qu'on fusionne. `name`/`city`/`date` sont traités à part.
const CHAMPS = ['place', 'hour', 'price', 'organisateur', 'website', 'email', 'phone', 'description'];

// --- Détection ---------------------------------------------------------------

/**
 * Groupe par jour + commune, puis départage à l'intérieur : deux fiches ne sont
 * fusionnées que si l'une des deux traite l'autre comme un doublon plausible — même
 * nom (aux accents/casse/année près), OU un nom qui est un préfixe tronqué de l'autre
 * (« Rando des D » pour « Randos des Diables », saisie coupée).
 */
const memeEvent = (a, b) => {
  const na = plat(sansAnnee(a.name));
  const nb = plat(sansAnnee(b.name));
  if (na === nb) return true;
  const [court, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  // Préfixe tronqué : « rando des d » ⊂ « randos des diables ». Seuil à 8 caractères
  // pour ne pas fusionner deux events dont les noms commencent pareil par hasard.
  return court.length >= 8 && long.startsWith(court.slice(0, court.length - 1));
};

/**
 * Rend deux listes :
 *  - `groupes`  : fusionnables sans risque (même nom, ou fusion demandée à la main) ;
 *  - `suspects` : même jour + même commune, mais noms différents. NI fusionnés NI
 *    ignorés — SIGNALÉS. C'est là que vivent à la fois les vrais doublons de saisie
 *    (« Rando des D ») et les faux positifs (le raid ET les randos de Penguily).
 *    Les confondre coûterait un event effacé ; les taire coûterait un doublon affiché.
 *    On les montre, et l'humain tranche avec `--fusionner=idA,idB`.
 */
const grouper = (events) => {
  const forcees = new Map();
  for (const [a, b] of FUSIONS_MANUELLES) {
    forcees.set(a, b);
    forcees.set(b, a);
  }

  const parLieuJour = new Map();
  for (const e of events) {
    const k = `${e.date}|${commune(e.city)}`;
    if (!parLieuJour.has(k)) parLieuJour.set(k, []);
    parLieuJour.get(k).push(e);
  }

  const groupes = [];
  const suspects = [];
  for (const fiches of parLieuJour.values()) {
    const restants = [...fiches];
    const nonApparies = [];
    while (restants.length) {
      const tete = restants.shift();
      const amis = [tete];
      for (let i = restants.length - 1; i >= 0; i -= 1) {
        const autre = restants[i];
        if (memeEvent(tete, autre) || forcees.get(tete.id) === autre.id) {
          amis.push(...restants.splice(i, 1));
        }
      }
      if (amis.length > 1) groupes.push(amis);
      else nonApparies.push(tete);
    }
    if (nonApparies.length > 1) suspects.push(nonApparies);
  }
  return { groupes, suspects };
};

/** Complétude : on garde la fiche la mieux remplie — son id survit, son historique aussi. */
const score = (e) => CHAMPS.filter((c) => !vide(e[c])).length;

// --- Main --------------------------------------------------------------------

const main = async () => {
  const events = await sql(`
    select id, name, city, date::date::text as date, ${CHAMPS.join(', ')}, origin, active
    from public.events
    where active = true and coalesce(canceled, false) = false and date::date >= current_date
    order by created_at asc
  `);

  const { groupes, suspects } = grouper(events);
  const updates = [];

  for (const g of groupes) {
    const trie = [...g].sort((a, b) => score(b) - score(a));
    const garde = trie[0];
    const perdants = trie.slice(1);

    // Le nom le plus informatif gagne (le tronqué perd), débarrassé de l'année parasite.
    const nom = sansAnnee(g.map((e) => e.name).sort((a, b) => sansAnnee(b).length - sansAnnee(a).length)[0]);

    const fusion = { name: nom !== sansAnnee(garde.name) ? nom : null };
    for (const c of CHAMPS) {
      if (utilisable(c, garde[c])) continue;
      const source = perdants.find((p) => utilisable(c, p[c]));
      if (source) fusion[c] = String(source[c]).replace(/\s+/g, ' ').trim();
    }
    const champs = Object.entries(fusion).filter(([, v]) => v !== null && v !== undefined);

    console.log(`\n── ${garde.date} · ${garde.city}`);
    console.log(`   GARDE      ${garde.id.slice(0, 8)}  « ${sansAnnee(garde.name)} »  (${garde.origin ?? '?'})`);
    for (const [c, v] of champs) console.log(`     ↳ ${c.padEnd(13)} ← ${String(v).slice(0, 70)}`);
    if (!champs.length) console.log('     ↳ (rien à combler)');
    for (const p of perdants) {
      console.log(`   DÉSACTIVE  ${p.id.slice(0, 8)}  « ${sansAnnee(p.name)} »  (${p.origin ?? '?'})`);
    }

    if (champs.length) {
      updates.push(
        `update public.events set ${champs.map(([c, v]) => `${c} = ${q(v)}`).join(', ')} where id = ${q(garde.id)};`
      );
    }
    for (const p of perdants) {
      updates.push(`update public.events set active = false where id = ${q(p.id)};`);
    }
  }

  // Sondes RLS laissées en production (datées 2099 pour finir en queue de tri).
  const sondes = await sql(`
    select id, name from public.events
    where active = true and (name ilike '%PROBE%' or origin ilike '%probe%' or origin = 'form/should-fail')
  `);
  if (sondes.length) {
    console.log(`\n── sondes de test en production`);
    for (const s of sondes) {
      console.log(`   DÉSACTIVE  ${s.id.slice(0, 8)}  « ${s.name} »`);
      updates.push(`update public.events set active = false where id = ${q(s.id)};`);
    }
  }

  if (suspects.length) {
    console.log(`\n⚠️  À CONFIRMER — même jour, même commune, noms différents.`);
    console.log(`   Peut être un doublon de saisie… ou deux events réels (un raid ET une rando).`);
    console.log(`   Aucune règle ne sait trancher : regarde, puis --fusionner=idA,idB\n`);
    for (const g of suspects) {
      console.log(`   ── ${g[0].date} · ${g[0].city}`);
      for (const e of g) {
        const d = [e.hour, e.price, e.organisateur].filter((v) => !vide(v)).join(' · ');
        console.log(`      ${e.id}  « ${sansAnnee(e.name)} »`);
        console.log(`      ${' '.repeat(36)}${d.slice(0, 70) || '—'}`);
      }
      console.log('');
    }
  }

  console.log(
    `${groupes.length} doublon(s) fusionnable(s) · ${suspects.length} à confirmer · ${sondes.length} sonde(s) · ${updates.length} requête(s)`
  );

  if (!updates.length) return console.log('✅ rien à faire.');
  if (!APPLY) return console.log('▶ rapport seul — relancer avec --apply pour écrire.');

  await sql(updates.join('\n'));
  console.log(`✅ ${updates.length} requête(s) appliquée(s). Rien n’est supprimé (active = false).`);
};

main().catch((e) => {
  console.error(`[dedupe] ${e.message}`);
  process.exit(1);
});
