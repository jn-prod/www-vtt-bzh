// Migration one-shot : parse le champ contact (free-text hérité Nafix) vers email + phone.
// Local : node --env-file=.env scripts/contact-migrate.mjs
// Supabase Management API — nécessite SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF.

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF) {
  console.error('[migrate] SUPABASE_ACCESS_TOKEN et SUPABASE_PROJECT_REF requis');
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;

const runQuery = async (query) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Management API ${res.status}: ${await res.text()}`);
  return res.json();
};

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i;
const PHONE_RE = /0[1-9](?:[\s.\-]?\d{2}){4}/;

const normalizePhone = (raw) => {
  const digits = raw.replace(/[\s.\-]/g, '');
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const parseContact = (contact) => {
  if (!contact || !contact.trim()) return { email: null, phone: null };
  const emailMatch = contact.match(EMAIL_RE);
  const phoneMatch = contact.match(PHONE_RE);
  return {
    email: emailMatch ? emailMatch[0].trim().toLowerCase() : null,
    phone: phoneMatch ? normalizePhone(phoneMatch[0]) : null,
  };
};

const escape = (s) => s.replace(/'/g, "''");

// Batch UPDATE via CTE VALUES — une seule requête par chunk de 100 rows.
const batchUpdate = async (rows) => {
  const values = rows
    .map((r) => {
      const e = r.email ? `'${escape(r.email)}'` : 'NULL';
      const p = r.phone ? `'${escape(r.phone)}'` : 'NULL';
      return `('${r.id}'::uuid, ${e}, ${p})`;
    })
    .join(',\n    ');

  const query = `
WITH updates(id, email, phone) AS (
  VALUES
    ${values}
)
UPDATE public.events e
SET
  email = COALESCE(e.email, u.email),
  phone = COALESCE(e.phone, u.phone)
FROM updates u
WHERE e.id = u.id
  AND (u.email IS NOT NULL OR u.phone IS NOT NULL);
`;
  await runQuery(query);
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const main = async () => {
  const rows = await runQuery(
    `SELECT id, contact FROM public.events
     WHERE contact IS NOT NULL AND contact != ''
       AND email IS NULL AND phone IS NULL`
  );
  console.log(`[migrate] ${rows.length} rows à traiter`);

  const toUpdate = rows.map((r) => ({ id: r.id, ...parseContact(r.contact) })).filter((r) => r.email || r.phone);

  console.log(`[migrate] ${toUpdate.length} rows avec email ou phone extrait`);

  const chunks = chunk(toUpdate, 100);
  for (let i = 0; i < chunks.length; i++) {
    await batchUpdate(chunks[i]);
    console.log(`[migrate] batch ${i + 1}/${chunks.length} OK`);
  }

  const stats = await runQuery(`
    SELECT
      count(*) filter (where email IS NOT NULL) as with_email,
      count(*) filter (where phone IS NOT NULL) as with_phone,
      count(*) filter (where email IS NULL AND phone IS NULL AND contact IS NOT NULL AND contact != '') as unparseable
    FROM public.events
  `);
  console.log('[migrate] done —', stats[0]);
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
