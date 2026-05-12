import { serve, z } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';

const QuerySchema = z.object({
  q: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    await requireUser(req);
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) return err(422, 'validation/query', 'Invalid query params.');

    const svc = serviceClient();
    let q = svc.from('hashtag').select('slug, name, usage_count').order('usage_count', { ascending: false }).limit(parsed.data.limit);
    if (parsed.data.q && parsed.data.q.length > 0) {
      const prefix = parsed.data.q.toLowerCase();
      q = q.ilike('slug', `${prefix}%`);
    }
    const { data, error } = await q;
    if (error) return err(500, 'internal/load-failed', error.message);
    return ok({ items: data ?? [] }, privateNoStore());
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
