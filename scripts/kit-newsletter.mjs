// Newsletter mensuelle vtt.bzh → Kit.com. OUTIL, pas automate.
//
// Tient l'engagement pris sur la home : « Chaque mois, le calendrier des nouvelles
// randos VTT de Bretagne dans ta boîte mail. » (_includes/newsletter-inline.html)
//
// PAS DE CRON, ET C'EST VOULU (décision fondateur, 2026-07-14). Ce script ne fait
// JAMAIS partir un mail : il pose un BROUILLON dans Kit. La rédaction et l'envoi sont
// des actes humains — le skill `newsletter-vtt-bzh` (corp-ai) pilote la rédaction, le
// fondateur relit et envoie depuis Kit. Un envoi est irréversible ; aucune machine ne
// le déclenche ici.
//
// Modes :
//   --data                    → JSON des randos propres (ce que le skill lit pour rédiger)
//   --dry-run                 → construit le mail par défaut, l'affiche, n'écrit rien
//   --content=<fichier.html>  → pose un BROUILLON Kit avec CE contenu (sortie du skill)
//   (sans argument)           → pose un BROUILLON Kit avec le mail par défaut
//
// Kit.com API v4 : https://developers.kit.com/v4
//
// POURQUOI LE TAG. `subscriber_filter` est OBLIGATOIRE sur un broadcast, et Kit ne
// sait cibler que par `segment` ou `tag` — PAS par formulaire. Sans lui, le mail
// partirait à TOUT le compte : les organisateurs (form 9433681) et les abonnés
// nj.com inclus. On tague donc les inscrits du form visiteurs, et on filtre dessus.
// Le tag est créé et posé PAR L'API : rien à faire à la main dans Kit.

import { readFileSync } from 'node:fs';

import { kit, sleep, assurerTag, taguer, abonnesDuForm, alerterSiPlafondProche } from './kit-api.mjs';

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, KIT_API_KEY } = process.env;

const FORM_ID = process.env.KIT_VISITEURS_FORM_ID ?? '9677378'; // « VTT.bzh visiteurs form »
const TAG_NAME = 'agenda-mensuel';
const HORIZON_JOURS = 35; // 5 semaines : couvre le mois + la marge d'inscription
const MAX_EVENTS = 200; // garde-fou : au-delà, la requête est suspecte → on n'écrit rien

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DATA = args.includes('--data');
const CONTENT_FILE = args.find((a) => a.startsWith('--content='))?.split('=')[1];
const SANS_ECRITURE = DRY_RUN || DATA;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[kit-newsletter] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}
if (!KIT_API_KEY && !SANS_ECRITURE) {
  console.error('[kit-newsletter] KIT_API_KEY requis (ou --dry-run / --data)');
  process.exit(1);
}

// --- Données -----------------------------------------------------------------

