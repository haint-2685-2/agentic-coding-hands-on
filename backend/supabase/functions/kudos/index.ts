import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';
import { buildNextCursor, parseCursor, parseLimit } from '../_shared/pagination.ts';
import { loadKudoBundle } from '../_shared/kudo-load.ts';
import { toKudoJSON } from '../_shared/kudo-shape.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET is allowed.');

  try {
    const ctx = await requireUser(req);
    const rl = rateCheck('kudos#list', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    const url = new URL(req.url);
    const limitRes = parseLimit(url.searchParams.get('limit'), 20, 100);
    if (!limitRes.ok) return err(422, 'validation/limit', 'limit must be 1..100.');
    const cursorRes = parseCursor(url.searchParams.get('before'));
    if (!cursorRes.ok) return err(422, 'validation/cursor', 'before must be ISO-8601.');

    const hashtag = url.searchParams.get('hashtag');
    const departmentId = url.searchParams.get('department');

    const svc = serviceClient();

    // collect ids matching filters, then load bundle
    let q = svc.from('kudo').select('id, created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limitRes.value);
    if (cursorRes.value.before) q = q.lt('created_at', cursorRes.value.before.toISOString());
    if (departmentId) {
      // receiver department filter — sub-select
      const { data: recIds } = await svc.from('app_user').select('id').eq('department_id', departmentId);
      const ids = (recIds ?? []).map((r) => (r as { id: string }).id);
      if (ids.length === 0) return ok({ items: [], next_cursor: null }, privateNoStore());
      q = q.in('receiver_id', ids);
    }
    if (hashtag) {
      const { data: kudoIdsByTag } = await svc.from('kudo_hashtag').select('kudo_id').eq('hashtag_slug', hashtag);
      const ids = (kudoIdsByTag ?? []).map((r) => (r as { kudo_id: string }).kudo_id);
      if (ids.length === 0) return ok({ items: [], next_cursor: null }, privateNoStore());
      q = q.in('id', ids);
    }

    const { data: head, error } = await q;
    if (error) return err(500, 'internal/load-failed', error.message);
    const headRows = (head ?? []) as { id: string; created_at: string }[];
    if (headRows.length === 0) return ok({ items: [], next_cursor: null }, privateNoStore());

    const bundle = await loadKudoBundle(svc, headRows.map((h) => h.id), ctx.appUser.id);
    // preserve head order
    const orderMap = new Map(headRows.map((h, i) => [h.id, i]));
    bundle.rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    const items = bundle.rows.map((r) =>
      toKudoJSON(r, ctx.appUser.id, bundle.parties, bundle.hashtags, bundle.images, bundle.likes, bundle.viewerLikes),
    );

    const next_cursor = buildNextCursor(headRows, limitRes.value);
    return ok({ items, next_cursor }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
