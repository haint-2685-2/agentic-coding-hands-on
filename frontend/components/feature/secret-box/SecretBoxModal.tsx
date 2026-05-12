'use client';

// Client component: owns isOpening / unopenedCount / lastBadge / error /
// retryUntil state, attaches keyboard handlers (Escape / Tab focus trap),
// and listens to `visibilitychange` for counter resync.

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';
import { openBoxAction, refreshBoxesAction } from '@/app/secret-box/actions';
import type { Badge } from '@/lib/api/secret-box/types';
import type { SecretBoxStrings } from '@/lib/i18n/secret-box';
import type { Locale } from '@/lib/i18n/locale';
import { CounterPanel } from './CounterPanel';
import { ErrorToast } from './ErrorToast';
import { OpenButton } from './OpenButton';

interface SecretBoxModalProps {
  initialUnopenedCount: number;
  initialError: string | null;
  strings: SecretBoxStrings;
  locale: Locale;
}

interface BannerState {
  message: string;
  permanent?: boolean;
}

export function SecretBoxModal({
  initialUnopenedCount,
  initialError,
  strings,
  locale: _locale,
}: SecretBoxModalProps) {
  void _locale; // reserved for future per-locale formatting
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [unopenedCount, setUnopenedCount] = useState(initialUnopenedCount);
  const [isOpening, setIsOpening] = useState(false);
  const [lastBadge, setLastBadge] = useState<Badge | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(
    initialError === 'auth/account-disabled'
      ? { message: strings.errorAccountDisabled, permanent: true }
      : null,
  );
  const [accountDisabled, setAccountDisabled] = useState(
    initialError === 'auth/account-disabled',
  );
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Tick to re-evaluate `retryUntil` so the button auto-re-enables.
  const [, setNowTick] = useState(0);
  useEffect(() => {
    if (retryUntil === null) return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [retryUntil]);

  const retrySecondsRemaining =
    retryUntil !== null
      ? Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000))
      : 0;

  const rateLimited = retryUntil !== null && Date.now() < retryUntil;

  const disabled =
    isOpening || accountDisabled || unopenedCount === 0 || rateLimited;

  // -------- Open action --------
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpening(true);
    setBanner(null);
    startTransition(() => {
      void (async () => {
        const result = await openBoxAction();
        if (result.ok) {
          setLastBadge(result.badge);
          setUnopenedCount(result.unopened_count);
          setBanner(null);
        } else {
          switch (result.code) {
            case 'secret_box/no_boxes':
              setUnopenedCount(0);
              setBanner({ message: strings.errorNoBoxes });
              break;
            case 'rate/limited': {
              const wait =
                typeof result.retryAfter === 'number' &&
                result.retryAfter > 0
                  ? result.retryAfter
                  : 5;
              setRetryUntil(Date.now() + wait * 1000);
              setBanner({ message: strings.errorRateLimited(wait) });
              break;
            }
            case 'auth/account-disabled':
              setAccountDisabled(true);
              setBanner({
                message: strings.errorAccountDisabled,
                permanent: true,
              });
              window.setTimeout(() => router.push('/'), 1500);
              break;
            case 'auth/required':
              router.push('/login?next=/secret-box');
              break;
            case 'network':
              setBanner({ message: strings.errorNetwork });
              break;
            default:
              setBanner({ message: result.message || strings.errorGeneric });
          }
        }
        setIsOpening(false);
      })();
    });
  }, [disabled, router, strings]);

  // -------- Auto-dismiss transient banners --------
  useEffect(() => {
    if (!banner || banner.permanent) return;
    const id = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(id);
  }, [banner]);

  // -------- visibilitychange refetch --------
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      if (isOpening) return;
      void (async () => {
        const fresh = await refreshBoxesAction();
        setUnopenedCount(fresh.unopened_count);
      })();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () =>
      document.removeEventListener('visibilitychange', onVisible);
  }, [isOpening]);

  // -------- Close handler --------
  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // -------- Focus trap + Escape --------
  useEffect(() => {
    // Move initial focus to the open button.
    openButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="relative flex w-full max-w-[651px] flex-col items-center gap-[22px] rounded-[12.7px] bg-saa-bg px-[12.7px] py-[23.9px] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
    >
      {/* Header: title centered + close button at top-right (node 1466:7677). */}
      <div className="relative flex h-[31px] w-full items-center justify-center">
        <h1
          id={titleId}
          className="font-montserrat text-[25.5px] font-bold leading-[31.8px] text-saa-cta"
        >
          {strings.modalTitle}
        </h1>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label={strings.closeButtonLabel}
          className="absolute right-[6px] top-1/2 flex h-[28px] w-[28px] -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-saa-cta/70 hover:bg-white/5"
        >
          <Image
            src="/assets/open-secret-box/close.svg"
            alt=""
            aria-hidden="true"
            width={19}
            height={19}
            className="h-[19px] w-[19px]"
          />
        </button>
      </div>

      {/* Instructional line (node 1466:7681) — removed from DOM at 0. */}
      {unopenedCount > 0 && !accountDisabled ? (
        <p className="font-montserrat text-[12.7px] font-bold uppercase leading-[19px] tracking-[0.4px] text-white">
          {strings.instruction}
        </p>
      ) : null}

      {/* Live region for badge reveal announcements (FR-005 / a11y). */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {lastBadge ? strings.fallbackBadgeAlt(lastBadge.name) : ''}
      </div>

      {/* The interactive box / reveal area (node 1466:7684). */}
      <OpenButton
        ref={openButtonRef}
        disabled={disabled}
        isOpening={isOpening}
        remaining={unopenedCount}
        revealedBadge={lastBadge}
        ariaLabel={strings.openButtonLabel(unopenedCount)}
        openingCaption={strings.openingCaption}
        fallbackAlt={strings.fallbackBadgeAlt}
        onOpen={handleOpen}
      />

      {/* Banner / toast slot. */}
      {banner ? <ErrorToast message={banner.message} /> : null}
      {rateLimited && !banner ? (
        <ErrorToast
          message={strings.errorRateLimited(retrySecondsRemaining)}
        />
      ) : null}

      {/* Counter row (node 1466:7689). */}
      <CounterPanel count={unopenedCount} label={strings.counterLabel} />
    </div>
  );
}
