import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { parseSubmissionRequest } from './request.ts';
import { validateSubmission } from './validation.ts';

const ALLOWED_ORIGINS = new Set(['https://www.vtt.bzh', 'https://vtt.bzh']);
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX = 5;
const MAX_BODY_BYTES = 12_000;
const KIT_NEWSLETTER_ENDPOINT = 'https://app.kit.com/forms/9677378/subscriptions';
const NATIVE_SUCCESS_URL = 'https://www.vtt.bzh/calendrier/soumission-confirmee.html';

const isAllowedOrigin = (origin: string): boolean =>
  ALLOWED_ORIGINS.has(origin) || /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/u.test(origin);

const corsHeaders = (origin: string): HeadersInit => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
});

const json = (origin: string, body: unknown, status: number): Response =>
  Response.json(body, {
    status,
    headers: {
      ...corsHeaders(origin),
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });

const getSecretKey = (): string => {
  const current = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (current) {
    try {
      const keys = JSON.parse(current) as Record<string, string>;
      if (keys.submit_event) return keys.submit_event;
      if (keys.default) return keys.default;
    } catch {
      console.error('[submit-event] invalid SUPABASE_SECRET_KEYS');
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
};

const getClientIp = (request: Request): string =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('cf-connecting-ip')?.trim() ||
  'unknown';

const fingerprint = async (value: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const subscribeNewsletter = async (email: string): Promise<void> => {
  try {
    const response = await fetch(KIT_NEWSLETTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email_address: email }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) console.warn('[submit-event] newsletter subscription failed', response.status);
  } catch {
    console.warn('[submit-event] newsletter subscription unavailable');
  }
};

const consumeRateLimit = async (
  admin: ReturnType<typeof createClient>,
  request: Request,
  salt: string
): Promise<'allowed' | 'limited' | 'unavailable'> => {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
  const expiresBefore = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
  const hash = await fingerprint(getClientIp(request), salt);

  const { error: insertError } = await admin.from('event_submission_attempts').insert({ fingerprint: hash });
  if (insertError) {
    console.error('[submit-event] rate-limit insert failed', JSON.stringify(insertError));
    return 'unavailable';
  }

  const { count, error: countError } = await admin
    .from('event_submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('fingerprint', hash)
    .gte('created_at', windowStart);
  if (countError || count === null) {
    console.error('[submit-event] rate-limit count failed', countError?.code ?? countError?.message);
    return 'unavailable';
  }

  const { error: cleanupError } = await admin
    .from('event_submission_attempts')
    .delete()
    .lt('created_at', expiresBefore);
  if (cleanupError)
    console.error('[submit-event] rate-limit cleanup failed', cleanupError.code ?? cleanupError.message);

  return count > RATE_LIMIT_MAX ? 'limited' : 'allowed';
};

Deno.serve(async (request: Request): Promise<Response> => {
  const origin = request.headers.get('origin') ?? '';
  if (!isAllowedOrigin(origin)) return new Response('forbidden origin', { status: 403 });

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json(origin, { error: 'method_not_allowed' }, 405);

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) return json(origin, { error: 'payload_too_large' }, 413);

  const body = await request.text();
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
    return json(origin, { error: 'payload_too_large' }, 413);
  }
  const parsed = parseSubmissionRequest(request.headers.get('content-type') ?? '', body);
  if (!parsed.ok) {
    const status = parsed.error === 'unsupported_media_type' ? 415 : 400;
    return json(origin, { error: parsed.error }, status);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const secretKey = getSecretKey();
  const rateLimitSalt = Deno.env.get('RATE_LIMIT_SALT') ?? '';
  if (!supabaseUrl || !secretKey || !rateLimitSalt) {
    console.error('[submit-event] missing server configuration');
    return json(origin, { error: 'temporarily_unavailable' }, 503);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const limit = await consumeRateLimit(admin, request, rateLimitSalt);
  if (limit === 'limited') return json(origin, { error: 'rate_limited' }, 429);
  if (limit === 'unavailable') return json(origin, { error: 'temporarily_unavailable' }, 503);

  const validation = validateSubmission(parsed.payload);
  if (!validation.ok) return json(origin, { error: 'validation_error', fields: validation.fields }, 422);

  const { data, error } = await admin
    .from('events')
    .insert({
      ...validation.value,
      active: true,
      canceled: false,
      kind: 'vtt',
      lock: false,
      origin: `public-form/edge/${crypto.randomUUID()}`,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[submit-event] insert failed', error.code);
    return json(origin, { error: 'insert_failed' }, 503);
  }

  if (parsed.nativeForm && parsed.newsletter) await subscribeNewsletter(validation.value.email);
  if (parsed.nativeForm) {
    return new Response(null, {
      status: 303,
      headers: {
        ...corsHeaders(origin),
        'Cache-Control': 'no-store',
        Location: NATIVE_SUCCESS_URL,
      },
    });
  }

  return json(origin, { ok: true, id: data.id }, 201);
});
