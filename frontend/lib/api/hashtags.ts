/**
 * Typed wrapper for `GET /functions/v1/hashtags?q=&limit=`.
 *
 * The Live Board uses a no-arg `listHashtags()` (in `lib/api/kudos/client.ts`)
 * to populate the filter bar; here we add a query-friendly variant used by
 * the Viết Kudo hashtag picker. BE contract: backend FR-007.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { authHeaders, endpoint } from '@/lib/api/home/endpoint';
import type { ApiResult, Hashtag } from '@/lib/api/kudos/types';

interface BackendErrorBody {
  error?: { code?: string; message?: string };
}

async function bearer(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function readError(
  res: Response,
): Promise<{ code: string; message: string }> {
  let body: BackendErrorBody = {};
  try {
    body = (await res.json()) as BackendErrorBody;
  } catch {
    /* non-JSON */
  }
  return {
    code: body.error?.code ?? `http/${res.status}`,
    message: body.error?.message ?? `HTTP ${res.status}`,
  };
}

export async function searchHashtags(
  supabase: SupabaseClient,
  q: string,
  init?: { signal?: AbortSignal; limit?: number },
): Promise<ApiResult<Hashtag[]>> {
  const trimmed = q.trim();
  const token = await bearer(supabase);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'auth/required',
      message: 'Not authenticated',
    };
  }
  const limit = init?.limit ?? 10;
  const params = new URLSearchParams();
  if (trimmed) params.set('q', trimmed);
  params.set('limit', String(limit));
  let res: Response;
  try {
    res = await fetch(endpoint(`/hashtags?${params.toString()}`), {
      method: 'GET',
      headers: authHeaders(token),
      cache: 'no-store',
      signal: init?.signal,
    });
  } catch {
    return { ok: false, status: 0, code: 'network', message: 'Network error' };
  }
  if (!res.ok) {
    const { code, message } = await readError(res);
    return { ok: false, status: res.status, code, message };
  }
  const body = (await res.json()) as { items?: Hashtag[] };
  return { ok: true, data: Array.isArray(body.items) ? body.items : [] };
}