const runQuery = async (query) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Supabase API ${res.status}: ${await res.text()}`);
  return res.json();
};

/**
 * Deux listes, deux promesses distinctes :
 *  - `nouvelles` = ce que le mail annonce (« les NOUVELLES randos ») : ajoutées au
 *    calendrier depuis le dernier envoi, et pas encore passées.
 *  - `agenda`    = ce qui le rend utile (« le CALENDRIER ») : tout ce qui roule dans
 *    les 5 semaines, nouveau ou non.
 * Les annulées sont exclues des deux : envoyer quelqu'un à une rando annulée est
 * la seule faute que cet email peut commettre.
 */
const chargerRandos = async () => {
  const commun = `active = true and coalesce(canceled, false) = false and date::date >= current_date`;
  const champs = `name, city, departement, date::date as date, hour, price, organisateur`;

  const [nouvelles, agenda] = await Promise.all([
    runQuery(`
      select ${champs} from public.events
      where ${commun} and created_at >= now() - interval '1 month'
      order by date asc limit ${MAX_EVENTS}
    `),
    runQuery(`
      select ${champs} from public.events
      where ${commun} and date::date < current_date + interval '${HORIZON_JOURS} days'
      order by date asc limit ${MAX_EVENTS}
    `),
  ]);
  return { nouvelles: nettoyer(nouvelles), agenda: nettoyer(agenda) };
};

// --- Nettoyage ---------------------------------------------------------------
//
// La base est saisie à la main par des organisateurs bénévoles : elle contient des
// doublons (« Randos des Diables » / « Rando des D », même jour, même commune), des
// noms avec des retours à la ligne collés dedans, des heures en `08:00:00` à côté de
// `7h30`, des « 5 EUROS » et des villes préfixées du code postal.
//
// Le site absorbe ce bruit — une ligne bancale se noie dans 450 autres. Un mail, non :
// il arrive signé, dans une boîte de réception, et un doublon y donne l'impression que
// l'expéditeur ne connaît pas son propre calendrier. On nettoie donc ICI, en défense —
// même si la source est réparée un jour, l'email ne doit jamais pouvoir régresser.

const propre = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/** « 56620 CLEGUER » → « Cleguer » ; « ARZAL » → « Arzal ». */
const ville = (s) => {
  const v = propre(s)
    .replace(/\b\d{5}\b/g, '')
    .trim();
  return v.replace(/\p{L}+/gu, (m) => m[0].toUpperCase() + m.slice(1).toLowerCase());
};

/** « 08:00:00 » → « 8h00 ». Les saisies libres (« 7h30 /13h30 ») sont gardées telles quelles. */
const heure = (s) => {
  const v = propre(s);
  const m = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return m ? `${Number(m[1])}h${m[2]}` : v;
};

/** « 5 EUROS » → « 5 € ». */
const prix = (s) =>
  propre(s)
    .replace(/\s*(euros?|EUROS?)\s*$/i, ' €')
    .replace(/\s+€/, ' €');

const plat = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Clé de doublon : jour + commune + NOM. Le nom est dans la clé, et c'est le point
 * important.
 *
 * Une clé jour+commune seule paraît plus efficace — elle attrape plus de doublons.
 * Elle est en fait dangereuse : le 15 août à Penguily, le comité des fêtes organise
 * UN RAID (départ 7h45) *et* DES RANDOS VTT/pédestres (départ 8h). Deux events réels,
 * deux fiches sources distinctes. Une clé jour+commune les fusionne et fait DISPARAÎTRE
 * un event du mail. Un agenda qui invente est moins grave qu'un agenda qui efface.
 *
 * Ici on ne dédoublonne donc que ce qui est certain : même jour, même commune, même nom
 * (aux accents, à la casse et à l'année parasite près — « la Staobinaise 2026 » et
 * « La staobinaise » sont la même). Les doublons de SAISIE (« Rando des D » vs « Randos
 * des Diables ») ne sont pas du ressort de ce script : ils se corrigent à la source,
 * sinon le site les affiche aussi.
 */
const cleDoublon = (e) => `${e.date}|${plat(ville(e.city))}|${plat(nom(e.name))}`;

/** « les rives de la vilaine 2026 » → « les rives de la vilaine ». L'année est déjà
 *  dans la date : la répéter dans le titre est un artefact de saisie. */
const nom = (s) => propre(s).replace(/\s+(19|20)\d{2}$/, '');

/**
 * Score de départage entre deux doublons. Le NOM pèse le plus lourd, et volontairement :
 * la base contient des saisies tronquées (« Rando des D » pour « Randos des Diables »).
 * Un score qui ne compterait que les champs remplis choisirait le tronqué s'il a un prix
 * — c'est le piège dans lequel la 1ʳᵉ version est tombée. Le nom le plus long gagne.
 */
const richesse = (e) => nom(e.name).length * 10 + [e.hour, e.price, e.organisateur].filter((v) => propre(v)).length;

const nettoyer = (events) => {
  const parCle = new Map();
  for (const e of events) {
    const k = cleDoublon(e);
    const garde = parCle.get(k);
    if (!garde || richesse(e) > richesse(garde)) parCle.set(k, e);
  }
  const retires = events.length - parCle.size;
  if (retires > 0) console.log(`[kit-newsletter] ${retires} doublon(s) écarté(s) du mail`);
  return [...parCle.values()].map((e) => ({
    ...e,
    name: nom(e.name),
    city: ville(e.city),
    hour: heure(e.hour),
    price: prix(e.price),
  }));
};

// --- Rendu -------------------------------------------------------------------

const echapper = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

const dateLongue = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });

const ligne = (e) => {
  const lieu = [e.city, e.departement ? `(${e.departement})` : null].filter(Boolean).join(' ');
  const details = [e.hour, e.price].filter(Boolean).join(' · ');
  const badge = e.nouveau ? ' <span style="color:#0a8754;font-weight:700;font-size:13px;">nouveau</span>' : '';
  return `<li style="margin:0 0 12px;">
  <strong>${echapper(dateLongue(e.date))}</strong> — ${echapper(e.name)}${badge}<br />
  <span style="color:#6c757d;">${echapper(lieu)}${details ? ` · ${echapper(details)}` : ''}</span>
