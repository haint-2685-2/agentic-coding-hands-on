/**
 * Domain types for the Homepage SAA wrappers.
 *
 * Authoritative shapes live in:
 *   backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md
 */

import type { Locale } from '@/lib/i18n/locale';

export interface EventConfig {
  event_start_at: string | null;
  event_location: string;
  event_time_label: string;
  broadcast_note: string | null;
  is_started: boolean;
}

export interface Award {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  hero_image_path: string;
  display_order: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Me {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  locale: Locale;
  role: 'user' | 'admin';
  is_active: boolean;
  department_id: string | null;
  department_name: string | null;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationsListResponse {
  items: NotificationItem[];
  next_cursor: string | null;
}
