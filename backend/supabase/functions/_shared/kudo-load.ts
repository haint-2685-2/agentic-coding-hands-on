import type { SupabaseClient } from './deps.ts';
import type { KudoRow, PartyInfo } from './kudo-shape.ts';

export type KudoBundle = {
  rows: KudoRow[];
  parties: Map<string, PartyInfo>;
  hashtags: Map<string, string[]>;
  images: Map<string, { id: string; path: string; position: number }[]>;
  likes: Map<string, { count: number; hearts: number }>;
  viewerLikes: Set<string>;
};

export async function loadKudoBundle(
  service: SupabaseClient,
  kudoIds: string[],
  viewerAppUserId: string,
): Promise<KudoBundle> {
  const rowsRes = await service
    .from('kudo')
    .select('id, sender_id, receiver_id, message, is_anonymous, created_at')
    .in('id', kudoIds);
  const rows = (rowsRes.data ?? []) as KudoRow[];

  const partyIds = new Set<string>();
  for (const r of rows) {
    partyIds.add(r.sender_id);
    partyIds.add(r.receiver_id);
  }
  const partyRes = await service
    .from('app_user')
    .select('id, full_name, avatar_url, department_id')
    .in('id', [...partyIds]);
  const deptRes = await service.from('department').select('id, name');
  const deptMap = new Map<string, string>();
  for (const d of (deptRes.data ?? []) as { id: string; name: string }[]) {
    deptMap.set(d.id, d.name);
  }
  // Hero tier per user — view `app_user_hero_v` rolls up distinct-sender
  // counts (Figma `New/Rising/Super/Legend Hero`). Users with 0 received
  // Kudos are absent from the view → tier stays null on the FE.
  const heroRes = await service
    .from('app_user_hero_v')
    .select('user_id, tier')
    .in('user_id', [...partyIds]);
  const heroMap = new Map<string, 'new' | 'rising' | 'super' | 'legend'>();
  for (const h of (heroRes.data ?? []) as { user_id: string; tier: string }[]) {
    if (
      h.tier === 'new' ||
      h.tier === 'rising' ||
      h.tier === 'super' ||
      h.tier === 'legend'
    ) {
      heroMap.set(h.user_id, h.tier);
    }
  }
  const parties = new Map<string, PartyInfo>();
  for (const p of (partyRes.data ?? []) as { id: string; full_name: string; avatar_url: string | null; department_id: string | null }[]) {
    parties.set(p.id, {
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      department_id: p.department_id,
      department_name: p.department_id ? deptMap.get(p.department_id) ?? null : null,
      hero_tier: heroMap.get(p.id) ?? null,
    });
  }

  const hashtagRes = await service
    .from('kudo_hashtag')
    .select('kudo_id, hashtag_slug')
    .in('kudo_id', kudoIds);
  const hashtags = new Map<string, string[]>();
  for (const h of (hashtagRes.data ?? []) as { kudo_id: string; hashtag_slug: string }[]) {
    const arr = hashtags.get(h.kudo_id) ?? [];
    arr.push(h.hashtag_slug);
    hashtags.set(h.kudo_id, arr);
  }

  const imgRes = await service
    .from('kudo_image')
    .select('id, kudo_id, path, position')
    .in('kudo_id', kudoIds)
    .order('position');
  const images = new Map<string, { id: string; path: string; position: number }[]>();
  for (const im of (imgRes.data ?? []) as { id: string; kudo_id: string; path: string; position: number }[]) {
    const arr = images.get(im.kudo_id) ?? [];
    arr.push({ id: im.id, path: im.path, position: im.position });
    images.set(im.kudo_id, arr);
  }

  const likeRes = await service
    .from('kudo_like')
    .select('kudo_id, user_id, hearts')
    .in('kudo_id', kudoIds);
  const likes = new Map<string, { count: number; hearts: number }>();
  const viewerLikes = new Set<string>();
  for (const l of (likeRes.data ?? []) as { kudo_id: string; user_id: string; hearts: number }[]) {
    const cur = likes.get(l.kudo_id) ?? { count: 0, hearts: 0 };
    cur.count += 1;
    cur.hearts += l.hearts;
    likes.set(l.kudo_id, cur);
    if (l.user_id === viewerAppUserId) viewerLikes.add(l.kudo_id);
  }

  return { rows, parties, hashtags, images, likes, viewerLikes };
}
