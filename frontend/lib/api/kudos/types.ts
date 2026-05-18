/**
 * Domain types for the Kudos Live Board.
 *
 * Authoritative shapes live in:
 *   backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md
 */

export type HeroTier = 'new' | 'rising' | 'super' | 'legend' | null;

export interface UserMini {
  id: string | null;
  full_name: string;
  avatar_url: string | null;
  department_id: string | null;
  department_name: string | null;
  hero_tier: HeroTier;
}

export interface KudoImage {
  id: string;
  path: string;
  position: number;
}

export interface Kudo {
  id: string;
  created_at: string;
  title?: string;
  message: string;
  hashtags: string[];
  images: KudoImage[];
  sender: UserMini;
  receiver: UserMini;
  like_count: number;
  viewer_has_liked: boolean;
  viewer_is_sender: boolean;
  is_anonymous?: boolean;
}

export interface KudoListResponse {
  items: Kudo[];
  next_cursor: string | null;
}

export interface HighlightsResponse {
  items: Kudo[];
}

export interface Hashtag {
  slug: string;
  name: string;
  usage_count: number;
}

export interface Department {
  id: string;
  name: string;
  kudo_count: number;
}

export interface SpotlightNode {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  department_name: string | null;
  count: number;
}

export interface SpotlightResponse {
  items: SpotlightNode[];
  total_kudos: number;
  truncated: boolean;
}

export interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  department_name: string | null;
  count: number;
}

export interface KudosStats {
  total_kudos: number;
  total_senders: number;
  total_receivers: number;
  total_hearts: number;
  top_senders: LeaderboardEntry[];
  top_receivers: LeaderboardEntry[];
  // Optional viewer-specific projection used by the sidebar; backend may
  // include or omit these fields. The UI gracefully treats missing fields
  // as `0`.
  my_received?: number;
  my_sent?: number;
  my_hearts?: number;
  my_boxes_opened?: number;
  my_boxes_pending?: number;
}

export interface LikeResponse {
  liked: boolean;
  like_count: number;
  hearts_added: number;
}

export interface KudosFilters {
  hashtag?: string;
  department?: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
    };
