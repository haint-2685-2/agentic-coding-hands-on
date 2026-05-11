import { serve, z } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { stripDiacritics } from '../_shared/hashtag-normalise.ts';

const QuerySchema = z.object({
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    const ctx = await requireUser(req);
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) return err(422, 'validation/query', 'Invalid query params.');

    const q = (parsed.data.q ?? '').trim();
    if (q.length === 0) {
      return ok({ items: [] }, privateNoStore());
    }

    const svc = serviceClient();
    const { data, error } = await svc
      .from('app_user')
      .select('id, full_name, avatar_url, department_id, is_active')
      .eq('is_active', true)
      .neq('id', ctx.appUser.id)
      .ilike('full_name', `%${q}%`)
      .limit(parsed.data.limit);
    if (error) return err(500, 'internal/load-failed', error.message);

    // also match diacritic-stripped names client-side
    const needle = stripDiacritics(q.toLowerCase());
    const rows = (data ?? []) as { id: string; full_name: string; avatar_url: string | null; department_id: string | null }[];
    const filtered = rows.filter((r) => {
      const direct = r.full_name.toLowerCase().includes(q.toLowerCase());
      const stripped = stripDiacritics(r.full_name.toLowerCase()).includes(needle);
      return direct || stripped;
    });

    const { data: depts } = await svc.from('department').select('id, name');
    const deptMap = new Map<string, string>();
    for (const d of (depts ?? []) as { id: string; name: string }[]) deptMap.set(d.id, d.name);

    const items = filtered.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      avatar_url: r.avatar_url,
      department_name: r.department_id ? deptMap.get(r.department_id) ?? null : null,
    }));

    return ok({ items }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
