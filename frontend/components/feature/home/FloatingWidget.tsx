// Client component: bottom-right FAB with a popover for quick actions.
// Owns local open/close state, outside-click + Escape, focus return to
// trigger.
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { HomeStrings } from '@/lib/i18n/home';

interface FloatingWidgetProps {
  strings: HomeStrings;
}

export function FloatingWidget({ strings }: FloatingWidgetProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !popoverRef.current?.contains(t) &&
        !buttonRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <div className="fixed bottom-[24px] right-[24px] z-40 flex flex-col items-end gap-[12px]">
      {open && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={strings.widgetWriteKudo}
          className="flex w-[220px] flex-col gap-[4px] rounded-[12px] border border-white/10 bg-[rgba(11,15,18,0.98)] p-[8px] shadow-2xl"
        >
          <WidgetItem
            href="/kudos/new"
            icon="/assets/homepage-saa/widget-pen.svg"
          >
            {strings.widgetWriteKudo}
          </WidgetItem>
          <WidgetItem
            href="/awards"
            icon="/assets/homepage-saa/widget-kudos-logo.svg"
          >
            {strings.widgetViewAwards}
          </WidgetItem>
          <WidgetItem
            href="/standards"
            icon="/assets/homepage-saa/widget-kudos-logo.svg"
          >
            {strings.widgetRules}
          </WidgetItem>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[64px] items-center gap-[8px] rounded-full bg-saa-cta px-[24px] py-[16px] font-montserrat text-[14px] font-bold text-saa-cta-foreground shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287] outline-none transition-transform hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        <Image
          src="/assets/homepage-saa/widget-pen.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
        <span aria-hidden="true">/</span>
        <Image
          src="/assets/homepage-saa/widget-kudos-logo.svg"
          alt=""
          aria-hidden="true"
          width={20}
          height={18}
        />
        <span className="sr-only">{strings.widgetWriteKudo}</span>
      </button>
    </div>
  );
}

function WidgetItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-[44px] items-center gap-[12px] rounded-[8px] px-[12px] text-white outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-saa-gold"
    >
      <Image src={icon} alt="" aria-hidden="true" width={20} height={20} />
      <span className="font-montserrat text-[14px] font-semibold">{children}</span>
    </Link>
  );
}
