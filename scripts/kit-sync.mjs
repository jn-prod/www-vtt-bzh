// Sync organisateurs vtt.bzh → Kit.com CRM.
// Local  : node --env-file=.env scripts/kit-sync.mjs
// Cron   : ajouter dans .env : KIT_API_KEY, KIT_FORM_ID
// Kit.com API v4 : https://developers.kit.com/v4
// Flow   : POST /v4/subscribers (upsert) → POST /v4/forms/{id}/subscribers (attach)

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, KIT_API_KEY, KIT_FORM_ID } = process.env;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[kit-sync] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}
if (!KIT_API_KEY || !KIT_FORM_ID) {
  console.error('[kit-sync] KIT_API_KEY et KIT_FORM_ID requis (ajouter dans .env)');
  process.exit(1);
}

const SUPABASE_API = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;
const KIT_HEADERS = { 'X-Kit-Api-Key': KIT_API_KEY, 'Content-Type': 'application/json' };

const runQuery = async (query) => {
  const res = await fetch(SUPABASE_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Supabase API ${res.status}: ${await res.text()}`);
  return res.json();
};

const upsertSubscriber = async (email, name) => {
  const res = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: KIT_HEADERS,
    body: JSON.stringify({ email_address: email, ...(name ? { first_name: name } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data.errors ?? []).join(', ');
    throw new Error(`upsert ${res.status}: ${msg || JSON.stringify(data).slice(0, 150)}`);
  }
  return data.subscriber.id;
};

const attachToForm = async (subscriberId) => {
  const res = await fetch(`https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`, {
    method: 'POST',
    headers: KIT_HEADERS,
    body: JSON.stringify({ id: subscriberId }),
  });
  if (!res.ok) {
    const data = await res.json();
    const msg = (data.errors ?? []).join(', ');
    throw new Error(`attach ${res.status}: ${msg || JSON.stringify(data).slice(0, 150)}`);
  }
};

const subscribe = async (email, name) => {
  const subscriberId = await upsertSubscriber(email, name);
  await attachToForm(subscriberId);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  // Emails uniques — Kit.com déduplique par email (upsert)
  const rows = await runQuery(`
    SELECT DISTINCT ON (email) email, organisateur
    FROM public.events
    WHERE email IS NOT NULL AND email != ''
    ORDER BY email, date DESC
  `);

  console.log(`[kit-sync] ${rows.length} organisateurs à synchroniser`);

  let ok = 0,
    skipped = 0,
    errors = 0;

  for (const row of rows) {
    try {
      await subscribe(row.email, row.organisateur);
      ok++;
    } catch (err) {
      // Email invalide ou désabonné → skip sans planter
      if (err.message.includes('422') || err.message.toLowerCase().includes('invalid')) {
        console.warn(`[kit-sync] skip ${row.email}: ${err.message}`);
        skipped++;
      } else {
        console.error(`[kit-sync] error ${row.email}:`, err.message);
        errors++;
      }
    }
    // 2 appels par subscriber → ~500ms/subscriber = ~120 req/min, dans les limites Kit.com
    await sleep(500);
  }

  console.log(`[kit-sync] done — ok: ${ok}, skipped: ${skipped}, errors: ${errors}`);
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
