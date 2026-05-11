import { serve, z } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';

const Locale = z.enum(['vi', 'en', 'ja']);

function pickLocale(row: Record<string, unknown>, base: string, locale: 'vi' | 'en' | 'ja'): string {
  const v = row[`${base}_${locale}`];
  if (typeof v === 'string' && v.length > 0) return v;
  return (row[`${base}_vi`] as string) ?? '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return err(400, 'http/missing-slug', 'slug query param is required.');
  const localeRes = Locale.safeParse(url.searchParams.get('locale') ?? 'vi');
  if (!localeRes.success) return err(422, 'validation/locale', 'Locale must be one of vi|en|ja.');
  const locale = localeRes.data;

  try {
    await requireUser(req);
    const svc = serviceClient();
    const { data, error } = await svc
      .from('award')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return err(500, 'internal/load-failed', error.message);
    if (!data) return err(404, 'award/not_found', 'Award not found.');

    const row = data as Record<string, unknown>;
    const body = {
      id: row.id,
      slug: row.slug,
      title: pickLocale(row, 'title', locale),
      short_description: pickLocale(row, 'short_description', locale),
      long_description: pickLocale(row, 'long_description', locale),
      hero_image_path: row.hero_image_path,
      display_order: row.display_order,
      quantity: row.quantity,
      unit_type: row.unit_type,
      value_vnd: row.value_vnd,
      value_vnd_team: row.value_vnd_team,
    };
    return ok(body, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
