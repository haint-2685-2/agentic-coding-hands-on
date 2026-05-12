import { serve, z, ZodError } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';

const OpenBody = z.object({}).strict();

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    const ctx = await requireUser(req);

    if (req.method === 'POST' && action === 'open') {
      const rl = rateCheck('me-secret-boxes#open', ctx.appUser.id);
      if (!rl.ok) return rateLimited(rl.retryAfterSeconds);
      try {
        const raw = await req.json().catch(() => ({}));
        OpenBody.parse(raw);
      } catch (e) {
        if (e instanceof ZodError) {
          return err(422, 'validation/unknown_keys', 'Body must be empty {}.');
        }
        return err(400, 'http/invalid-json', 'Body must be valid JSON.');
      }
      const { data, error } = await ctx.supabase.rpc('fn_open_secret_box');
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === 'P0002') return err(409, 'secret_box/no_boxes', 'No unopened secret boxes.');
        if (code === '42501') return err(401, 'auth/required', 'Authentication required.');
        return err(500, 'internal/rpc-failed', error.message);
      }
      const result = data as { badge_code: string; unopened_count: number };
      // load badge to return localised name
      const svc = serviceClient();
      const { data: badge } = await svc
        .from('badge')
        .select('code, name_vi, name_en, name_ja, description_vi, description_en, image_path')
        .eq('code', result.badge_code)
        .single();
      return ok({
        badge: badge ?? { code: result.badge_code },
        unopened_count: result.unopened_count,
      }, privateNoStore());
    }

    if (req.method !== 'GET') {
      return err(405, 'http/method-not-allowed', 'GET or POST allowed.');
    }

    // GET — counters + recent history
    const svc = serviceClient();
    const { data: unopened } = await svc
      .from('secret_box')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.appUser.id)
      .is('opened_at', null);
    const unopenedCount = (unopened as unknown as { length?: number } | null)?.length ?? 0;

    const { data: openedRows } = await svc
      .from('secret_box')
      .select('badge_code, opened_at')
      .eq('user_id', ctx.appUser.id)
      .not('opened_at', 'is', null)
      .order('opened_at', { ascending: false })
      .limit(20);

    // unopened count via separate exact count
    const { count: unopenedExact } = await svc
      .from('secret_box')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.appUser.id)
      .is('opened_at', null);

    const { count: openedExact } = await svc
      .from('secret_box')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.appUser.id)
      .not('opened_at', 'is', null);

    return ok({
      unopened_count: unopenedExact ?? 0,
      opened_count: openedExact ?? 0,
      opened: (openedRows ?? []).map((r) => ({
        badge_code: (r as { badge_code: string }).badge_code,
        opened_at: (r as { opened_at: string }).opened_at,
      })),
    }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
