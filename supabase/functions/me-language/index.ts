import { serve, z, ZodError } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { logEvent } from '../_shared/log.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';
import { AuthError, requireUser } from '../_shared/auth.ts';

const BodySchema = z.object({
  locale: z.enum(['vi', 'en', 'ja']),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'PATCH') {
    return err(405, 'http/method-not-allowed', 'Only PATCH is allowed.');
  }
  const started = performance.now();
  let userIdForLog: string | undefined;
  try {
    const ctx = await requireUser(req);
    userIdForLog = ctx.appUser.id;
    const rl = rateCheck('me-language#patch', ctx.appUser.id);
    if (!rl.ok) {
      logEvent({ fn: 'me-language', user_id: ctx.appUser.id, status: 429 });
      return rateLimited(rl.retryAfterSeconds);
    }

    let parsed: z.infer<typeof BodySchema>;
    try {
      const raw = await req.json();
      parsed = BodySchema.parse(raw);
    } catch (e) {
      if (e instanceof ZodError) {
        return err(422, 'validation/locale', 'Locale must be one of vi|en|ja.');
      }
      return err(400, 'http/invalid-json', 'Body must be valid JSON.');
    }

    const { data, error } = await ctx.supabase
      .from('app_user')
      .update({ locale: parsed.locale })
      .eq('auth_user_id', ctx.user.id)
      .select('id, locale')
      .single();
    if (error || !data) {
      logEvent({ fn: 'me-language', user_id: ctx.appUser.id, status: 500, error_code: error?.code });
      return err(500, 'internal/update-failed', 'Could not update locale.');
    }

    logEvent({
      fn: 'me-language',
      user_id: ctx.appUser.id,
      status: 200,
      latency_ms: Math.round(performance.now() - started),
    });
    return ok({ id: data.id, locale: data.locale });
  } catch (e) {
    if (e instanceof AuthError) {
      logEvent({ fn: 'me-language', user_id: userIdForLog, status: e.response.status });
      return e.response;
    }
    logEvent({ fn: 'me-language', user_id: userIdForLog, status: 500, error_code: 'internal' });
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
