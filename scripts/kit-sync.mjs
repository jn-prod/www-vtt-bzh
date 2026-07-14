// Sync organisateurs vtt.bzh → Kit.com CRM.
//
// Local : node --env-file=.env scripts/kit-sync.mjs --dry-run   # n'écrit rien
//         node --env-file=.env scripts/kit-sync.mjs
// Cron  : quotidien (.github/workflows/kit-sync.yml)
//
// Flow : upsert /v4/subscribers → attach /v4/forms/{id}/subscribers → TAG « organisateurs ».
// Idempotent de bout en bout : Kit déduplique par email, ignore un tag déjà posé, et la
// requête SQL déduplique côté source.
//
// POURQUOI LE TAG (ajouté 2026-07-14). Être dans un FORMULAIRE ne suffit pas à être
// joignable : un broadcast Kit exige un `subscriber_filter`, et celui-ci ne cible QUE par
// `segment` ou `tag` — jamais par formulaire. Sans tag, on ne peut écrire aux organisateurs
// sans écrire AUSSI aux visiteurs vtt.bzh et aux lecteurs nj.com. Le tag est la condition
// d'existence d'un envoi ciblé, pas une étiquette de confort.

import { kit, sleep, assurerTag, taguer, alerterSiPlafondProche } from './kit-api.mjs';

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, KIT_API_KEY, KIT_FORM_ID } = process.env;

const TAG_NAME = 'organisateurs';
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[kit-sync] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}
if ((!KIT_API_KEY || !KIT_FORM_ID) && !DRY_RUN) {
  console.error('[kit-sync] KIT_API_KEY et KIT_FORM_ID requis (ou --dry-run)');
  process.exit(1);
}

const SUPABASE_API = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

const runQuery = async (query) => {
  const res = await fetch(SUPABASE_API, {
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

const upsertSubscriber = async (email, name) => {
  const data = await kit('/subscribers', {
    method: 'POST',
    body: JSON.stringify({ email_address: email, ...(name ? { first_name: name } : {}) }),
  });
  return data.subscriber.id;
};

const attachToForm = (subscriberId) =>
  kit(`/forms/${KIT_FORM_ID}/subscribers`, {
    method: 'POST',
    body: JSON.stringify({ id: subscriberId }),
  });

const main = async () => {
  // Emails uniques — Kit déduplique par email (upsert)
  const rows = await runQuery(`
    SELECT DISTINCT ON (email) email, organisateur
    FROM public.events
    WHERE email IS NOT NULL AND email != ''
    ORDER BY email, date DESC
  `);

  console.log(`[kit-sync] ${rows.length} organisateurs à synchroniser`);

  if (DRY_RUN) {
    console.log(`[kit-sync] --dry-run : rien n'est écrit. Tag qui serait posé : « ${TAG_NAME} »`);
    console.log(
      `[kit-sync] échantillon : ${rows
        .slice(0, 3)
        .map((r) => r.organisateur)
        .join(' · ')}`
    );
    return;
  }

  // Le plafond gratuit (1 000) se compte PAR COMPTE, pas par liste — et les organisateurs
  // en occupent déjà la moitié. On veut le savoir avant la facture, pas après.
  await alerterSiPlafondProche();

  const tagId = await assurerTag(TAG_NAME);

  let ok = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const subscriberId = await upsertSubscriber(row.email, row.organisateur);
      await attachToForm(subscriberId);
      await taguer(tagId, subscriberId);
      ok += 1;
    } catch (err) {
      // Email invalide ou désabonné → skip sans planter
      if (err.message.includes('422') || err.message.toLowerCase().includes('invalid')) {
        console.warn(`[kit-sync] skip ${row.email}: ${err.message}`);
        skipped += 1;
      } else {
        console.error(`[kit-sync] error ${row.email}:`, err.message);
        errors += 1;
      }
    }
    // Rythme de croisière. Le vrai garde-fou est le réessai sur 429 dans kit-api.mjs :
    // une valeur en dur ici se périmerait le jour où Kit change sa limite.
    await sleep(900);
  }

  console.log(`[kit-sync] done — ok: ${ok}, skipped: ${skipped}, errors: ${errors} · tag « ${TAG_NAME} »`);
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
