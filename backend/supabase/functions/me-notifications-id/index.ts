import { serve, z, ZodError } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';

const BodySchema = z.object({ read: z.literal(true) });

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'PATCH') return err(405, 'http/method-not-allowed', 'Only PATCH is allowed.');

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return err(400, 'http/missing-id', 'id query param is required.');

  try {
    const ctx = await requireUser(req);
    const rl = rateCheck('me-notifications-id#patch', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    try {
      const raw = await req.json();
      BodySchema.parse(raw);
    } catch (e) {
      if (e instanceof ZodError) return err(422, 'validation/body', 'Body must be { read: true }.');
      return err(400, 'http/invalid-json', 'Body must be valid JSON.');
    }

    const { data, error } = await ctx.supabase
      .from('notification')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', ctx.appUser.id)
      .select('id, read_at')
      .maybeSingle();
    if (error) return err(500, 'internal/update-failed', 'Update failed.');
    if (!data) return err(404, 'notification/not_found', 'Notification not found.');

    return ok({ id: data.id, read_at: data.read_at }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
