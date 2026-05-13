/**
 * Typed wrappers for the Kudos Live Board Edge Functions.
 *
 * All functions accept a Supabase client (server or browser); the token is
 * pulled lazily via `getSession()` so the same wrapper works from RSC, RCC,
 * and event handlers.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { authHeaders, endpoint } from '@/lib/api/home/endpoint';
import type {
  ApiResult,
  Department,
  Hashtag,
  HighlightsResponse,
  Kudo,
  KudoListResponse,
  KudosFilters,
  KudosStats,
  LikeResponse,
  SpotlightResponse,
} from './types';

interface BackendErrorBody {
  error?: { code?: string; message?: string };
}

async function bearer(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

async function readError(res: Response): Promise<{ code: string; message: string }> {
  let body: BackendErrorBody = {};
  try {
    body = (await res.json()) as BackendErrorBody;
  } catch {
    /* non-JSON body — ignore */
  }
  return {
    code: body.error?.code ?? `http/${res.status}`,
    message: body.error?.message ?? `HTTP ${res.status}`,
  };
}

async function get<T>(
  supabase: SupabaseClient,
  path: string,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<T>> {
  const token = await bearer(supabase);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'auth/required',
      message: 'Not authenticated',
    };
  }
  let res: Response;
  try {
    res = await fetch(endpoint(path), {
      method: 'GET',
      headers: authHeaders(token),
      cache: 'no-store',
      signal: init?.signal,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: 'network',
      message: 'Network error',
    };
  }
  if (!res.ok) {
    const { code, message } = await readError(res);
    return { ok: false, status: res.status, code, message };
  }
  const data = (await res.json()) as T;
  return { ok: true, data };
}

export async function listKudos(
  supabase: SupabaseClient,
  args: { limit?: number; before?: string } & KudosFilters,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<KudoListResponse>> {
  const q = buildQuery({
    limit: args.limit ?? 20,
    before: args.before,
    hashtag: args.hashtag,
    department: args.department,
  });
  const result = await get<Partial<KudoListResponse>>(
    supabase,
    `/kudos${q}`,
    init,
  );
  if (!result.ok) return result;
  const items = Array.isArray(result.data.items)
    ? (result.data.items as Kudo[])
    : [];
  return {
    ok: true,
    data: {
      items,
      next_cursor:
        typeof result.data.next_cursor === 'string'
          ? result.data.next_cursor
          : null,
    },
  };
}

export async function listHighlights(
  supabase: SupabaseClient,
  filters: KudosFilters,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<HighlightsResponse>> {
  const q = buildQuery({
    hashtag: filters.hashtag,
    department: filters.department,
  });
  const result = await get<Partial<HighlightsResponse>>(
    supabase,
    `/kudos-highlights${q}`,
    init,
  );
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      items: Array.isArray(result.data.items)
        ? (result.data.items as Kudo[])
        : [],
    },
  };
}

export async function getSpotlight(
  supabase: SupabaseClient,
  args: { q?: string },
  init?: { signal?: AbortSignal },
): Promise<ApiResult<SpotlightResponse>> {
  const token = await bearer(supabase);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'auth/required',
      message: 'Not authenticated',
    };
  }
  const query = buildQuery({ q: args.q });
  let res: Response;
  try {
    res = await fetch(endpoint(`/kudos-spotlight${query}`), {
      method: 'GET',
      headers: authHeaders(token),
      cache: 'no-store',
      signal: init?.signal,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: 'network',
      message: 'Network error',
    };
  }
  if (!res.ok) {
    const { code, message } = await readError(res);
    return { ok: false, status: res.status, code, message };
  }
  const body = (await res.json()) as Partial<SpotlightResponse>;
  const truncated = res.headers.get('x-truncated') === 'true';
  return {
    ok: true,
    data: {
      items: Array.isArray(body.items) ? body.items : [],
      total_kudos: typeof body.total_kudos === 'number' ? body.total_kudos : 0,
      truncated,
    },
  };
}

export async function getKudosStats(
  supabase: SupabaseClient,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<KudosStats>> {
  const result = await get<Partial<KudosStats>>(supabase, '/kudos-stats', init);
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      total_kudos: typeof d.total_kudos === 'number' ? d.total_kudos : 0,
      total_senders: typeof d.total_senders === 'number' ? d.total_senders : 0,
      total_receivers:
        typeof d.total_receivers === 'number' ? d.total_receivers : 0,
      total_hearts: typeof d.total_hearts === 'number' ? d.total_hearts : 0,
      top_senders: Array.isArray(d.top_senders) ? d.top_senders : [],
      top_receivers: Array.isArray(d.top_receivers) ? d.top_receivers : [],
      my_received: typeof d.my_received === 'number' ? d.my_received : 0,
      my_sent: typeof d.my_sent === 'number' ? d.my_sent : 0,
      my_hearts: typeof d.my_hearts === 'number' ? d.my_hearts : 0,
      my_boxes_opened:
        typeof d.my_boxes_opened === 'number' ? d.my_boxes_opened : 0,
      my_boxes_pending:
        typeof d.my_boxes_pending === 'number' ? d.my_boxes_pending : 0,
    },
  };
}

export async function listHashtags(
  supabase: SupabaseClient,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<Hashtag[]>> {
  const result = await get<{ items?: Hashtag[] }>(
    supabase,
    '/hashtags?limit=50',
    init,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.items ?? [] };
}

export async function listDepartments(
  supabase: SupabaseClient,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<Department[]>> {
  const result = await get<{ items?: Department[] }>(
    supabase,
    '/departments',
    init,
  );
  if (!result.ok) return result;
  return { ok: true, data: result.data.items ?? [] };
}

export async function toggleLike(
  supabase: SupabaseClient,
  id: string,
  currentLiked: boolean,
): Promise<ApiResult<LikeResponse>> {
  const token = await bearer(supabase);
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'auth/required',
      message: 'Not authenticated',
    };
  }
  const method = currentLiked ? 'DELETE' : 'POST';
  let res: Response;
  try {
    res = await fetch(endpoint(`/kudos-like?id=${encodeURIComponent(id)}`), {
      method,
      headers: authHeaders(token),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: 'network',
      message: 'Network error',
    };
  }
  if (!res.ok) {
    const { code, message } = await readError(res);
    return { ok: false, status: res.status, code, message };
  }
  const data = (await res.json()) as Partial<LikeResponse>;
  return {
    ok: true,
    data: {
      liked: data.liked ?? !currentLiked,
      like_count: typeof data.like_count === 'number' ? data.like_count : 0,
      hearts_added: typeof data.hearts_added === 'number' ? data.hearts_added : 0,
    },
  };
}
