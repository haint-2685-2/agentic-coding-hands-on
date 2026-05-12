// Simple in-memory LRU with TTL — per-instance dedup of identical payloads.

const TTL_MS = 60_000;
const MAX_ENTRIES = 1000;

const cache = new Map<string, number>();

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAndStore(payload: string): Promise<{ duplicate: boolean }> {
  const key = await sha256Hex(payload);
  const now = Date.now();
  // evict expired
  for (const [k, ts] of cache) {
    if (now - ts >= TTL_MS) cache.delete(k);
  }
  // size cap
  while (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value;
    if (first === undefined) break;
    cache.delete(first);
  }
  if (cache.has(key)) return { duplicate: true };
  cache.set(key, now);
  return { duplicate: false };
}

export function _reset(): void {
  cache.clear();
}

export function makeDedupKey(parts: { sender: string; receiver: string; message: string; hashtags: string[] }): string {
  const tags = [...parts.hashtags].sort().join(',');
  return `${parts.sender}|${parts.receiver}|${parts.message}|${tags}`;
}
