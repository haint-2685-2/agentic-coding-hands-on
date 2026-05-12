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
    <div className="flex flex-col items-start gap-[16px]">
      {showLabel && (
        <p className="font-montserrat text-[20px] font-bold leading-[28px] text-white md:text-[24px] md:leading-[32px]">
          {strings.comingSoon}
        </p>
      )}
      <time
        dateTime={eventStartAt ?? undefined}
        className="flex items-center gap-[24px] md:gap-[40px]"
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
  return (
    <div
      aria-hidden="true"
      className="flex w-[88px] flex-col items-center gap-[8px] md:w-[116px]"
    >
      <span className="font-montserrat text-[64px] font-bold leading-[1] text-saa-gold [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287] md:text-[96px]">
        {value}
      </span>
      <span className="font-montserrat text-[12px] font-bold tracking-[0.5px] text-white md:text-[14px]">
        {label}
      </span>
    </div>
  );
}
