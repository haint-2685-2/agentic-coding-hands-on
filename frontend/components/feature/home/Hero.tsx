import Image from 'next/image';
import Link from 'next/link';
import { Countdown } from './Countdown';
import type { EventConfig } from '@/lib/api/home/types';
import type { HomeStrings } from '@/lib/i18n/home';

interface HeroProps {
  eventConfig: EventConfig;
  strings: HomeStrings;
}

export function Hero({ eventConfig, strings }: HeroProps) {
  // Display strings live in `home.ts` per locale. The DB row still owns the
  // canonical `event_start_at` timestamp (used by the countdown logic), but
  // the human-readable label/location/broadcast are i18n'd from FE so all 3
  // locales see translated copy. Admins editing the DB strings is a no-op
  // for display until/unless event_config grows locale-aware columns.
  const eventTimeLabel = strings.eventTimeFallback;
  const eventLocation = strings.eventLocationFallback;
  const broadcastNote = strings.broadcastNoteFallback;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex w-full max-w-[1224px] flex-col items-start gap-[40px]"
    >
      <h1 id="hero-title" className="flex h-[200px] w-[451px] max-w-full">
        <Image
          src="/assets/homepage-saa/root-further-logo.png"
          alt={`${strings.heroLine1} ${strings.heroLine2}`}
          width={451}
          height={200}
          priority
          className="h-auto w-full object-contain"
        />
      </h1>

      <div className="flex w-full flex-col gap-[16px]">
        <Countdown
          eventStartAt={eventConfig.event_start_at}
          isStarted={eventConfig.is_started}
          strings={strings}
        />

        <dl className="mt-[16px] flex flex-col gap-[8px] font-montserrat text-[16px] leading-[24px] tracking-[0.5px] text-white">
          <div className="flex flex-wrap items-center gap-x-[40px] gap-y-[8px]">
            <div className="inline-flex items-baseline gap-[6px]">
              <dt className="font-medium text-white/80">{strings.eventTimeLabel}:</dt>
              <dd className="font-bold">{eventTimeLabel}</dd>
            </div>
            <div className="inline-flex items-baseline gap-[6px]">
              <dt className="font-medium text-white/80">{strings.eventLocationLabel}:</dt>
              <dd className="font-bold">{eventLocation}</dd>
            </div>
          </div>
          <div>
            <dt className="sr-only">Broadcast</dt>
            <dd className="font-bold">{broadcastNote}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-[24px] md:gap-[40px]">
        <Link
          href="/awards"
          className="inline-flex h-[60px] items-center gap-[8px] rounded-[8px] bg-saa-cta px-[24px] py-[16px] font-montserrat text-[16px] font-bold leading-[28px] text-saa-cta-foreground transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <span>{strings.ctaAwards}</span>
          <Image
            src="/assets/homepage-saa/cta-arrow-dark.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </Link>
        <Link
          href="/kudos"
          className="inline-flex h-[60px] items-center gap-[8px] rounded-[8px] border border-saa-border bg-[rgba(255,234,158,0.10)] px-[24px] py-[16px] font-montserrat text-[16px] font-bold leading-[28px] text-saa-cta transition-colors hover:bg-[rgba(255,234,158,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <span>{strings.ctaKudos}</span>
          <Image
            src="/assets/homepage-saa/cta-arrow.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </Link>
      </div>
    </section>
  );
}
