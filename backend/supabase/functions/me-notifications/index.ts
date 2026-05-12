import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';
import { buildNextCursor, parseCursor, parseLimit } from '../_shared/pagination.ts';
import { logEvent } from '../_shared/log.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  const url = new URL(req.url);
  const wantsCount = url.searchParams.get('count') === 'true';
  const action = url.searchParams.get('action');

  try {
    const ctx = await requireUser(req);

    // POST mark-all-read
    if (req.method === 'POST' && action === 'mark-all-read') {
      const rl = rateCheck('me-notifications#mark-all-read', ctx.appUser.id);
      if (!rl.ok) return rateLimited(rl.retryAfterSeconds);
      const { data, error } = await ctx.supabase
        .from('notification')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', ctx.appUser.id)
        .is('read_at', null)
        .select('id');
      if (error) {
        logEvent({ fn: 'me-notifications#mark-all-read', user_id: ctx.appUser.id, status: 500, error_code: error.code });
        return err(500, 'internal/update-failed', 'Mark-all-read failed.');
      }
      return ok({ updated: data?.length ?? 0 }, privateNoStore());
    }

    if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Method not allowed.');

    // GET unread-count
    if (wantsCount) {
      const rl = rateCheck('me-notifications#count', ctx.appUser.id);
      if (!rl.ok) return rateLimited(rl.retryAfterSeconds);
      const { count, error } = await ctx.supabase
        .from('notification')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.appUser.id)
        .is('read_at', null);
      if (error) {
        return err(500, 'internal/load-failed', 'Unread count failed.');
      }
      return ok({ unread_count: count ?? 0 }, privateNoStore());
    }

    // GET list
    const rl = rateCheck('me-notifications#list', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    const limitRes = parseLimit(url.searchParams.get('limit'), 20, 100);
    if (!limitRes.ok) return err(422, 'validation/limit', 'limit must be 1..100.');
    const limit = limitRes.value;

    const cursorRes = parseCursor(url.searchParams.get('before'));
    if (!cursorRes.ok) return err(422, 'validation/cursor', 'before must be ISO-8601.');

    let q = ctx.supabase
      .from('notification')
      .select('id, type, title, body, link, metadata, read_at, created_at')
      .eq('user_id', ctx.appUser.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (cursorRes.value.before) q = q.lt('created_at', cursorRes.value.before.toISOString());

    const { data, error } = await q;
    if (error) {
      return err(500, 'internal/load-failed', 'Notification list failed.');
    }
    const items = (data ?? []) as { created_at: string }[];
    const next_cursor = buildNextCursor(items, limit);
    return ok({ items, next_cursor }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    logEvent({ fn: 'me-notifications', status: 500, error_code: 'internal' });
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
