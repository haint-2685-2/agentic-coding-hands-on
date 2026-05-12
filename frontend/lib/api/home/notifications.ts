import type {
  NotificationItem,
  NotificationsListResponse,
  UnreadCountResponse,
} from './types';
import { authHeaders, endpoint } from './endpoint';

/**
 * Client-side wrappers for the authenticated notification endpoints.
 * All four reject with a typed error so the polling lifecycle can
 * react to 401s without spinning forever.
 */

export async function getUnreadCount(
  token: string,
  init?: { signal?: AbortSignal },
): Promise<UnreadCountResponse> {
  const res = await fetch(endpoint('/me/notifications/unread-count'), {
    method: 'GET',
    headers: authHeaders(token),
    cache: 'no-store',
    signal: init?.signal,
  });
  if (!res.ok) throw new Error(`unread-count/http-${res.status}`);
  const data = (await res.json()) as Partial<UnreadCountResponse>;
  return {
    unread_count:
      typeof data.unread_count === 'number' && data.unread_count >= 0
        ? data.unread_count
        : 0,
  };
}

export async function listNotifications(
  token: string,
  before?: string | null,
  init?: { signal?: AbortSignal },
): Promise<NotificationsListResponse> {
  const url = before
    ? endpoint(`/me/notifications?limit=20&before=${encodeURIComponent(before)}`)
    : endpoint('/me/notifications?limit=20');
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
    cache: 'no-store',
    signal: init?.signal,
  });
  if (!res.ok) throw new Error(`notifications/http-${res.status}`);
  const data = (await res.json()) as Partial<NotificationsListResponse>;
  const items: NotificationItem[] = Array.isArray(data.items)
    ? (data.items as NotificationItem[])
    : [];
  return {
    items,
    next_cursor:
      typeof data.next_cursor === 'string' ? data.next_cursor : null,
  };
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<{ ok: boolean }> {
  const res = await fetch(endpoint(`/me/notifications/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ read: true }),
    cache: 'no-store',
  });
  return { ok: res.ok };
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ ok: boolean; updated: number }> {
  const res = await fetch(endpoint('/me/notifications/mark-all-read'), {
    method: 'POST',
    headers: authHeaders(token),
    body: '{}',
    cache: 'no-store',
  });
  if (!res.ok) return { ok: false, updated: 0 };
  try {
    const data = (await res.json()) as { updated?: number };
    return { ok: true, updated: typeof data.updated === 'number' ? data.updated : 0 };
  } catch {
    return { ok: true, updated: 0 };
  }
}
