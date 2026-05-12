// Client component: dropdown open/close state, keyboard nav, and Supabase
// signOut() trigger. Admin Dashboard entry is conditionally rendered in the
// DOM based on `me.role`.
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import type { Me } from '@/lib/api/home/types';
import type { HomeStrings } from '@/lib/i18n/home';

interface AvatarMenuProps {
  me: Me;
  strings: HomeStrings;
}

export function AvatarMenu({ me, strings }: AvatarMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  type MenuItem = { label: string; href?: string; action?: 'sign-out' };
  const items: MenuItem[] = [
    { label: strings.menuProfile, href: '/profile' },
    ...(me.role === 'admin'
      ? [{ label: strings.menuAdmin, href: '/admin' } as const]
      : []),
    { label: strings.menuSignOut, action: 'sign-out' as const },
  ];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(0);
      setOpen(true);
    }
  };

  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void onActivate(items[highlight]);
    }
  };

  const onActivate = async (item: MenuItem) => {
    close();
    if (item.action === 'sign-out') {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/');
      router.refresh();
      return;
    }
    if (item.href) router.push(item.href);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={strings.accountLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
        className="flex h-[40px] w-[40px] items-center justify-center rounded-[4px] border border-saa-border bg-transparent text-white outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        {me.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={me.avatar_url}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="h-[24px] w-[24px] rounded-full object-cover"
          />
        ) : (
          <Image
            src="/assets/homepage-saa/user.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        )}
      </button>
      {open && (
        <ul
          id={menuId}
          role="menu"
          aria-label={strings.accountLabel}
          tabIndex={-1}
          ref={(el) => el?.focus()}
          onKeyDown={onListKey}
          className="absolute right-0 top-[48px] z-40 min-w-[200px] overflow-hidden rounded-[6px] border border-white/10 bg-[rgba(11,15,18,0.98)] py-1 shadow-2xl outline-none"
        >
          {items.map((item, idx) => {
            const highlighted = idx === highlight;
            const body = (
              <span
                className={[
                  'block w-full px-4 py-2 text-left font-montserrat text-[14px] font-semibold',
                  highlighted ? 'bg-white/10 text-saa-gold' : 'text-white/90',
                ].join(' ')}
              >
                {item.label}
              </span>
            );
            return (
              <li
                key={item.label}
                role="menuitem"
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => void onActivate(item)}
                className="cursor-pointer"
              >
                {item.href ? (
                  <Link href={item.href} className="block outline-none">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
