// Edge Function : notif email modération à chaque nouvel event public-form/.
// Déploiement : supabase functions deploy notify-new-event --no-verify-jwt
// Config : secrets RESEND_API_KEY, WEBHOOK_SECRET, MODERATOR_EMAIL.
// Trigger : Supabase Database Webhook (Settings → Database Webhooks) sur INSERT public.events,
// avec header personnalisé `x-webhook-secret: <WEBHOOK_SECRET>` et URL de cette function.
//
// Stack : Deno (runtime Edge Function), fetch natif. Pas de SDK Resend (un POST suffit).
// RGPD : email envoyé uniquement au modérateur défini, contenu strictement lié à la finalité (modération).

const RESEND_API = 'https://api.resend.com/emails';
const FROM_DEFAULT = 'vtt.bzh <onboarding@resend.dev>';

type SupabaseWebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  schema: string;
};

const escapeHtml = (str: unknown): string =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEmail = (record: Record<string, unknown>, supabaseUrl: string) => {
  const id = String(record.id ?? '');
  const name = escapeHtml(record.name);
  const date = escapeHtml(record.date);
  const hour = escapeHtml(record.hour);
  const city = escapeHtml(record.city);
  const dept = escapeHtml(record.departement);
  const place = escapeHtml(record.place);
  const orga = escapeHtml(record.organisateur);
  const contact = escapeHtml(record.contact);
  const website = escapeHtml(record.website);
  const description = escapeHtml(record.description);
  const origin = escapeHtml(record.origin);

  const dashboardUrl = supabaseUrl ? `${supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/editor')}` : '';

  const subject = `[vtt.bzh] Nouvelle rando publiée : ${record.name ?? 'sans titre'} (${record.date ?? '?'})`;

  const html = `
    <h2 style="font-family:sans-serif">Nouvelle rando publiée sur vtt.bzh</h2>
    <p style="font-family:sans-serif;color:#666">Origin <code>${origin}</code> — id <code>${id}</code></p>
    <table style="font-family:sans-serif;border-collapse:collapse">
      <tr><td><b>Nom</b></td><td>${name}</td></tr>
      <tr><td><b>Date</b></td><td>${date} — ${hour}</td></tr>
      <tr><td><b>Ville</b></td><td>${city} (${dept})</td></tr>
      <tr><td><b>Lieu RDV</b></td><td>${place}</td></tr>
      <tr><td><b>Organisateur</b></td><td>${orga}</td></tr>
      <tr><td><b>Contact</b></td><td>${contact}</td></tr>
      <tr><td><b>Site</b></td><td>${website}</td></tr>
      <tr><td><b>Description</b></td><td><pre style="white-space:pre-wrap">${description}</pre></td></tr>
    </table>
    <p style="font-family:sans-serif">
      Pour modérer (passer <code>active=false</code>) :
      <a href="${dashboardUrl}">ouvrir la table dans Supabase</a>
    </p>
  `.trim();

  const text = [
    `Nouvelle rando publiée sur vtt.bzh`,
    ``,
    `Nom         : ${record.name ?? ''}`,
    `Date / heure: ${record.date ?? ''} ${record.hour ?? ''}`,
    `Ville       : ${record.city ?? ''} (${record.departement ?? ''})`,
    `Lieu RDV    : ${record.place ?? ''}`,
    `Organisateur: ${record.organisateur ?? ''}`,
    `Contact     : ${record.contact ?? ''}`,
    `Site        : ${record.website ?? ''}`,
    ``,
    `Description :`,
    `${record.description ?? ''}`,
    ``,
    `Origin: ${record.origin ?? ''}`,
    `Id    : ${id}`,
    ``,
    `Modérer : ${dashboardUrl}`,
  ].join('\n');

  return { subject, html, text };
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
  const provided = req.headers.get('x-webhook-secret');
  if (!expectedSecret || provided !== expectedSecret) {
    return new Response('unauthorized', { status: 401 });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const moderatorEmail = Deno.env.get('MODERATOR_EMAIL');
  const fromAddress = Deno.env.get('NOTIFY_FROM') ?? FROM_DEFAULT;
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!resendApiKey || !moderatorEmail) {
    console.error('[notify-new-event] missing RESEND_API_KEY or MODERATOR_EMAIL');
    return new Response('config missing', { status: 500 });
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('[notify-new-event] invalid JSON', err);
    return new Response('bad request', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'events') {
    return new Response('ignored', { status: 200 });
  }

  const origin = String(payload.record?.origin ?? '');
  if (!origin.startsWith('public-form/')) {
    return new Response('ignored (non-public)', { status: 200 });
  }

  const { subject, html, text } = buildEmail(payload.record, supabaseUrl);

  const sendRes = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [moderatorEmail],
      subject,
      html,
      text,
    }),
  });

  if (!sendRes.ok) {
    const detail = await sendRes.text();
    console.error('[notify-new-event] Resend error', sendRes.status, detail);
    return new Response('send failed', { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
