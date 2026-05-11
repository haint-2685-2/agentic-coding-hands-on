import { serve } from '../_shared/deps.ts';
import { handleOptions, err, ok } from '../_shared/http.ts';
import { logEvent } from '../_shared/log.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';
import { rateLimited } from '../_shared/http.ts';
import { AuthError, requireUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') {
    return err(405, 'http/method-not-allowed', 'Only GET is allowed.');
  }
  const started = performance.now();
  let userIdForLog: string | undefined;
  try {
    const ctx = await requireUser(req);
    userIdForLog = ctx.appUser.id;
    const rl = rateCheck('me#get', ctx.appUser.id);
    if (!rl.ok) {
      logEvent({ fn: 'me', user_id: ctx.appUser.id, status: 429, error_code: 'rate/limited' });
      return rateLimited(rl.retryAfterSeconds);
    }
    const response = ok({
      id: ctx.appUser.id,
      email: ctx.appUser.email,
      full_name: ctx.appUser.full_name,
      avatar_url: ctx.appUser.avatar_url,
      locale: ctx.appUser.locale,
      role: ctx.appUser.role,
      is_active: ctx.appUser.is_active,
    });
    logEvent({
      fn: 'me',
      user_id: ctx.appUser.id,
      status: 200,
      latency_ms: Math.round(performance.now() - started),
    });
    return response;
  } catch (e) {
    if (e instanceof AuthError) {
      logEvent({
        fn: 'me',
        user_id: userIdForLog,
        status: e.response.status,
        error_code: 'auth/*',
      });
      return e.response;
    }
    logEvent({ fn: 'me', user_id: userIdForLog, status: 500, error_code: 'internal' });
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
