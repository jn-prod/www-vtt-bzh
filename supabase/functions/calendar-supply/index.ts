import { createClient } from 'npm:@supabase/supabase-js@2.112.3';
import { buildCalendarSupplyMetrics, type EventRecord } from './metrics.ts';

const TOKEN_ENV = 'VTT_CALENDAR_ANALYTICS_TOKEN';

const serverKey = (): string => {
  const current = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (current) {
    try {
      const keys = JSON.parse(current) as Record<string, string>;
      if (keys.default) return keys.default;
      const first = Object.values(keys)[0];
      if (first) return first;
    } catch {
      console.error('[calendar-supply] invalid SUPABASE_SECRET_KEYS');
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
};

const constantTimeEqual = async (left: string, right: string): Promise<boolean> => {
  if (left.length !== right.length) return false;
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  return a.reduce((difference, value, index) => difference | (value ^ b[index]), 0) === 0;
};

const authorized = async (request: Request, expected: string): Promise<boolean> => {
  const value = request.headers.get('authorization');
  if (!value?.startsWith('Bearer ')) return false;
  return constantTimeEqual(value.slice('Bearer '.length), expected);
};

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' } });

const readAllEvents = async (admin: ReturnType<typeof createClient>): Promise<EventRecord[]> => {
  const rows: EventRecord[] = [];
  const pageSize = 1_000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('events')
      .select('created_at,date,active,canceled,origin')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data as EventRecord[]));
    if (data.length < pageSize) return rows;
  }
};

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
  const token = Deno.env.get(TOKEN_ENV) ?? '';
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = serverKey();
  if (!token || !url || !key) {
    console.error('[calendar-supply] missing server configuration');
    return json({ error: 'temporarily_unavailable' }, 503);
  }
  if (!(await authorized(request, token))) return json({ error: 'unauthorized' }, 401);
  try {
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    return json(buildCalendarSupplyMetrics(await readAllEvents(admin)));
  } catch (error) {
    console.error('[calendar-supply] query failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'temporarily_unavailable' }, 503);
  }
});
