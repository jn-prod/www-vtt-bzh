// Edge Function : notif Telegram modération à chaque nouvel event public-form/.
// Déploiement : supabase functions deploy notify-new-event --no-verify-jwt
// Config : secrets TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, WEBHOOK_SECRET.
// Trigger : Supabase Database Webhook (Settings → Database Webhooks) sur INSERT public.events,
// avec header personnalisé `x-webhook-secret: <WEBHOOK_SECRET>` et URL de cette function.
//
// Stack : Deno (runtime Edge Function), fetch natif. Pas de SDK Telegram (un POST suffit).
// RGPD : message envoyé uniquement au chat Telegram du modérateur, contenu strictement lié à la finalité (modération).

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}/sendMessage`;
const MAX_MESSAGE_LEN = 3500; // Telegram impose 4096, on garde une marge pour wrappers HTML.

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
    .replace(/>/g, '&gt;');

const truncate = (str: string, max: number): string => (str.length <= max ? str : `${str.slice(0, max - 1)}…`);

// Extrait le project ref depuis SUPABASE_URL (format `https://<ref>.supabase.co`).
const extractProjectRef = (supabaseUrl: string): string => {
  const match = supabaseUrl.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match ? match[1] : '';
};

const buildModerationUrl = (projectRef: string, eventId: string): string => {
  if (!projectRef || !eventId) return '';
  // SQL editor avec UPDATE pré-rempli — 1 clic pour ouvrir, 1 clic pour exécuter (Cmd+Enter).
  const sql = `update public.events set active = false where id = '${eventId}' returning id, name, active;`;
  return `https://supabase.com/dashboard/project/${projectRef}/sql/new?content=${encodeURIComponent(sql)}`;
};

const buildRowUrl = (projectRef: string, eventId: string): string => {
  if (!projectRef || !eventId) return '';
  // Ouvre le table editor (l'humain peut filtrer sur l'id pour voir/modifier la ligne complète).
  return `https://supabase.com/dashboard/project/${projectRef}/editor`;
};

const buildTelegramMessage = (record: Record<string, unknown>, supabaseUrl: string): string => {
  const id = String(record.id ?? '');
  const projectRef = extractProjectRef(supabaseUrl);
  const moderationUrl = buildModerationUrl(projectRef, id);
  const rowUrl = buildRowUrl(projectRef, id);

  const lines = [
    `🆕 <b>Nouvelle rando publiée sur vtt.bzh</b>`,
    ``,
    `<b>${escapeHtml(record.name) || 'Sans titre'}</b>`,
    `🗓 ${escapeHtml(record.date)} ${escapeHtml(record.hour)}`,
    `📍 ${escapeHtml(record.city)} (${escapeHtml(record.departement)})`,
  ];

  if (record.place) lines.push(`👉 RDV : ${escapeHtml(record.place)}`);
  if (record.organisateur) lines.push(`👥 Organisateur : ${escapeHtml(record.organisateur)}`);
  if (record.contact) lines.push(`✉️ Contact : ${escapeHtml(record.contact)}`);
  if (record.website) lines.push(`🔗 ${escapeHtml(record.website)}`);
  if (record.price) lines.push(`💶 ${escapeHtml(record.price)}`);
  if (record.description) {
    lines.push(``, `<i>${escapeHtml(record.description)}</i>`);
  }

  lines.push(``, `<code>id ${id}</code>`, `<code>origin ${escapeHtml(record.origin)}</code>`);

  if (moderationUrl) {
    lines.push(``, `🛡 <a href="${moderationUrl}">Désactiver en 1 clic (SQL Editor)</a>`);
  }
  if (rowUrl) {
    lines.push(`📋 <a href="${rowUrl}">Ouvrir la table events</a>`);
  }

  return truncate(lines.join('\n'), MAX_MESSAGE_LEN);
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

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!botToken || !chatId) {
    console.error('[notify-new-event] missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
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

  const text = buildTelegramMessage(payload.record, supabaseUrl);

  const sendRes = await fetch(TELEGRAM_API(botToken), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!sendRes.ok) {
    const detail = await sendRes.text();
    console.error('[notify-new-event] Telegram error', sendRes.status, detail);
    return new Response('send failed', { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
