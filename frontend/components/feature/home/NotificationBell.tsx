// Client component: owns the bell badge count, panel open/close state,
// the visibility-aware poll loop, and the optimistic mark-read flow.
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/home/notifications';
import type { NotificationItem } from '@/lib/api/home/types';

interface NotificationBellProps {
  ariaLabel: string;
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell({ ariaLabel }: NotificationBellProps) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [authedUnmount, setAuthedUnmount] = useState(false);
  const panelId = useId();
  const supabaseRef = useRef(createClient());
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const tokenOrNull = useCallback(async (): Promise<string | null> => {
    const { data } = await supabaseRef.current.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const token = await tokenOrNull();
    if (!token) return;
    try {
      const { unread_count } = await getUnreadCount(token, { signal });
      setCount(unread_count);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('unread-count/http-401')) {
        setAuthedUnmount(true);
      }
    }
  }, [tokenOrNull]);

  // Visibility-aware poll lifecycle. Pauses when the panel is open or the
  // tab is hidden; performs a single immediate refresh on resume.
  useEffect(() => {
    if (authedUnmount) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState !== 'visible' || open) return;
      void refresh(controller.signal);
    };

    void refresh(controller.signal);
    timer = setInterval(tick, POLL_INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === 'visible' && !open) {
        void refresh(controller.signal);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [open, refresh, authedUnmount]);

  const togglePanel = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      const token = await tokenOrNull();
      if (token) {
        try {
          const res = await listNotifications(token);
          setItems(res.items);
        } catch {
          setItems([]);
        }
      }
      setLoading(false);
    }
  }, [open, tokenOrNull]);

  // Close on outside click / Esc, returning focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onItemClick = async (item: NotificationItem) => {
    if (item.read_at) {
      if (item.link) window.location.href = item.link;
      return;
    }
    const previous = items;
    const optimistic = items.map((it) =>
      it.id === item.id ? { ...it, read_at: new Date().toISOString() } : it,
    );
    setItems(optimistic);
    setCount((c) => Math.max(0, c - 1));
    const token = await tokenOrNull();
    if (!token) return;
    const { ok } = await markNotificationRead(token, item.id);
    if (!ok) {
      setItems(previous);
      setCount((c) => c + 1);
      return;
    }
    if (item.link) window.location.href = item.link;
  };

  const onMarkAll = async () => {
    const previous = items;
    const previousCount = count;
    const stamp = new Date().toISOString();
    setItems(items.map((it) => ({ ...it, read_at: it.read_at ?? stamp })));
    setCount(0);
    const token = await tokenOrNull();
    if (!token) {
      setItems(previous);
      setCount(previousCount);
      return;
    }
    const { ok } = await markAllNotificationsRead(token);
    if (!ok) {
      setItems(previous);
      setCount(previousCount);
    }
  };

  if (authedUnmount) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={togglePanel}
        className="relative flex h-[40px] w-[40px] items-center justify-center rounded-[4px] text-white outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-saa-gold"
      >
        <Image
          src="/assets/homepage-saa/bell.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
        />
        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute right-[8px] top-[8px] inline-flex h-[8px] w-[8px] items-center justify-center rounded-full bg-saa-danger"
          >
            <span className="sr-only">{count} chưa đọc</span>
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-label={ariaLabel}
          className="absolute right-0 top-[48px] z-40 w-[360px] overflow-hidden rounded-[8px] border border-white/10 bg-[rgba(11,15,18,0.98)] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="font-montserrat text-[14px] font-bold text-white">
              {ariaLabel}
            </h2>
            <button
              type="button"
              onClick={onMarkAll}
              className="font-montserrat text-[12px] font-semibold text-saa-gold hover:underline"
            >
              ✓
            </button>
          </div>
          <ul className="max-h-[400px] overflow-y-auto">
            {loading && (
              <li className="px-4 py-6 text-center text-[13px] text-white/60">
                …
              </li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-white/60">
                —
              </li>
            )}
            {!loading &&
              items.map((it) => (
                <li
                  key={it.id}
                  className={[
                    'border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/5',
                    it.read_at ? 'opacity-60' : 'opacity-100',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => void onItemClick(it)}
                    className="flex w-full flex-col items-start gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
                  >
                    <span className="font-montserrat text-[13px] font-semibold text-white">
                      {it.title}
                    </span>
                    <span className="font-montserrat text-[12px] text-white/70">
                      {it.body}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
