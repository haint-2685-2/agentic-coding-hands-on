import { serve, z } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { publicCache, privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { logEvent } from '../_shared/log.ts';

const Locale = z.enum(['vi', 'en', 'ja']);

type AwardRow = {
  id: string;
  slug: string;
  title_vi: string;
  title_en: string;
  title_ja: string | null;
  short_description_vi: string;
  short_description_en: string;
  short_description_ja: string | null;
  hero_image_path: string;
  display_order: number;
  long_description_vi?: string | null;
  long_description_en?: string | null;
  long_description_ja?: string | null;
  quantity?: number;
  unit_type?: string;
  value_vnd?: number;
  value_vnd_team?: number | null;
};

function pickLocale<T>(row: Record<string, unknown>, base: string, locale: 'vi' | 'en' | 'ja'): T {
  const key = `${base}_${locale}`;
  const v = row[key];
  if (v !== null && v !== undefined && v !== '') return v as T;
  return (row[`${base}_vi`] as T) ?? ('' as unknown as T);
}

function toSummary(row: AwardRow, locale: 'vi' | 'en' | 'ja') {
  return {
    id: row.id,
    slug: row.slug,
    title: pickLocale<string>(row as unknown as Record<string, unknown>, 'title', locale),
    short_description: pickLocale<string>(row as unknown as Record<string, unknown>, 'short_description', locale),
    hero_image_path: row.hero_image_path,
    display_order: row.display_order,
  };
}

function toDetail(row: AwardRow, locale: 'vi' | 'en' | 'ja') {
  return {
    ...toSummary(row, locale),
    long_description: pickLocale<string>(row as unknown as Record<string, unknown>, 'long_description', locale),
    quantity: row.quantity ?? null,
    unit_type: row.unit_type ?? null,
    value_vnd: row.value_vnd ?? null,
    value_vnd_team: row.value_vnd_team ?? null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET is allowed.');
  const url = new URL(req.url);
  const localeRaw = url.searchParams.get('locale') ?? 'vi';
  const detail = url.searchParams.get('detail') === 'true';
  const localeRes = Locale.safeParse(localeRaw);
  if (!localeRes.success) return err(422, 'validation/locale', 'Locale must be one of vi|en|ja.');
  const locale = localeRes.data;

  const started = performance.now();
  try {
    // detail variant requires auth
    if (detail) {
      try {
        await requireUser(req);
      } catch (e) {
        if (e instanceof AuthError) return e.response;
        throw e;
      }
    }

    const svc = serviceClient();
    const selectCols = detail
      ? 'id, slug, title_vi, title_en, title_ja, short_description_vi, short_description_en, short_description_ja, long_description_vi, long_description_en, long_description_ja, hero_image_path, display_order, quantity, unit_type, value_vnd, value_vnd_team'
      : 'id, slug, title_vi, title_en, title_ja, short_description_vi, short_description_en, short_description_ja, hero_image_path, display_order';

    const { data, error } = await svc
      .from('award')
      .select(selectCols)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) {
      logEvent({ fn: 'awards', status: 500, error_code: error.code });
      return err(500, 'internal/load-failed', 'Could not load awards.');
    }

    const rows = data as unknown as AwardRow[];
    const items = rows.map((r) => (detail ? toDetail(r, locale) : toSummary(r, locale)));

    logEvent({ fn: 'awards', status: 200, latency_ms: Math.round(performance.now() - started) });
    return ok({ items }, detail ? privateNoStore() : publicCache(60));
  } catch (_e) {
    logEvent({ fn: 'awards', status: 500, error_code: 'internal' });
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
