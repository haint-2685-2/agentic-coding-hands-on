import { anonHeaders, authHeaders, endpoint } from '@/lib/api/home/endpoint';
import type { Locale } from '@/lib/i18n/locale';
import type { AwardDetail, AwardUnitType } from './types';

export type AwardsDetailResult =
  | { ok: true; items: AwardDetail[] }
  | { ok: false; code: 'http' | 'network' | 'parse' | 'auth'; status?: number };

const VALID_UNITS: readonly AwardUnitType[] = [
  'Đơn vị',
  'Tập thể',
  'Cá nhân',
  'Cá nhân hoặc Tập thể',
];

function pickUnit(raw: unknown): AwardUnitType {
  if (typeof raw === 'string' && (VALID_UNITS as readonly string[]).includes(raw)) {
    return raw as AwardUnitType;
  }
  return 'Cá nhân';
}

interface Options {
  locale: Locale;
  accessToken?: string;
}

/**
 * Server-side wrapper for `GET /functions/v1/awards?detail=true&locale=…`.
 *
 * Returns the auth-gated batch payload — all six awards in one round trip
 * (per BE spec FR-002). A 401 surfaces as `{ ok: false, code: 'auth' }` so
 * the caller can `redirect('/login?next=/awards')` instead of crashing.
 */
export async function getAwardsDetail(
  opts: Options,
): Promise<AwardsDetailResult> {
  const url = endpoint(
    `/awards?detail=true&locale=${encodeURIComponent(opts.locale)}`,
  );
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: opts.accessToken
        ? authHeaders(opts.accessToken)
        : anonHeaders(),
      cache: 'no-store',
    });
    if (res.status === 401) return { ok: false, code: 'auth', status: 401 };
    if (!res.ok) return { ok: false, code: 'http', status: res.status };
    const data = (await res.json()) as { items?: unknown };
    if (!Array.isArray(data.items)) return { ok: false, code: 'parse' };
    const items: AwardDetail[] = data.items.flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return [];
      const row = raw as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : null;
      const slug = typeof row.slug === 'string' ? row.slug : null;
      const title = typeof row.title === 'string' ? row.title : null;
      if (!id || !slug || !title) return [];
      return [
        {
          id,
          slug,
          title,
          short_description:
            typeof row.short_description === 'string'
              ? row.short_description
              : '',
          long_description:
            typeof row.long_description === 'string'
              ? row.long_description
              : '',
          hero_image_path:
            typeof row.hero_image_path === 'string'
              ? row.hero_image_path
              : '',
          display_order:
            typeof row.display_order === 'number' ? row.display_order : 0,
          quantity:
            typeof row.quantity === 'number' && row.quantity > 0
              ? row.quantity
              : 1,
          unit_type: pickUnit(row.unit_type),
          value_vnd:
            typeof row.value_vnd === 'number' && row.value_vnd >= 0
              ? row.value_vnd
              : 0,
          value_vnd_team:
            typeof row.value_vnd_team === 'number' && row.value_vnd_team > 0
              ? row.value_vnd_team
              : null,
        },
      ];
    });
    items.sort((a, b) => a.display_order - b.display_order);
    return { ok: true, items };
  } catch {
    return { ok: false, code: 'network' };
  }
}