</li>`;
};

const bloc = (titre, events) =>
  events.length
    ? `<h2 style="font-size:18px;margin:24px 0 12px;">${titre}</h2>
<ul style="list-style:none;padding:0;margin:0;">
${events.map(ligne).join('\n')}
</ul>`
    : '';

/**
 * Le calendrier ne tient que si des randos y entrent. Ces lecteurs sont la seule
 * audience qui contient à la fois des pratiquants ET des membres de clubs — c'est donc
 * le seul canal qui atteint le côté OFFRE du calendrier, pas seulement la demande.
 * La home ne parle d'ajout qu'aux organisateurs ; ici on le demande à tout le monde,
 * y compris à celui qui a juste repéré une rando manquante.
 */
const SUGGESTION = `<div style="margin:24px 0;padding:16px;background:#f6f8f7;border-radius:6px;">
  <strong>Une rando manque à l'appel ?</strong><br />
  <span style="color:#6c757d;">Tu en connais une qui n'est pas dans la liste — la tienne, celle de ton club, ou une que tu as vue passer ?
  <a href="https://www.vtt.bzh/calendrier/ajouter.html">Ajoute-la au calendrier</a>. C'est ce qui le tient à jour.</span>
</div>`;

/**
 * UNE seule liste chronologique, chaque rando exactement une fois. Les ajouts récents
 * y portent un repère « nouveau » plutôt que d'occuper une section à part : une section
 * séparée ferait apparaître deux fois la rando qui est à la fois nouvelle ET dans les
 * 5 semaines — un mail qui se présente comme ton calendrier ne peut pas se répéter.
 * Les nouveautés qui tombent APRÈS l'horizon ont leur propre bloc : elles sont la
 * vraie « nouvelle » du mois, et elles disparaîtraient sinon.
 */
const construireEmail = ({ nouvelles, agenda }) => {
  const mois = new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Paris',
  });

  const cles = new Set(nouvelles.map(cleDoublon));
  const liste = agenda.map((e) => ({ ...e, nouveau: cles.has(cleDoublon(e)) }));
  const clesAgenda = new Set(agenda.map(cleDoublon));
  const plusLoin = nouvelles.filter((e) => !clesAgenda.has(cleDoublon(e)));

  const s = (n) => (n > 1 ? 's' : '');

  const content = `<p>Salut,</p>
<p>Voici les randos VTT de Bretagne du mois. Bonne route.</p>
${bloc(`${liste.length} rando${s(liste.length)} dans les 5 prochaines semaines`, liste)}
${bloc(`Nouveau${s(plusLoin.length)} plus loin dans la saison`, plusLoin)}
<p style="margin-top:24px;">
  <a href="https://www.vtt.bzh/">Voir tout le calendrier sur vtt.bzh</a>
