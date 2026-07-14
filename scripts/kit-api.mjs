// Kit.com API v4 — briques partagées. https://developers.kit.com/v4
//
// POURQUOI CE MODULE EXISTE. Le client HTTP, la création de tag et le taggage étaient
// recopiés dans `kit-sync.mjs` et `kit-newsletter.mjs`. Le 2026-07-14, la même faute a
// coûté cher ailleurs : la règle §22 vivait en quatre exemplaires, ils avaient divergé,
// et l'un d'eux autorisait depuis deux semaines des pushes interdits (`D-2026-07-14-001`).
// Une règle en deux exemplaires n'en est plus une. Tout ce qui parle à Kit passe ici.
//
// LES TAGS NE SONT PAS DÉCORATIFS. Un broadcast Kit exige un `subscriber_filter`, et
// celui-ci ne cible QUE par `segment` ou `tag` — jamais par formulaire. Sans tag, on ne
// peut écrire à personne sans écrire à TOUT LE MONDE (organisateurs + visiteurs vtt.bzh
// + lecteurs nj.com mélangés). Le tag est donc la condition d'existence d'un envoi ciblé.

const KEY = process.env.KIT_API_KEY;
const HEADERS = { 'X-Kit-Api-Key': KEY, 'Content-Type': 'application/json' };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Client Kit avec RÉESSAI sur 429 (rate limit).
 *
 * Ce n'est pas du zèle : le 2026-07-14, la synchro des 502 organisateurs a rendu
 * `ok: 340, errors: 162` — un tiers des organisateurs simplement PERDUS, et l'ancien
 * script (2 appels/abonné, 500 ms) dépassait déjà la limite sans que personne ne le voie,
 * parce qu'il comptait les 429 comme de banales « erreurs ».
 *
 * Un 429 n'est pas une erreur : c'est « reviens plus tard ». On respecte `Retry-After`
 * quand Kit l'envoie, sinon on double l'attente à chaque essai. Le rythme se règle donc
 * tout seul, quelle que soit la limite réelle — plutôt que d'être deviné une fois pour
 * toutes dans un `sleep()` en dur qui se périmera.
 */
export const kit = async (path, init = {}, essai = 0) => {
  const res = await fetch(`https://api.kit.com/v4${path}`, { headers: HEADERS, ...init });

  if (res.status === 429 && essai < 6) {
    const entete = Number(res.headers.get('retry-after'));
    const attente = Number.isFinite(entete) && entete > 0 ? entete * 1000 : 2000 * 2 ** essai;
    await sleep(attente);
    return kit(path, init, essai + 1);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.errors ?? []).join(', ') || JSON.stringify(data).slice(0, 200);
    throw new Error(`Kit ${init.method ?? 'GET'} ${path} → ${res.status}: ${msg}`);
  }
  return data;
};

/** Retrouve le tag par son nom, le crée s'il n'existe pas. Idempotent. */
export const assurerTag = async (nom) => {
  const { tags = [] } = await kit('/tags');
  const existant = tags.find((t) => t.name === nom);
  if (existant) return existant.id;
  const { tag } = await kit('/tags', { method: 'POST', body: JSON.stringify({ name: nom }) });
  console.log(`[kit] tag « ${nom} » créé (id ${tag.id})`);
  return tag.id;
};

/** Pose un tag sur un abonné. Kit ignore un tag déjà présent — rejouable sans effet de bord. */
export const taguer = (tagId, subscriberId) => kit(`/tags/${tagId}/subscribers/${subscriberId}`, { method: 'POST' });

/** Tous les abonnés d'un formulaire (paginé — ces listes grossissent). */
export const abonnesDuForm = async (formId) => {
  const out = [];
  let after = null;
  do {
    const q = new URLSearchParams({ per_page: '500', ...(after ? { after } : {}) });
    const page = await kit(`/forms/${formId}/subscribers?${q}`);
    for (const s of page.subscribers ?? []) out.push(s.subscriber?.id ?? s.id);
    after = page.pagination?.has_next_page ? page.pagination.end_cursor : null;
  } while (after);
  return out;
};

/**
 * Nombre d'abonnés ACTIFS sur tout le compte.
 *
 * Le plafond du plan gratuit (1 000) se compte **par compte**, pas par liste — et les
 * ~500 organisateurs le remplissent déjà à moitié. Sans ce garde-fou, on découvrirait le
 * dépassement sur la facture. Voir `D-2026-07-13-001` (signal d'alerte).
 */
export const abonnesActifs = async () => {
  let after = null;
  let n = 0;
  do {
    const q = new URLSearchParams({ per_page: '500', status: 'active', ...(after ? { after } : {}) });
    const page = await kit(`/subscribers?${q}`);
    n += (page.subscribers ?? []).length;
    after = page.pagination?.has_next_page ? page.pagination.end_cursor : null;
  } while (after);
  return n;
};

export const PLAFOND_GRATUIT = 1000;

/** Alerte visible dès qu'on approche du plafond — pas le jour où on le franchit. */
export const alerterSiPlafondProche = async () => {
  const n = await abonnesActifs();
  const reste = PLAFOND_GRATUIT - n;
  if (reste <= 0) {
    console.warn(`⛔ Kit : ${n} abonnés actifs — PLAFOND GRATUIT DÉPASSÉ (${PLAFOND_GRATUIT}).`);
  } else if (reste <= 150) {
    console.warn(`⚠️  Kit : ${n} abonnés actifs — plus que ${reste} avant le plafond gratuit.`);
  } else {
    console.log(`[kit] ${n} abonnés actifs · marge avant plafond gratuit : ${reste}`);
  }
  return n;
};
