// "use client": uses state, debounced fetch, keyboard handling.
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { searchHashtags } from '@/lib/api/hashtags';
import type { Hashtag } from '@/lib/api/kudos/types';
import { HASHTAG_MAX } from '@/lib/validation/kudo';

interface HashtagPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  initialOptions: Hashtag[];
  errorId?: string;
  errorMessage?: string;
}

function normalize(input: string): string {
  return input
    .trim()
    .replace(/^#+/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function HashtagPicker({
  value,
  onChange,
  initialOptions,
  errorId,
  errorMessage,
}: HashtagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Hashtag[]>(initialOptions);
  const inputRef = useRef<HTMLInputElement>(null);
  const atCap = value.length >= HASHTAG_MAX;

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const supabase = createClient();
      const res = await searchHashtags(supabase, query, {
        signal: ctrl.signal,
        limit: 10,
      });
      if (res.ok) setOptions(res.data);
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  function add(slug: string) {
    const normalized = normalize(slug);
    if (!normalized) return;
    if (value.includes(normalized)) {
      setQuery('');
      return;
    }
    if (value.length >= HASHTAG_MAX) return;
    onChange([...value, normalized]);
    setQuery('');
    setOpen(false);
  }

  function remove(slug: string) {
    onChange(value.filter((s) => s !== slug));
  }

  const filtered = options.filter(
    (o) => !value.includes(o.slug) && o.slug.includes(normalize(query) || ''),
  );

  const showError = Boolean(errorMessage);

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <div className="flex w-full flex-row items-center gap-[16px]">
        <span className="flex w-[146px] shrink-0 items-center font-montserrat text-[22px] font-bold leading-[28px] text-saa-kudo-text">
          Hashtag
          <span className="ml-[2px] text-saa-kudo-hashtag">*</span>
        </span>
        <div className="relative flex flex-1 flex-row flex-wrap items-center gap-[8px]">
          {value.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-[8px] rounded-full bg-saa-kudo-msg-bg px-[12px] py-[6px] font-montserrat text-[14px] font-bold text-saa-kudo-hashtag"
            >
              #{slug}
              <button
                type="button"
                aria-label={`Xoá hashtag ${slug}`}
                onClick={() => remove(slug)}
                className="flex h-[20px] w-[20px] items-center justify-center rounded-full hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
              >
                <Image
                  src="/assets/viet-kudo/icon-close-tiny.svg"
                  alt=""
                  aria-hidden="true"
                  width={14}
                  height={14}
                />
              </button>
            </span>
          ))}

          {!atCap && (
            <button
              type="button"
              onClick={() => {
                setOpen((o) => !o);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-describedby={
                showError && errorId ? errorId : undefined
              }
              aria-invalid={showError}
              className={`flex h-[38px] items-center gap-[8px] rounded-full border border-dashed bg-transparent px-[12px] font-montserrat text-[14px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold ${
                showError
                  ? 'border-saa-kudo-hashtag text-saa-kudo-hashtag'
                  : 'border-saa-border text-saa-kudo-text'
              }`}
            >
              <Image
                src="/assets/viet-kudo/icon-plus.svg"
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
              />
              Hashtag
            </button>
          )}

          {atCap && (
            <span className="font-montserrat text-[12px] text-saa-kudo-muted">
              Tối đa {HASHTAG_MAX} hashtag
            </span>
          )}

          {open && !atCap && (
            <div className="absolute left-0 top-full z-50 mt-[8px] w-[320px] rounded-[8px] border border-saa-border bg-white p-[8px] shadow-lg">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add(query);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setOpen(false);
                  }
                }}
                placeholder="Tìm hoặc nhập hashtag mới"
                className="h-[40px] w-full rounded-[6px] border border-saa-border bg-white px-[12px] font-montserrat text-[14px] text-saa-kudo-text focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
              />
              <ul role="listbox" className="mt-[6px] max-h-[240px] overflow-y-auto">
                {filtered.length === 0 && query.trim().length === 0 && (
                  <li className="px-[8px] py-[10px] font-montserrat text-[12px] text-saa-kudo-muted">
                    Chưa có gợi ý
                  </li>
                )}
                {filtered.map((opt) => (
                  <li
                    key={opt.slug}
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(opt.slug);
                    }}
                    className="cursor-pointer rounded-[4px] px-[8px] py-[8px] font-montserrat text-[14px] text-saa-kudo-text hover:bg-[rgba(255,234,158,0.40)]"
                  >
                    #{opt.slug}
                    <span className="ml-[6px] text-[12px] text-saa-kudo-muted">
                      {opt.usage_count}
                    </span>
                  </li>
                ))}
                {query.trim().length > 0 && normalize(query) && (
                  <li
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(query);
                    }}
                    className="cursor-pointer rounded-[4px] px-[8px] py-[8px] font-montserrat text-[14px] font-bold text-saa-kudo-hashtag hover:bg-[rgba(255,234,158,0.40)]"
                  >
                    + Thêm “#{normalize(query)}”
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
