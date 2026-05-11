// Vietnamese diacritic stripper + slug normaliser.
// Matches the rule used by fn_create_kudo for hashtag slugs.

const VN_DIACRITICS_MAP: Record<string, string> = { đ: 'd', Đ: 'd' };

export function stripDiacritics(input: string): string {
  let s = input.normalize('NFD').replace(/\p{M}/gu, '');
  for (const [k, v] of Object.entries(VN_DIACRITICS_MAP)) {
    s = s.replaceAll(k, v);
  }
  return s;
}

export function normaliseHashtag(raw: string): { ok: true; slug: string; name: string } | { ok: false } {
  const trimmed = raw.trim().replace(/^#+/, '');
  if (trimmed.length === 0) return { ok: false };
  const stripped = stripDiacritics(trimmed).toLowerCase();
  let slug = stripped.replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (slug.length === 0 || slug.length > 32) return { ok: false };
  if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false };
  return { ok: true, slug, name: trimmed };
}
