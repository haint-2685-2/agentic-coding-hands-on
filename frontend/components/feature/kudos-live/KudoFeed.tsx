// "use client": IntersectionObserver, polling, optimistic state via Likes.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { listKudos } from '@/lib/api/kudos/client';
import type { Kudo, KudosFilters } from '@/lib/api/kudos/types';
import type { Locale } from '@/lib/i18n/locale';
import type { KudosStrings } from '@/lib/i18n/kudos';
import { KudoCard } from './KudoCard';
import { EmptyState } from './EmptyState';
import { useLikes } from './LikesProvider';

interface KudoFeedProps {
  initialItems: Kudo[];
  initialCursor: string | null;
  locale: Locale;
  strings: KudosStrings;
}

const PAGE_SIZE = 20;
const POLL_MS = 30_000;

export function KudoFeed({
  initialItems,
  initialCursor,
  locale,
  strings,
}: KudoFeedProps) {
  const searchParams = useSearchParams();
  const filters = useMemo<KudosFilters>(
    () => ({
      hashtag: searchParams.get('hashtag') ?? undefined,
      department: searchParams.get('department') ?? undefined,
    }),
    [searchParams],
  );

  const [items, setItems] = useState<Kudo[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const likes = useLikes();
  const filterKey = `${filters.hashtag ?? ''}|${filters.department ?? ''}`;
  const lastFilterKey = useRef(filterKey);
  const scrollDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  // Re-fetch when filters change.
  useEffect(() => {
    if (filterKey === lastFilterKey.current) return;
    lastFilterKey.current = filterKey;
    const controller = new AbortController();
    const supabase = createClient();
    (async () => {
      const res = await listKudos(
        supabase,
        { limit: PAGE_SIZE, ...filters },
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (res.ok) {
        setItems(res.data.items);
        setCursor(res.data.next_cursor);
        likes.seed(res.data.items);
      }
    })();
    return () => controller.abort();
  }, [filterKey, filters, likes]);

  // IntersectionObserver — infinite scroll.
  useEffect(() => {
    if (!cursor) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting || loadingMore || !cursor) return;
        setLoadingMore(true);
        const supabase = createClient();
        const res = await listKudos(supabase, {
          limit: PAGE_SIZE,
          before: cursor,
          ...filters,
        });
        if (res.ok) {
          setItems((prev) => {
            // Dedupe in case of overlap.
            const seen = new Set(prev.map((k) => k.id));
            const fresh = res.data.items.filter((k) => !seen.has(k.id));
            likes.seed(fresh);
            return [...prev, ...fresh];
          });
          setCursor(res.data.next_cursor);
        } else if (res.status === 429) {
          setRateLimited(true);
          setTimeout(() => setRateLimited(false), 60_000);
        }
        setLoadingMore(false);
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, filters, loadingMore, likes]);

  // Scroll flag — pauses polling while user is actively scrolling.
  useEffect(() => {
    function onScroll() {
      isScrolling.current = true;
      if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
      scrollDebounce.current = setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 30s polling — refresh the FIRST page only; merge new items above.
  useEffect(() => {
    async function refreshFirstPage() {
      const supabase = createClient();
      const res = await listKudos(supabase, { limit: PAGE_SIZE, ...filters });
      if (!res.ok) return;
      setItems((prev) => {
        const seen = new Set(prev.map((k) => k.id));
        const fresh = res.data.items.filter((k) => !seen.has(k.id));
        if (fresh.length === 0) return prev;
        likes.seed(fresh);
        return [...fresh, ...prev];
      });
    }
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      if (isScrolling.current) return;
      void refreshFirstPage();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [filters, likes]);

  if (items.length === 0) {
    return <EmptyState label={strings.feedEmpty} />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-[40px]">
      {rateLimited && (
        <div
          role="alert"
          className="w-full max-w-[680px] rounded-[8px] bg-saa-danger/10 px-[16px] py-[12px] font-montserrat text-[14px] font-bold text-saa-danger"
        >
          {strings.rateLimited}
        </div>
      )}
      <ul className="flex w-full flex-col items-center gap-[40px]">
        {items.map((k) => (
          <li key={k.id} className="w-full max-w-[680px]">
            <KudoCard kudo={k} locale={locale} strings={strings} />
          </li>
        ))}
      </ul>
      {cursor && (
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="h-[40px] w-full"
        />
      )}
      {loadingMore && (
        <p className="font-montserrat text-[14px] font-medium text-white/60">
          {strings.feedLoadMore}
        </p>
      )}
    </div>
  );
}

