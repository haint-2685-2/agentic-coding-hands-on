import type { SupabaseClient } from './deps.ts';
import { stripDiacritics } from './hashtag-normalise.ts';

const MENTION_RE = /@([\p{L}\p{N}_.-]{1,64})/gu;

export function extractMentions(message: string): string[] {
  const seen = new Set<string>();
  for (const m of message.matchAll(MENTION_RE)) {
    seen.add(m[1]);
  }
  return [...seen];
}

function normaliseName(name: string): string {
  return stripDiacritics(name).toLowerCase().replace(/\s+/g, '');
}

/**
 * Resolve mention tokens against app_user.full_name. Best-effort:
 * tokens that don't match exactly one user are silently dropped.
 * Returns unique app_user ids, excluding the IDs in `excludeIds`.
 */
export async function resolveMentions(
  service: SupabaseClient,
  tokens: string[],
  excludeIds: string[] = [],
): Promise<string[]> {
  if (tokens.length === 0) return [];
  const exclude = new Set(excludeIds);
  const wanted = new Set(tokens.map(normaliseName));

  const { data, error } = await service
    .from('app_user')
    .select('id, full_name, is_active');
  if (error || !data) return [];

  const matched = new Set<string>();
  for (const row of data as { id: string; full_name: string; is_active: boolean }[]) {
    if (!row.is_active) continue;
    if (wanted.has(normaliseName(row.full_name))) {
      if (!exclude.has(row.id)) matched.add(row.id);
    }
  }
  return [...matched];
}
