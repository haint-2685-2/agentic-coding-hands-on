import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return err(400, 'http/missing-id', 'id query param is required.');

  try {
    const ctx = await requireUser(req);
    const rl = rateCheck('kudos-like#post', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    if (req.method === 'POST') {
      const { data, error } = await ctx.supabase.rpc('fn_kudo_like', { p_kudo_id: id });
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === 'P0001') return err(403, 'kudo/cannot_like_own', 'You cannot like your own kudos.');
        if (code === 'P0002') return err(404, 'kudo/not_found', 'Kudo not found.');
        if (code === '42501') return err(401, 'auth/required', 'Authentication required.');
        return err(500, 'internal/rpc-failed', error.message);
      }
      return ok(data, privateNoStore());
    }
    if (req.method === 'DELETE') {
      const { error } = await ctx.supabase
        .from('kudo_like')
        .delete()
        .eq('kudo_id', id)
        .eq('user_id', ctx.appUser.id);
      if (error) return err(500, 'internal/delete-failed', error.message);

      // re-count
      const { count } = await ctx.supabase
        .from('kudo_like')
        .select('kudo_id', { count: 'exact', head: true })
        .eq('kudo_id', id);
      return ok({ liked: false, like_count: count ?? 0 }, privateNoStore());
    }
    return err(405, 'http/method-not-allowed', 'POST or DELETE only.');
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
