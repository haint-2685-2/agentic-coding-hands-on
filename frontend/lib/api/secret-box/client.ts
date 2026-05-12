/**
 * Typed wrappers for the Secret Box Edge Functions.
 *
 * `getSecretBoxesCount` reads counters + recent history.
 * `openSecretBox` opens exactly one box and returns a discriminated-union
 * result. Both functions are isomorphic — they take a Supabase client
 * (server- or browser-side) so the bearer-token plumbing stays on the
 * caller's side.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { parseRetryAfter } from './format';
import type {
  Badge,
  OpenBoxResult,
  SecretBoxesResponse,
} from './types';

const FN_BASE = '/functions/v1';

function endpoint(path: string): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  return `${url.replace(/\/$/, '')}${FN_BASE}${path}`;
}

async function authHeader(
  supabase: SupabaseClient,
): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const headers: Record<string, string> = {
    apikey: anon,
    'content-type': 'application/json',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

export async function getSecretBoxesCount(
  supabase: SupabaseClient,
  init?: { signal?: AbortSignal },
): Promise<SecretBoxesResponse> {
  const res = await fetch(endpoint('/me/secret-boxes'), {
    method: 'GET',
    headers: await authHeader(supabase),
    cache: 'no-store',
    signal: init?.signal,
  });
  if (!res.ok) {
    // Return a safe empty shape on any non-2xx so the page still renders.
    return { unopened_count: 0, opened_count: 0, opened: [] };
  }
  const json = (await res.json()) as Partial<SecretBoxesResponse>;
  return {
    unopened_count:
      typeof json.unopened_count === 'number' ? json.unopened_count : 0,
    opened_count:
      typeof json.opened_count === 'number' ? json.opened_count : 0,
    opened: Array.isArray(json.opened) ? json.opened : [],
  };
}

interface BackendErrorBody {
  error?: { code?: string; message?: string };
}

export async function openSecretBox(
  supabase: SupabaseClient,
  init?: { signal?: AbortSignal },
): Promise<OpenBoxResult> {
  let res: Response;
  try {
    res = await fetch(endpoint('/me/secret-boxes/open'), {
      method: 'POST',
      headers: await authHeader(supabase),
      // FE NEVER sends `badge_code`. Empty body, full stop (TR-007 / SC-004).
      body: '{}',
      cache: 'no-store',
      signal: init?.signal,
    });
  } catch {
    return { ok: false, code: 'network', message: 'network error' };
  }

  if (res.ok) {
    const data = (await res.json()) as {
      badge: Badge;
      unopened_count: number;
    };
    return {
      ok: true,
      badge: data.badge,
      unopened_count: data.unopened_count,
    };
  }

  let body: BackendErrorBody = {};
  try {
    body = (await res.json()) as BackendErrorBody;
  } catch {
    /* non-JSON body — ignore */
  }
  const code = (body.error?.code ?? 'unknown') as OpenBoxResult extends {
    ok: false;
    code: infer C;
  }
    ? C
    : never;
  const message = body.error?.message ?? `HTTP ${res.status}`;
  const retryAfter =
    res.status === 429 ? parseRetryAfter(res.headers) : undefined;

  if (res.status === 401) {
    return { ok: false, code: 'auth/required', message };
  }
  if (res.status === 403) {
    return { ok: false, code: 'auth/account-disabled', message };
  }
  if (res.status === 409) {
    return { ok: false, code: 'secret_box/no_boxes', message };
  }
  if (res.status === 429) {
    return { ok: false, code: 'rate/limited', message, retryAfter };
  }
  return { ok: false, code: code || 'unknown', message };
}
