/**
 * FE wrappers for the Viết Kudo write path. Adds the three endpoints not
 * covered by the read-only `lib/api/kudos/client.ts`:
 *   - POST /kudos                 — create a kudo (transactional)
 *   - POST /kudos/upload-url      — presigned PUT URL for image upload
 *   - PUT  <presigned URL>        — direct upload to Supabase Storage
 *
 * Contracts: backend/.momorph/specs/ihQ26W78P2-viet-kudo/spec.md FR-001/FR-005.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { authHeaders, endpoint } from '@/lib/api/home/endpoint';
import type { ApiResult } from '@/lib/api/kudos/types';
import type { ValidatedPayload } from '@/lib/validation/kudo';

interface BackendErrorBody {
  error?: { code?: string; message?: string; fields?: string[] };
}

export interface CreateKudoResponse {
  id: string;
  created_at: string;
}

export interface CreateKudoError {
  status: number;
  code: string;
  message: string;
  fields?: string[];
  retryAfterSec?: number;
}

export interface UploadUrlResponse {
  upload_url: string;
  path: string;
}

async function bearer(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function readError(
  res: Response,
): Promise<{ code: string; message: string; fields?: string[] }> {
  let body: BackendErrorBody = {};
  try {
    body = (await res.json()) as BackendErrorBody;
  } catch {
    /* non-JSON */
  }
  return {
    code: body.error?.code ?? `http/${res.status}`,
    message: body.error?.message ?? `HTTP ${res.status}`,
    fields: body.error?.fields,
  };
}

export async function createKudo(
  supabase: SupabaseClient,
  payload: ValidatedPayload,
  init?: { signal?: AbortSignal },
): Promise<
  { ok: true; data: CreateKudoResponse } | { ok: false; error: CreateKudoError }
> {
  const token = await bearer(supabase);
  if (!token) {
    return {
      ok: false,
      error: {
        status: 401,
        code: 'auth/required',
        message: 'Bạn cần đăng nhập để gửi Kudo.',
      },
    };
  }
  let res: Response;
  try {
    res = await fetch(endpoint('/kudos'), {
      method: 'POST',
      headers: authHeaders(token),
      cache: 'no-store',
      body: JSON.stringify(payload),
      signal: init?.signal,
    });
  } catch {
    return {
      ok: false,
      error: {
        status: 0,
        code: 'network',
        message: 'Không gửi được Kudo, vui lòng kiểm tra kết nối.',
      },
    };
  }
  if (!res.ok) {
    const { code, message, fields } = await readError(res);
    const ra = res.headers.get('retry-after');
    return {
      ok: false,
      error: {
        status: res.status,
        code,
        message,
        fields,
        retryAfterSec: ra ? Number(ra) || undefined : undefined,
      },
    };
  }
  const data = (await res.json()) as Partial<CreateKudoResponse>;
  return {
    ok: true,
    data: {
      id: typeof data.id === 'string' ? data.id : '',
      created_at: typeof data.created_at === 'string' ? data.created_at : '',
    },
  };
}

export async function requestUploadUrl(
  supabase: SupabaseClient,
  contentType: string,
  init?: { signal?: AbortSignal },
): Promise<ApiResult<UploadUrlResponse>> {
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
    res = await fetch(endpoint('/kudos/upload-url'), {
      method: 'POST',
      headers: authHeaders(token),
      cache: 'no-store',
      body: JSON.stringify({ content_type: contentType }),
      signal: init?.signal,
    });
  } catch {
    return { ok: false, status: 0, code: 'network', message: 'Network error' };
  }
  if (!res.ok) {
    const { code, message } = await readError(res);
    return { ok: false, status: res.status, code, message };
  }
  const body = (await res.json()) as Partial<UploadUrlResponse>;
  if (typeof body.upload_url !== 'string' || typeof body.path !== 'string') {
    return {
      ok: false,
      status: 500,
      code: 'parse/invalid',
      message: 'Phản hồi không hợp lệ từ máy chủ.',
    };
  }
  return { ok: true, data: { upload_url: body.upload_url, path: body.path } };
}

/**
 * Direct PUT to Supabase Storage using the presigned URL. Uses
 * XMLHttpRequest so we can surface upload progress events; falls back
 * to AbortController via the request's `abort()` method.
 */
export function uploadImageBytes(
  uploadUrl: string,
  file: File,
  opts: { onProgress?: (pct: number) => void; signal?: AbortSignal },
): Promise<{ ok: boolean; status: number }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const onAbort = () => {
      if (!settled) {
        settled = true;
        try {
          xhr.abort();
        } catch {
          /* noop */
        }
        resolve({ ok: false, status: 0 });
      }
    };
    if (opts.signal) {
      if (opts.signal.aborted) {
        resolve({ ok: false, status: 0 });
        return;
      }
      opts.signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('content-type', file.type);
    if (opts.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (!settled) {
        settled = true;
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status });
      }
    };
    xhr.onerror = () => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, status: xhr.status || 0 });
      }
    };
    xhr.send(file);
  });
}
