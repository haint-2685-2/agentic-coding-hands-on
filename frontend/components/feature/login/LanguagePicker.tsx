// Client component: owns dropdown open/close state, keyboard nav handlers, and
// writes the `saa_locale` cookie from the browser (document.cookie + router.refresh).
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  LOCALE_COOKIE_NAME,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/lib/i18n/locale';

interface LanguagePickerProps {
  locale: Locale;
  ariaLabel: string;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeLocaleCookie(value: Locale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${value}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}

export function LanguagePicker({ locale, ariaLabel }: LanguagePickerProps) {
  const router = useRouter();
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() =>
    Math.max(0, SUPPORTED_LOCALES.indexOf(locale)),
  );
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, close]);

  const commit = useCallback(
    (next: Locale) => {
      writeLocaleCookie(next);
      close();
      buttonRef.current?.focus();
      router.refresh();
    },
    [router, close],
  );

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(Math.max(0, SUPPORTED_LOCALES.indexOf(locale)));
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      buttonRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % SUPPORTED_LOCALES.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(
        (h) =>
          (h - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length,
      );
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(SUPPORTED_LOCALES[highlight]);
    }
  };

  return (
    <div ref={rootRef} className="relative flex h-[56px] w-[108px] items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className="flex h-[56px] w-[108px] items-center justify-between gap-[2px] rounded-[4px] p-[16px] text-white outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <span className="flex h-[24px] w-[53px] items-center gap-[4px]">
          <Image
            src="/assets/login/flag-vn.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="h-[24px] w-[24px]"
          />
          <span
            className="inline-block w-[25px] text-center font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.15px] text-white"
          >
            {LOCALE_LABELS[locale]}
          </span>
        </span>
        <Image
          src="/assets/login/chevron-down.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={`h-[24px] w-[24px] transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          autoFocus
          onKeyDown={onListKeyDown}
          ref={(el) => el?.focus()}
          className="absolute right-0 top-[60px] z-20 min-w-[108px] overflow-hidden rounded-[4px] border border-white/10 bg-[rgba(11,15,18,0.95)] py-1 shadow-lg outline-none"
        >
          {SUPPORTED_LOCALES.map((value, idx) => {
            const selected = value === locale;
            const highlighted = idx === highlight;
            return (
              <li
                key={value}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => commit(value)}
                className={[
                  'cursor-pointer px-4 py-2 font-montserrat text-[14px] font-semibold leading-[20px] text-white',
                  highlighted ? 'bg-white/10' : 'bg-transparent',
                  selected ? 'text-white' : 'text-white/80',
                ].join(' ')}
              >
                {LOCALE_LABELS[value]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
