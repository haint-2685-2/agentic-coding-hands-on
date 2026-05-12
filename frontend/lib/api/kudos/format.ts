import type { Locale } from '@/lib/i18n/locale';

const VI: Record<string, (n: number) => string> = {
  s: (n) => (n <= 5 ? 'Vừa xong' : `${n} giây trước`),
  m: (n) => `${n} phút trước`,
  h: (n) => `${n} giờ trước`,
  d: (n) => `${n} ngày trước`,
  w: (n) => `${n} tuần trước`,
  mo: (n) => `${n} tháng trước`,
  y: (n) => `${n} năm trước`,
};

const EN: Record<string, (n: number) => string> = {
  s: (n) => (n <= 5 ? 'just now' : `${n}s ago`),
  m: (n) => `${n}m ago`,
  h: (n) => `${n}h ago`,
  d: (n) => `${n}d ago`,
  w: (n) => `${n}w ago`,
  mo: (n) => `${n}mo ago`,
  y: (n) => `${n}y ago`,
};

/**
 * Lightweight relative-time formatter. The BE returns ISO timestamps; we
 * keep formatting deterministic on the server side so RSC + client hydration
 * agree on the first paint. Months use a 30-day approximation which is fine
 * for the feed's purpose.
 */
export function formatRelativeTime(iso: string, locale: Locale): string {
  const now = Date.now();
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  const table = locale === 'en' ? EN : VI;
  if (diffSec < 60) return table.s(diffSec);
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return table.m(diffMin);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return table.h(diffHr);
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return table.d(diffDay);
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 4) return table.w(diffWk);
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return table.mo(diffMo);
  const diffYr = Math.floor(diffDay / 365);
  return table.y(diffYr);
}

/**
 * `1,234` style compact number formatter used in stats and like counts.
 */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
