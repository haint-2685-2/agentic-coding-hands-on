// "use client": owns dropdown open/close state + writes URL search params.
'use client';

import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Department, Hashtag } from '@/lib/api/kudos/types';
import type { KudosStrings } from '@/lib/i18n/kudos';

interface FilterBarProps {
  hashtags: Hashtag[];
  departments: Department[];
  strings: KudosStrings;
}

export function FilterBar({ hashtags, departments, strings }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-[8px]">
      <FilterDropdown
        kind="hashtag"
        ariaLabel={strings.hashtagLabel}
        placeholder={strings.hashtagAll}
        options={hashtags.map((h) => ({ value: h.slug, label: `#${h.name}` }))}
      />
      <FilterDropdown
        kind="department"
        ariaLabel={strings.departmentLabel}
        placeholder={strings.departmentAll}
        options={departments.map((d) => ({ value: d.id, label: d.name }))}
      />
    </div>
  );
}

interface DropdownProps {
  kind: 'hashtag' | 'department';
  ariaLabel: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

function FilterDropdown({ kind, ariaLabel, placeholder, options }: DropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(kind) ?? '';
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const apply = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      if (next) params.set(kind, next);
      else params.delete(kind);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
      setOpen(false);
    },
    [kind, pathname, router, searchParams],
  );

  const selectedLabel = options.find((o) => o.value === current)?.label ?? placeholder;
  const triggerDisabled = options.length === 0;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={triggerDisabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[56px] min-w-[120px] items-center gap-[8px] rounded-[4px] border border-saa-border bg-saa-kudo-button-soft px-[16px] font-montserrat text-[14px] font-bold leading-[20px] text-white transition-colors hover:bg-[rgba(255,234,158,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold disabled:cursor-not-allowed disabled:opacity-50"
        title={triggerDisabled ? 'Chưa có dữ liệu' : undefined}
      >
        <span className="max-w-[180px] truncate">{selectedLabel}</span>
        <Image
          src="/assets/kudos-live-board/icon-chevron-down.svg"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={`h-[24px] w-[24px] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-30 mt-[8px] max-h-[320px] w-[260px] overflow-y-auto rounded-[8px] border border-saa-border bg-saa-kudo-container py-[8px] shadow-xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={current === ''}
              onClick={() => apply('')}
              className={`flex w-full items-center px-[16px] py-[8px] text-left font-montserrat text-[14px] leading-[20px] ${
                current === '' ? 'bg-saa-kudo-button-soft text-saa-gold' : 'text-white/90 hover:bg-saa-kudo-button-soft'
              }`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={current === opt.value}
                onClick={() => apply(opt.value)}
                className={`flex w-full items-center px-[16px] py-[8px] text-left font-montserrat text-[14px] leading-[20px] ${
                  current === opt.value
                    ? 'bg-saa-kudo-button-soft text-saa-gold'
                    : 'text-white/90 hover:bg-saa-kudo-button-soft'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
