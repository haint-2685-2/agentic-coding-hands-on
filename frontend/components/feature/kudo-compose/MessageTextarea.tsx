// "use client": owns textarea state, caret-anchored @mention popover, char
// counter.
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { searchUsers, type UserSuggestion } from '@/lib/api/users';
import { MESSAGE_MAX } from '@/lib/validation/kudo';
import { RichTextToolbar } from './RichTextToolbar';

interface MessageTextareaProps {
  value: string;
  onChange: (next: string) => void;
  errorMessage?: string;
}

interface MentionState {
  open: boolean;
  prefix: string;
  start: number;
  end: number;
  items: UserSuggestion[];
  active: number;
}

const INITIAL_MENTION: MentionState = {
  open: false,
  prefix: '',
  start: 0,
  end: 0,
  items: [],
  active: 0,
};

// Accept letters (incl. Vietnamese diacritics), digits, `_`, `.`, `-` in the
// mention token. We avoid the `u` flag + Unicode property escapes so the
// project's existing tsconfig target stays untouched.
const TOKEN_CHAR = /[A-Za-zÀ-ÖØ-öø-ÿĂ-ỹ0-9_.-]/;

function detectMention(text: string, caret: number): {
  prefix: string;
  start: number;
} | null {
  let i = caret - 1;
  while (i >= 0 && TOKEN_CHAR.test(text[i])) i -= 1;
  if (i < 0 || text[i] !== '@') return null;
  // Ensure char before @ is start-of-string or whitespace.
  if (i > 0 && !/\s/.test(text[i - 1])) return null;
  return { prefix: text.slice(i + 1, caret), start: i };
}

export function MessageTextarea({
  value,
  onChange,
  errorMessage,
}: MessageTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<MentionState>(INITIAL_MENTION);
  const labelId = useId();
  const counterId = useId();
  const errorId = useId();

  // Debounced mention fetch.
  useEffect(() => {
    if (!mention.open || mention.prefix.trim().length === 0) {
      setMention((m) => ({ ...m, items: [] }));
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const supabase = createClient();
      const res = await searchUsers(supabase, mention.prefix, {
        signal: ctrl.signal,
        limit: 8,
      });
      if (res.ok) {
        setMention((m) => ({ ...m, items: res.data, active: 0 }));
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mention.prefix, mention.open]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value.slice(0, MESSAGE_MAX);
    onChange(next);
    const caret = e.target.selectionStart ?? next.length;
    const m = detectMention(next, caret);
    if (m) {
      setMention((prev) => ({
        ...prev,
        open: true,
        prefix: m.prefix,
        start: m.start,
        end: caret,
      }));
    } else {
      setMention(INITIAL_MENTION);
    }
  }

  function insertMention(u: UserSuggestion) {
    const before = value.slice(0, mention.start);
    const after = value.slice(mention.end);
    const inserted = `@${u.full_name} `;
    const next = (before + inserted + after).slice(0, MESSAGE_MAX);
    onChange(next);
    setMention(INITIAL_MENTION);
    // Restore caret.
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = before.length + inserted.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function applyMark(open: string, close: string = open, blockPrefix?: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);
    let inserted = '';
    if (blockPrefix) {
      const lines = (sel || '').split('\n');
      inserted = lines
        .map((l, i) => `${blockPrefix.replace('{i}', String(i + 1))}${l}`)
        .join('\n');
    } else {
      inserted = `${open}${sel}${close}`;
    }
    const next = (before + inserted + after).slice(0, MESSAGE_MAX);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      const pos = before.length + inserted.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!mention.open || mention.items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMention((m) => ({
        ...m,
        active: Math.min(m.active + 1, m.items.length - 1),
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMention((m) => ({ ...m, active: Math.max(m.active - 1, 0) }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      insertMention(mention.items[mention.active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMention(INITIAL_MENTION);
    }
  }

  const remaining = MESSAGE_MAX - value.length;
  const showError = Boolean(errorMessage);

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <label
        id={labelId}
        htmlFor="kudo-message"
        className="sr-only"
      >
        Nội dung Kudo
      </label>
      <div
        className={`flex w-full flex-col rounded-[12px] border bg-white ${
          showError ? 'border-saa-kudo-hashtag' : 'border-saa-border'
        }`}
      >
        <RichTextToolbar onApply={applyMark} />
        <div className="relative">
          <textarea
            id="kudo-message"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder="Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!"
            aria-labelledby={labelId}
            aria-describedby={`${counterId}${showError ? ` ${errorId}` : ''}`}
            aria-required="true"
            aria-invalid={showError}
            maxLength={MESSAGE_MAX}
            rows={6}
            className="block w-full resize-y rounded-b-[12px] bg-transparent px-[16px] py-[12px] font-montserrat text-[16px] leading-[24px] text-saa-kudo-text placeholder:text-saa-kudo-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
          />

          {mention.open && mention.items.length > 0 && (
            <ul
              role="listbox"
              aria-label="Gợi ý nhắc đồng đội"
              className="absolute left-[16px] right-[16px] top-full z-50 mt-[4px] max-h-[240px] overflow-y-auto rounded-[8px] border border-saa-border bg-white py-[4px] shadow-lg"
            >
              {mention.items.map((u, i) => (
                <li
                  key={u.id}
                  role="option"
                  aria-selected={i === mention.active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(u);
                  }}
                  className={`cursor-pointer px-[12px] py-[8px] font-montserrat text-[14px] text-saa-kudo-text ${
                    i === mention.active ? 'bg-[rgba(255,234,158,0.40)]' : ''
                  }`}
                >
                  <span className="font-bold">{u.full_name}</span>
                  {u.department_name && (
                    <span className="ml-[8px] text-[12px] text-saa-kudo-muted">
                      {u.department_name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div
        className="flex w-full flex-row items-center justify-between gap-[8px]"
        aria-live="polite"
      >
        <span className="font-montserrat text-[12px] text-saa-kudo-muted">
          @ + tên để nhắc đồng nghiệp
        </span>
        <span
          id={counterId}
          className={`font-montserrat text-[12px] ${
            remaining < 50 ? 'text-saa-kudo-hashtag' : 'text-saa-kudo-muted'
          }`}
        >
          {value.length}/{MESSAGE_MAX}
        </span>
      </div>
      {showError && (
        <p
          id={errorId}
          role="alert"
          className="font-montserrat text-[12px] text-saa-kudo-hashtag"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
