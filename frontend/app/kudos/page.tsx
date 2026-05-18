import { redirect } from 'next/navigation';
import Image from 'next/image';
import { getOptionalMe } from '@/lib/auth/optional-session';
import { readLocaleFromCookies } from '@/lib/auth/locale-cookie';
import { createClient } from '@/lib/supabase/server';
import { getHomeStrings } from '@/lib/i18n/home';
import { getKudosStrings } from '@/lib/i18n/kudos';
import {
  getKudosStats,
  getSpotlight,
  listDepartments,
  listHashtags,
  listHighlights,
  listKudos,
} from '@/lib/api/kudos/client';
import type {
  Department,
  Hashtag,
  Kudo,
  KudosStats,
  SpotlightResponse,
} from '@/lib/api/kudos/types';

import { HomeHeader } from '@/components/feature/home/HomeHeader';
import { HomeFooter } from '@/components/feature/home/HomeFooter';
import { KudosBanner } from '@/components/feature/kudos-live/KudosBanner';
import { QuickInputPill } from '@/components/feature/kudos-live/QuickInputPill';
import { FilterBar } from '@/components/feature/kudos-live/FilterBar';
import { HighlightCarousel } from '@/components/feature/kudos-live/HighlightCarousel';
import { KudoFeed } from '@/components/feature/kudos-live/KudoFeed';
import { SpotlightPane } from '@/components/feature/kudos-live/SpotlightPane';
import { SidebarStats } from '@/components/feature/kudos-live/SidebarStats';
import { LikesProvider } from '@/components/feature/kudos-live/LikesProvider';
import { EmptyState } from '@/components/feature/kudos-live/EmptyState';
import { KudoCreatedToast } from '@/components/feature/kudos-live/KudoCreatedToast';

