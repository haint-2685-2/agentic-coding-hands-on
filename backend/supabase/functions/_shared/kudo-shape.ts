export type KudoRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_anonymous: boolean;
  created_at: string;
  total_hearts?: number;
};

export type HeroTier = 'new' | 'rising' | 'super' | 'legend' | null;

export type PartyInfo = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department_id: string | null;
  department_name: string | null;
  hero_tier: HeroTier;
};

export type LikeInfo = { kudo_id: string; user_id: string; hearts: number };

export type KudoJSON = {
  id: string;
  created_at: string;
  message: string;
  hashtags: string[];
  images: { id: string; path: string; position: number }[];
  sender: PartyInfo;
  receiver: PartyInfo;
  like_count: number;
  total_hearts: number;
  viewer_has_liked: boolean;
  viewer_is_sender: boolean;
  is_anonymous: boolean;
};

const ANON_SENDER: PartyInfo = {
  id: '00000000-0000-0000-0000-000000000000',
  full_name: 'Ẩn danh',
  avatar_url: null,
  department_id: null,
  department_name: null,
  hero_tier: null,
};

export function toKudoJSON(
  row: KudoRow,
  viewerAppUserId: string,
  parties: Map<string, PartyInfo>,
  hashtags: Map<string, string[]>,
  images: Map<string, { id: string; path: string; position: number }[]>,
  likes: Map<string, { count: number; hearts: number }>,
  viewerLikes: Set<string>,
): KudoJSON {
  const senderRaw = parties.get(row.sender_id);
  const receiver = parties.get(row.receiver_id) ?? ANON_SENDER;
  const stats = likes.get(row.id) ?? { count: 0, hearts: 0 };
  const sender: PartyInfo = row.is_anonymous ? ANON_SENDER : (senderRaw ?? ANON_SENDER);

  return {
    id: row.id,
    created_at: row.created_at,
    message: row.message,
    hashtags: hashtags.get(row.id) ?? [],
    images: images.get(row.id) ?? [],
    sender,
    receiver,
    like_count: stats.count,
    total_hearts: stats.hearts,
    viewer_has_liked: viewerLikes.has(row.id),
    viewer_is_sender: senderRaw?.id === viewerAppUserId,
    is_anonymous: row.is_anonymous,
  };
}
