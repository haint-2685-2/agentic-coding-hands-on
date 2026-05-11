import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return err(400, 'http/missing-id', 'id query param is required.');

  try {
    await requireUser(req);
    const svc = serviceClient();
    const { data, error } = await svc
      .from('app_user')
      .select('id, full_name, avatar_url, is_active, department_id')
      .eq('id', id)
      .maybeSingle();
    if (error) return err(500, 'internal/load-failed', error.message);
    if (!data || data.is_active === false) return err(404, 'user/not_found', 'User not found.');

    let department_name: string | null = null;
    if (data.department_id) {
      const { data: dept } = await svc.from('department').select('name').eq('id', data.department_id).maybeSingle();
      department_name = (dept as { name: string } | null)?.name ?? null;
    }
    return ok({
      id: data.id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      department_name,
      is_active: data.is_active,
    }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
