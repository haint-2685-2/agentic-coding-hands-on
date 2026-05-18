import { serve } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { privateNoStore } from '../_shared/cache.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { loadKudoBundle } from '../_shared/kudo-load.ts';
import { toKudoJSON } from '../_shared/kudo-shape.ts';

const HIGHLIGHT_LIMIT = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'GET') return err(405, 'http/method-not-allowed', 'Only GET allowed.');

  try {
    const ctx = await requireUser(req);
    const url = new URL(req.url);
    const hashtag = url.searchParams.get('hashtag');
    const departmentId = url.searchParams.get('department');
    const svc = serviceClient();

    let q = svc
      .from('kudo_highlights_v')
      .select('id, sender_id, receiver_id, title, message, is_anonymous, created_at, total_hearts')
      .order('total_hearts', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(HIGHLIGHT_LIMIT * 4); // overfetch for filter

    const { data: hl, error } = await q;
    if (error) return err(500, 'internal/load-failed', error.message);
    let head = (hl ?? []) as { id: string; sender_id: string; receiver_id: string; message: string; is_anonymous: boolean; created_at: string; total_hearts: number }[];

    if (hashtag) {
      const { data: tagged } = await svc.from('kudo_hashtag').select('kudo_id').eq('hashtag_slug', hashtag);
      const ok = new Set((tagged ?? []).map((r) => (r as { kudo_id: string }).kudo_id));
      head = head.filter((h) => ok.has(h.id));
    }
    if (departmentId) {
      const { data: usersInDept } = await svc.from('app_user').select('id').eq('department_id', departmentId);
      const ok = new Set((usersInDept ?? []).map((r) => (r as { id: string }).id));
      head = head.filter((h) => ok.has(h.receiver_id));
    }
    head = head.slice(0, HIGHLIGHT_LIMIT);
    if (head.length === 0) {
      return ok({ items: [] }, { ...privateNoStore(), 'x-ranking-strategy': 'hearts_30d' });
    }

    const bundle = await loadKudoBundle(svc, head.map((h) => h.id), ctx.appUser.id);
    const orderMap = new Map(head.map((h, i) => [h.id, i]));
    bundle.rows.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    const items = bundle.rows.map((r) =>
      toKudoJSON(r, ctx.appUser.id, bundle.parties, bundle.hashtags, bundle.images, bundle.likes, bundle.viewerLikes),
    );
    return ok({ items }, { ...privateNoStore(), 'x-ranking-strategy': 'hearts_30d' });
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
