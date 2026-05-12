/**
 * Typed wrapper for `GET /functions/v1/users?q=&limit=`.
 *
 * Used by the Viết Kudo receiver typeahead and the `@mention` autocomplete in
 * the message textarea. The BE contract lives in
 * `backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md` US2 / FR-006.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { authHeaders, endpoint } from '@/lib/api/home/endpoint';
import type { ApiResult } from '@/lib/api/kudos/types';

export interface UserSuggestion {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department_name: string | null;
}

interface UserSearchResponse {
  items?: UserSuggestion[];
}

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
    /* non-JSON body */
  }
  return {
    code: body.error?.code ?? `http/${res.status}`,
    message: body.error?.message ?? `HTTP ${res.status}`,
  };
}

export async function searchUsers(
  supabase: SupabaseClient,
  q: string,
  init?: { signal?: AbortSignal; limit?: number },
): Promise<ApiResult<UserSuggestion[]>> {
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return { ok: true, data: [] };
  }
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
  const query = `?q=${encodeURIComponent(trimmed)}&limit=${limit}`;
  let res: Response;
  try {
    res = await fetch(endpoint(`/users${query}`), {
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
  const body = (await res.json()) as UserSearchResponse;
  return { ok: true, data: Array.isArray(body.items) ? body.items : [] };
}
