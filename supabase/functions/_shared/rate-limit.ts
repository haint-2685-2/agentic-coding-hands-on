type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

const DEFAULT_WINDOW_MS = 60_000;

export const LIMITS: Record<string, number> = {
  'me#get': 60,
  'me-language#patch': 60,
  'me-notifications#count': 60,
  'me-notifications#list': 30,
  'me-notifications#mark-all-read': 6,
  'me-notifications-id#patch': 30,
  'kudos#list': 60,
  'kudos#post': 10,
  'kudos-like#post': 60,
  'kudos-spotlight#get': 30,
  'kudos-stats#get': 30,
  'config-event#get': 120,
  'awards#get': 120,
  'me-secret-boxes#open': 10,
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function check(key: string, userId: string, rpm?: number): RateLimitResult {
  const limit = rpm ?? LIMITS[key];
  if (!limit) return { ok: true };
  const id = `${key}:${userId}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || now - b.windowStart >= DEFAULT_WINDOW_MS) {
    buckets.set(id, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (b.count >= limit) {
    const elapsed = now - b.windowStart;
    const retryAfterMs = DEFAULT_WINDOW_MS - elapsed;
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  b.count += 1;
  return { ok: true };
}

export function _reset(): void {
  buckets.clear();
}
