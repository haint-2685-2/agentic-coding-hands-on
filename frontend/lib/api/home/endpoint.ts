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
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return {
    apikey: anon,
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