interface KudosPageProps {
  searchParams: {
    hashtag?: string;
    department?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function KudosPage({ searchParams }: KudosPageProps) {
  // Auth gate — anon visitors bounce to /login with a return-to.
  const me = await getOptionalMe();
  if (!me) {
    redirect('/login?next=/kudos');
  }

  const locale = readLocaleFromCookies();
  const homeStrings = getHomeStrings(locale);
  const strings = getKudosStrings(locale);
  const supabase = createClient();
  const filters = {
    hashtag: searchParams.hashtag,
    department: searchParams.department,
  };

  // Parallel server-side fetches so the page hydrates fast on first paint.
  const [feed, highlights, hashtags, departments, stats, spotlight] =
    await Promise.all([
      listKudos(supabase, { limit: 20, ...filters }),
      listHighlights(supabase, filters),
      listHashtags(supabase),
      listDepartments(supabase),
      getKudosStats(supabase),
      getSpotlight(supabase, {}),
    ]);

  const initialItems: Kudo[] = feed.ok ? feed.data.items : [];
  const initialCursor = feed.ok ? feed.data.next_cursor : null;
  const initialHighlights: Kudo[] = highlights.ok ? highlights.data.items : [];
  const initialHashtags: Hashtag[] = hashtags.ok ? hashtags.data : [];
  const initialDepartments: Department[] = departments.ok ? departments.data : [];
  const initialStats: KudosStats = stats.ok
    ? stats.data
    : {
        total_kudos: 0,
        total_senders: 0,
        total_receivers: 0,
        total_hearts: 0,
        top_senders: [],
        top_receivers: [],
        my_received: 0,
        my_sent: 0,
        my_hearts: 0,
        my_boxes_opened: 0,
        my_boxes_pending: 0,
      };
  const initialSpotlight: SpotlightResponse = spotlight.ok
    ? spotlight.data
    : { items: [], total_kudos: 0, truncated: false };

  // Seed list for the LikesProvider — union of feed and highlights so both
  // surfaces see consistent like state on the first paint.
  const seed: Kudo[] = [...initialItems];
  for (const h of initialHighlights) {
    if (!seed.some((k) => k.id === h.id)) seed.push(h);
  }

  return (
    <div className="relative min-h-screen bg-saa-bg text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[512px]"
        aria-hidden="true"
      >
        <Image
          src="/assets/kudos-live-board/kv-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-saa-bg/60 to-saa-bg" />
      </div>

      <HomeHeader locale={locale} strings={homeStrings} me={me} />
      <KudoCreatedToast message={strings.createdSuccess} />

      <LikesProvider initial={seed}>
        <main className="relative z-10 flex flex-col items-center gap-[80px] px-6 pb-[120px] pt-[160px] lg:px-[144px]">
          {/* Banner + quick-input pill */}
          <section className="flex w-full max-w-[1152px] flex-col items-start gap-[40px]">
            <KudosBanner strings={strings} />
            <div className="flex w-full flex-row items-center gap-[16px]">
              <QuickInputPill strings={strings} />
            </div>
          </section>

          {/* Highlight section */}
          <section className="flex w-full max-w-[1152px] flex-col items-stretch gap-[40px]">
            <header className="flex w-full flex-col items-stretch gap-[16px]">
              <p className="font-montserrat text-[20px] font-bold leading-[28px] text-white/90 md:text-[24px] md:leading-[32px]">
                Sun* Annual Awards 2025
              </p>
              <div className="h-px w-full bg-saa-divider" />
              <div className="flex flex-row flex-wrap items-center justify-between gap-[24px]">
                <h1 className="font-montserrat text-[32px] font-bold leading-[40px] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]">
                  HIGHLIGHT KUDOS
                </h1>
                <FilterBar
                  hashtags={initialHashtags}
                  departments={initialDepartments}
                  strings={strings}
                />
              </div>
            </header>
            {initialHighlights.length > 0 ? (
              <HighlightCarousel
                initial={initialHighlights}
                locale={locale}
                strings={strings}
              />
            ) : (
              <EmptyState label={strings.feedEmpty} />
            )}
          </section>

          {/* Spotlight section */}
          <section className="flex w-full max-w-[1152px] flex-col items-stretch gap-[40px]">
            <header className="flex w-full flex-col items-stretch gap-[16px]">
              <p className="font-montserrat text-[20px] font-bold leading-[28px] text-white/90 md:text-[24px] md:leading-[32px]">
                Sun* Annual Awards 2025
              </p>
              <div className="h-px w-full bg-saa-divider" />
              <h2 className="font-montserrat text-[32px] font-bold leading-[40px] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]">
                SPOTLIGHT BOARD
              </h2>
            </header>
            <SpotlightPane initial={initialSpotlight} strings={strings} />
          </section>

          {/* All Kudos + Sidebar */}
          <section className="flex w-full max-w-[1296px] flex-col items-stretch gap-[40px]">
            <header className="flex w-full max-w-[1152px] flex-col items-stretch gap-[16px] self-center">
              <p className="font-montserrat text-[20px] font-bold leading-[28px] text-white/90 md:text-[24px] md:leading-[32px]">
                Sun* Annual Awards 2025
              </p>
              <div className="h-px w-full bg-saa-divider" />
              <h2 className="font-montserrat text-[32px] font-bold leading-[40px] tracking-[-0.25px] text-saa-gold md:text-[57px] md:leading-[64px]">
                ALL KUDOS
              </h2>
            </header>
            <div className="flex w-full flex-col gap-[40px] lg:flex-row lg:items-start lg:justify-between lg:gap-[80px]">
              <div className="min-w-0 flex-1">
                <KudoFeed
                  initialItems={initialItems}
                  initialCursor={initialCursor}
                  locale={locale}
                  strings={strings}
                />
              </div>
              <SidebarStats stats={initialStats} strings={strings} />
            </div>
          </section>
        </main>
      </LikesProvider>

      <HomeFooter strings={homeStrings} />
    </div>
  );
}
