/**
 * Shared helper that joins the Supabase URL with the Edge Function path.
 * Falls back to the conventional local dev URL when the env var is missing
 * (e.g. during isolated unit tests).
 */
export function endpoint(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  return `${base.replace(/\/$/, '')}/functions/v1${path}`;
}

export function anonHeaders(extra?: HeadersInit): HeadersInit {
  // Supabase Edge runtime rejects requests without a Bearer JWT even on
  // functions that don't enforce user-level auth. Send the anon key as
  // bearer so public endpoints (e.g. `/config-event`) pass the runtime
  // gate and we don't fall back to a "null" event_start_at.
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return {
    apikey: anon,
    authorization: `Bearer ${anon}`,
    'content-type': 'application/json',
    ...extra,
  };
}

export function authHeaders(token: string, extra?: HeadersInit): HeadersInit {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return {
    apikey: anon,
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    ...extra,
  };
}
