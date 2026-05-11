import { serve, z } from '../_shared/deps.ts';
import { err, handleOptions, ok, rateLimited } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';

const QuerySchema = z.object({ q: z.string().max(100).optional() });
const SPOTLIGHT_LIMIT = 500;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    const ctx = await requireUser(req);
    const rl = rateCheck('kudos-spotlight#get', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    const url = new URL(req.url);
    const rawQ = url.searchParams.get('q') ?? undefined;
    const parsed = QuerySchema.safeParse({ q: rawQ });
    if (!parsed.success) {
      return err(422, 'validation/q', 'q must be ≤ 100 characters.');
    }
    const qStr = (parsed.data.q ?? '').trim();

    const svc = serviceClient();
    // load all kudos receivers + join app_user + department, aggregate in memory
    const { data: kudoRows, error } = await svc.from('kudo').select('receiver_id');
    if (error) return err(500, 'internal/load-failed', error.message);
    const counts = new Map<string, number>();
    for (const r of (kudoRows ?? []) as { receiver_id: string }[]) {
      counts.set(r.receiver_id, (counts.get(r.receiver_id) ?? 0) + 1);
    }
    const total = (kudoRows ?? []).length;
    if (counts.size === 0) return ok({ items: [], total_kudos: 0 }, privateNoStore());

    const { data: users } = await svc
      .from('app_user')
      .select('id, full_name, avatar_url, department_id')
      .in('id', [...counts.keys()]);
    const { data: depts } = await svc.from('department').select('id, name');
    const deptMap = new Map<string, string>();
    for (const d of (depts ?? []) as { id: string; name: string }[]) deptMap.set(d.id, d.name);

    let items = ((users ?? []) as { id: string; full_name: string; avatar_url: string | null; department_id: string | null }[]).map((u) => ({
      user_id: u.id,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      department_name: u.department_id ? deptMap.get(u.department_id) ?? null : null,
      count: counts.get(u.id) ?? 0,
    }));

    if (qStr.length > 0) {
      const needle = qStr.toLowerCase();
      items = items.filter((i) => i.full_name.toLowerCase().includes(needle));
    }
    items.sort((a, b) => b.count - a.count);
    const truncated = items.length > SPOTLIGHT_LIMIT;
    items = items.slice(0, SPOTLIGHT_LIMIT);

    const headers: HeadersInit = { ...privateNoStore() };
    if (truncated) (headers as Record<string, string>)['x-truncated'] = 'true';
    return ok({ items, total_kudos: total }, headers);
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
