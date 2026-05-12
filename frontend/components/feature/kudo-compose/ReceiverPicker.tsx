// "use client": uses state, refs, debounced fetch, AbortController, keyboard
// handlers — all browser-only.
'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { searchUsers, type UserSuggestion } from '@/lib/api/users';

interface ReceiverPickerProps {
  value: { id: string; full_name: string; department_name: string | null } | null;
  onChange: (
    value: { id: string; full_name: string; department_name: string | null } | null,
  ) => void;
  errorId?: string;
  errorMessage?: string;
}

const DEBOUNCE_MS = 250;

export function ReceiverPicker({
  value,
  onChange,
  errorId,
  errorMessage,
}: ReceiverPickerProps) {
  const [query, setQuery] = useState(value?.full_name ?? '');
  const [items, setItems] = useState<UserSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputId = useMemo(
    () => `kudo-receiver-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );
  const listboxId = `${inputId}-listbox`;

  // Debounced typeahead fetch.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const res = await searchUsers(supabase, trimmed, {
        signal: ctrl.signal,
        limit: 10,
      });
      setLoading(false);
      if (res.ok) {
        setItems(res.data);
        setActive(0);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  function pick(u: UserSuggestion) {
    onChange({
      id: u.id,
      full_name: u.full_name,
      department_name: u.department_name,
    });
    setQuery(u.full_name);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(0, items.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && items[active]) {
        e.preventDefault();
        pick(items[active]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  const showError = Boolean(errorMessage);

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <div className="flex w-full flex-row items-center gap-[16px]">
        <label
          htmlFor={inputId}
          className="flex w-[146px] shrink-0 items-center font-montserrat text-[22px] font-bold leading-[28px] text-saa-kudo-text"
        >
          Người nhận
          <span className="ml-[2px] text-saa-kudo-hashtag">*</span>
        </label>
        <div className="relative flex-1">
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={value ? value.full_name : query}
            onChange={(e) => {
              if (value) onChange(null);
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so a click on a listbox row registers first.
              setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
            placeholder="Tìm kiếm"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              open && items[active] ? `${listboxId}-opt-${active}` : undefined
            }
            aria-required="true"
            aria-invalid={showError}
            aria-describedby={showError && errorId ? errorId : undefined}
            className={`h-[56px] w-full rounded-[8px] border bg-white px-[24px] py-[16px] pr-[48px] font-montserrat text-[16px] font-bold leading-[24px] tracking-[0.15px] text-saa-kudo-text placeholder:text-saa-kudo-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold ${
              showError ? 'border-saa-kudo-hashtag' : 'border-saa-border'
            }`}
          />
          <button
            type="button"
            aria-label={value ? 'Xoá người nhận' : 'Mở danh sách người nhận'}
            onClick={() => (value ? clearSelection() : setOpen((o) => !o))}
            className="absolute right-[16px] top-1/2 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center"
          >
            <Image
              src={
                value
                  ? '/assets/viet-kudo/icon-close-tiny.svg'
                  : '/assets/viet-kudo/icon-chevron-down.svg'
              }
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
            />
          </button>

          {open && (
            <ul
              id={listboxId}
              ref={listRef}
              role="listbox"
              aria-label="Danh sách người nhận"
              className="absolute left-0 right-0 top-full z-50 mt-[4px] max-h-[300px] overflow-y-auto rounded-[8px] border border-saa-border bg-white py-[4px] shadow-lg"
            >
              {loading && (
                <li
                  className="px-[16px] py-[12px] font-montserrat text-[14px] text-saa-kudo-muted"
                  aria-busy="true"
                >
                  Đang tìm…
                </li>
              )}
              {!loading && items.length === 0 && query.trim().length > 0 && (
                <li className="px-[16px] py-[12px] font-montserrat text-[14px] text-saa-kudo-muted">
                  Không tìm thấy thành viên
                </li>
              )}
              {!loading &&
                items.map((u, i) => (
                  <li
                    key={u.id}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(u);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer flex-row items-center gap-[12px] px-[16px] py-[10px] font-montserrat text-[14px] text-saa-kudo-text ${
                      i === active ? 'bg-[rgba(255,234,158,0.40)]' : ''
                    }`}
                  >
                    <span className="relative h-[32px] w-[32px] overflow-hidden rounded-full bg-[#EEE]">
                      {u.avatar_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">{u.full_name}</span>
                      {u.department_name && (
                        <span className="text-[12px] text-saa-kudo-muted">
                          {u.department_name}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
