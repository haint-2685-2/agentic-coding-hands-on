// Client component: setInterval(1s), recomputes from wall-clock each tick
// so a hidden tab doesn't drift; respects prefers-reduced-motion by only
// re-rendering the tile when the displayed minute changes.
'use client';

import { useEffect, useState } from 'react';
import type { HomeStrings } from '@/lib/i18n/home';

interface CountdownProps {
  eventStartAt: string | null;
  isStarted: boolean;
  strings: HomeStrings;
}

interface CountdownValues {
  days: string;
  hours: string;
  minutes: string;
  isFrozen: boolean;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function compute(eventStartAt: string | null, isStarted: boolean): CountdownValues {
  if (isStarted) {
    return { days: '00', hours: '00', minutes: '00', isFrozen: true };
  }
  if (!eventStartAt) {
    return { days: '--', hours: '--', minutes: '--', isFrozen: true };
  }
  const target = Date.parse(eventStartAt);
  if (Number.isNaN(target)) {
    return { days: '--', hours: '--', minutes: '--', isFrozen: true };
  }
  const delta = target - Date.now();
  if (delta <= 0) {
    return { days: '00', hours: '00', minutes: '00', isFrozen: true };
  }
  const totalMinutes = Math.floor(delta / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return {
    days: pad2(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    isFrozen: false,
  };
}

export function Countdown({
  eventStartAt,
  isStarted,
  strings,
}: CountdownProps) {
  const [values, setValues] = useState<CountdownValues>(() =>
    compute(eventStartAt, isStarted),
  );

  useEffect(() => {
    setValues(compute(eventStartAt, isStarted));
    if (isStarted || !eventStartAt) return;
    const id = setInterval(() => {
      setValues((prev) => {
        const next = compute(eventStartAt, isStarted);
        if (
          next.days === prev.days &&
          next.hours === prev.hours &&
          next.minutes === prev.minutes &&
          next.isFrozen === prev.isFrozen
        ) {
          return prev;
        }
        return next;
      });
    }, 1000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        setValues(compute(eventStartAt, isStarted));
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [eventStartAt, isStarted]);

  const showLabel = !isStarted;

  return (
    <div className="flex flex-col items-start gap-[20px]">
      {showLabel && (
        <p className="font-montserrat text-[20px] font-bold leading-[28px] text-white md:text-[24px] md:leading-[32px]">
          {strings.comingSoon}
        </p>
      )}
      <time
        dateTime={eventStartAt ?? undefined}
        className="flex flex-row flex-nowrap items-start gap-[16px] md:gap-[28px]"
      >
        <span className="sr-only">
          {strings.countdownSummary
            .replace('{d}', values.days)
            .replace('{h}', values.hours)
            .replace('{m}', values.minutes)}
        </span>
        <Tile value={values.days} label={strings.days} />
        <Tile value={values.hours} label={strings.hours} />
        <Tile value={values.minutes} label={strings.minutes} />
      </time>
    </div>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  const [d1, d2] = value.length === 2 ? [value[0], value[1]] : ['-', '-'];
  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 flex-col items-center gap-[12px]"
    >
      <div className="flex flex-row flex-nowrap items-center gap-[8px] md:gap-[10px]">
        <DigitCard char={d1} />
        <DigitCard char={d2} />
      </div>
      <span className="font-montserrat text-[14px] font-bold uppercase tracking-[2px] text-white/80 md:text-[16px]">
        {label}
      </span>
    </div>
  );
}

function DigitCard({ char }: { char: string }) {
  return (
    <span
      className={[
        // Layout: tile slightly taller than wide for a clean clock look.
        'relative inline-flex h-[72px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] md:h-[92px] md:w-[72px]',
        // Brushed-metal gradient + warm-gold top highlight + dark bottom inset.
        'bg-[linear-gradient(180deg,#3a4148_0%,#262c33_45%,#13181d_55%,#0a0e12_100%)]',
        'shadow-[inset_0_1px_0_rgba(255,234,158,0.35),inset_0_-1px_2px_rgba(0,0,0,0.7),0_2px_4px_rgba(0,0,0,0.45)]',
        // Faint fold line across the middle (the flip-clock split).
        'before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-1/2 before:h-px before:bg-black/55 before:content-[""]',
      ].join(' ')}
    >
      <span
        className="tabular-nums text-[38px] leading-[1] md:text-[52px]"
        style={{
          fontFamily:
            'var(--font-digital), ui-sans-serif, system-ui, sans-serif',
          fontWeight: 900,
          color: 'rgba(255, 248, 220, 0.95)',
          letterSpacing: '-0.02em',
        }}
      >
        {char}
      </span>
    </span>
  );
}
