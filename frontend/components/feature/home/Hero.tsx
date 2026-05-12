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
  const eventTimeLabel =
    eventConfig.event_time_label || strings.eventTimeFallback;
  const eventLocation =
    eventConfig.event_location || strings.eventLocationFallback;
  const broadcastNote =
    eventConfig.broadcast_note || strings.broadcastNoteFallback;

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

        <dl className="mt-[16px] flex flex-col gap-[8px] font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.5px] text-white">
          <div className="flex flex-wrap items-center gap-x-[60px] gap-y-[8px]">
            <dt className="sr-only">Time</dt>
            <dd>{eventTimeLabel}</dd>
            <dt className="sr-only">Location</dt>
            <dd>{eventLocation}</dd>
          </div>
          <div>
            <dt className="sr-only">Broadcast</dt>
            <dd>{broadcastNote}</dd>
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
            src="/assets/homepage-saa/cta-arrow.svg"
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
