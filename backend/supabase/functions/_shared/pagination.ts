export type ParsedCursor = { before: Date | null };

export function parseCursor(beforeRaw: string | null): { ok: true; value: ParsedCursor } | { ok: false } {
  if (!beforeRaw || beforeRaw.length === 0) return { ok: true, value: { before: null } };
  const d = new Date(beforeRaw);
  if (Number.isNaN(d.getTime())) return { ok: false };
  return { ok: true, value: { before: d } };
}

export function parseLimit(raw: string | null, defaultLimit = 20, maxLimit = 100): { ok: true; value: number } | { ok: false } {
  if (!raw) return { ok: true, value: defaultLimit };
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > maxLimit) return { ok: false };
  return { ok: true, value: n };
}

export function buildNextCursor<T extends { created_at: string }>(items: T[], limit: number): string | null {
  if (items.length < limit) return null;
  const last = items[items.length - 1];
  return last?.created_at ?? null;
}