</p>
${SUGGESTION}
<p style="color:#6c757d;font-size:14px;">Nicolas — vtt.bzh</p>`;

  const nbNouveau = liste.filter((e) => e.nouveau).length + plusLoin.length;

  return {
    subject: `Randos VTT Bretagne — ${mois}`,
    preview_text: `${liste.length} rando${s(liste.length)} à venir${nbNouveau ? `, dont ${nbNouveau} nouvelle${s(nbNouveau)}` : ''}`,
    description: `Agenda mensuel vtt.bzh — ${mois}`,
    content,
  };
};

// --- Kit ---------------------------------------------------------------------

/**
 * Tague les inscrits du form visiteurs. Idempotent (Kit ignore un tag déjà posé).
 * Sans ce tag, `subscriber_filter` n'a rien à cibler et l'agenda partirait aussi aux
 * organisateurs et aux lecteurs nj.com — cf. scripts/kit-api.mjs.
 */
const taguerInscrits = async (tagId) => {
  const ids = await abonnesDuForm(FORM_ID);
  for (const id of ids) {
    await taguer(tagId, id);
    await sleep(120); // ~500 req/min — sous la limite Kit
  }
  return ids.length;
};

/** Un doublon est pire qu'un oubli : on vérifie qu'aucun envoi du mois n'existe déjà. */
const dejaEnvoyeCeMois = async (subject) => {
  const { broadcasts = [] } = await kit('/broadcasts?per_page=20');
  return broadcasts.some((b) => b.subject === subject);
};

// --- Main --------------------------------------------------------------------

const main = async () => {
  const randos = await chargerRandos();

  // `--data` : la matière brute et PROPRE, pour que le skill rédige dessus.
  if (DATA) {
    console.log(JSON.stringify({ ...randos, suggestion: SUGGESTION }, null, 2));
    return;
  }

  const email = construireEmail(randos);

  console.log(
    `[kit-newsletter] ${randos.nouvelles.length} nouvelles · ${randos.agenda.length} dans les ${HORIZON_JOURS} j`
  );

  // Un mail vide est pire que pas de mail : il use la promesse sans la tenir.
  if (randos.agenda.length === 0) {
    console.log('[kit-newsletter] aucune rando dans l’horizon — pas de newsletter ce mois-ci.');
    return;
  }

  // Le skill rédige le corps et le passe ici : le script ne garde que la plomberie
  // (ciblage, garde-fous, brouillon). Le sujet/aperçu restent calculés — ils dépendent
  // des chiffres, pas du style.
  if (CONTENT_FILE) {
    email.content = readFileSync(CONTENT_FILE, 'utf8');
  }

  if (DRY_RUN) {
    console.log(`\n--- sujet ---\n${email.subject}`);
    console.log(`--- aperçu ---\n${email.preview_text}`);
    console.log(`--- html ---\n${email.content}`);
    return;
  }

  if (await dejaEnvoyeCeMois(email.subject)) {
    console.log(`[kit-newsletter] « ${email.subject} » existe déjà dans Kit — rien à faire.`);
    return;
  }

  // Le plafond gratuit (1 000) se compte PAR COMPTE : les ~500 organisateurs en occupent
  // déjà la moitié. On veut le savoir avant la facture, pas après (`D-2026-07-13-001`).
  await alerterSiPlafondProche();

  const tagId = await assurerTag(TAG_NAME);
  const nb = await taguerInscrits(tagId);
  console.log(`[kit-newsletter] ${nb} inscrit(s) tagué(s) « ${TAG_NAME} »`);

  if (nb === 0) {
    console.log('[kit-newsletter] aucun inscrit tagué — pas de brouillon.');
    return;
  }

  // `send_at: null` = BROUILLON. Ce script ne programme jamais d'envoi : pas de cron,
  // pas d'automate. Le fondateur relit dans Kit et clique « envoyer ». Un envoi ne se
  // rattrape pas — c'est la seule raison qui vaille de garder un humain dans la boucle.
  const { broadcast } = await kit('/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      ...email,
      public: false, // pas de publication sur le Creator Profile
      published_at: new Date().toISOString(),
      send_at: null,
      subscriber_filter: [{ all: [{ type: 'tag', ids: [tagId] }], any: null, none: null }],
    }),
  });

  console.log(
    `[kit-newsletter] BROUILLON ${broadcast.id} créé — ${nb} destinataire(s), tag « ${TAG_NAME} ».\n` +
      `                 À relire et envoyer depuis Kit : ${broadcast.public_url ?? 'app.kit.com'}`
  );
};

main().catch((e) => {
  console.error(`[kit-newsletter] ${e.message}`);
  process.exit(1);
});
