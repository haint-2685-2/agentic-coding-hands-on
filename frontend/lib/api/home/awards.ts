import type { Award } from './types';
import type { Locale } from '@/lib/i18n/locale';
import { anonHeaders, endpoint } from './endpoint';

/**
 * Server-side wrapper for `GET /functions/v1/awards?locale=…`.
 * Returns a typed result so the page can render an error state without
 * crashing. The detail endpoint is owned by the `/awards` page feature.
 */
export type AwardsResult =
  | { ok: true; items: Award[] }
  | { ok: false; code: 'http' | 'network' | 'parse'; status?: number };

export async function listAwards(locale: Locale): Promise<AwardsResult> {
  try {
    const res = await fetch(
      endpoint(`/awards?locale=${encodeURIComponent(locale)}`),
      {
        method: 'GET',
        headers: anonHeaders(),
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return { ok: false, code: 'http', status: res.status };
    const data = (await res.json()) as { items?: unknown };
    if (!Array.isArray(data.items)) return { ok: false, code: 'parse' };
    const items: Award[] = data.items.flatMap((it) => {
      if (!it || typeof it !== 'object') return [];
      const row = it as Record<string, unknown>;
      const slug = typeof row.slug === 'string' ? row.slug : null;
      const title = typeof row.title === 'string' ? row.title : null;
      const id = typeof row.id === 'string' ? row.id : null;
      if (!slug || !title || !id) return [];
      return [
        {
          id,
          slug,
          title,
          short_description:
            typeof row.short_description === 'string' ? row.short_description : '',
          hero_image_path:
            typeof row.hero_image_path === 'string' ? row.hero_image_path : '',
          display_order:
            typeof row.display_order === 'number' ? row.display_order : 0,
        },
      ];
    });
    return { ok: true, items };
  } catch {
    return { ok: false, code: 'network' };
  }
}
