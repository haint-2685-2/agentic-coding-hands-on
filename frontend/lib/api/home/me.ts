import type { Me } from './types';
import { authHeaders, endpoint } from './endpoint';
import { isLocale } from '@/lib/i18n/locale';

/**
 * Server-side `GET /functions/v1/me`. Throws on any non-2xx — callers
 * (e.g. `getOptionalMe`) catch and treat that as "no session" rather than
 * surfacing the error to the page.
 */
export async function fetchMe(token: string): Promise<Me> {
  const res = await fetch(endpoint('/me'), {
    method: 'GET',
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`me/http-${res.status}`);
  }
  const data = (await res.json()) as Partial<Me>;
  if (!data || typeof data.id !== 'string') {
    throw new Error('me/invalid-shape');
  }
  return {
    id: data.id,
    email: typeof data.email === 'string' ? data.email : '',
    full_name: typeof data.full_name === 'string' ? data.full_name : '',
    avatar_url: typeof data.avatar_url === 'string' ? data.avatar_url : null,
    locale: isLocale(data.locale) ? data.locale : 'vi',
    role: data.role === 'admin' ? 'admin' : 'user',
    is_active: data.is_active !== false,
    department_id:
      typeof data.department_id === 'string' ? data.department_id : null,
    department_name:
      typeof data.department_name === 'string' ? data.department_name : null,
  };
}

/**
 * Client-side fire-and-forget `PATCH /me/language`. Caller passes its own
 * access token (obtained from the browser Supabase client) so this helper
 * is environment-agnostic.
 */
export async function patchLanguage(
  token: string,
  locale: 'vi' | 'en',
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(endpoint('/me-language'), {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ locale }),
      cache: 'no-store',
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
