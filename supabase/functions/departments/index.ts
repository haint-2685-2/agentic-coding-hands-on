import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    await requireUser(req);
    const svc = serviceClient();
    const { data, error } = await svc.from('department').select('id, name').order('name');
    if (error) return err(500, 'internal/load-failed', error.message);
    return ok({ items: data ?? [] }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
