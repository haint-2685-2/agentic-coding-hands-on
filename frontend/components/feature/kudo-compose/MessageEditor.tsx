// WYSIWYG editor backing the kudo message field. We use a contentEditable
// div + document.execCommand for the formatting buttons (B/I/S/list/quote/
// link) so that the visual output matches the saved HTML. execCommand is
// soft-deprecated but works consistently across the browsers our users run
// and saves us from pulling in a heavyweight editor lib for one screen.
//
// State model: the editor is *uncontrolled*. We initialise innerHTML once
// on mount, emit onChange(html) on input, and re-sync innerHTML only when
// the parent flips the value back to the empty string (e.g. after submit).
// This keeps the caret stable between keystrokes.
'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createClient } from '@/lib/supabase/browser';
import { searchUsers, type UserSuggestion } from '@/lib/api/users';
import { MESSAGE_MAX } from '@/lib/validation/kudo';
import { htmlToPlainText } from '@/lib/kudos/sanitize-html';

interface MessageEditorProps {
  value: string;
  onChange: (nextHtml: string) => void;
  errorMessage?: string;
}

interface MentionState {
  open: boolean;
  prefix: string;
  items: UserSuggestion[];
  active: number;
  // Plain-text indices of the `@token` slice we're going to replace.
  start: number;
  end: number;
}

const INITIAL_MENTION: MentionState = {
  open: false,
  prefix: '',
  items: [],
  active: 0,
  start: 0,
  end: 0,
};

const TOKEN_CHAR = /[A-Za-zÀ-ÖØ-öø-ÿĂ-ỹ0-9_.-]/;

interface ToolDef {
  src: string;
  label: string;
  command: 'bold' | 'italic' | 'strikeThrough' | 'orderedList' | 'quote' | 'link';
}

const TOOLS: ToolDef[] = [
  { src: '/assets/viet-kudo/icon-bold.svg', label: 'Đậm', command: 'bold' },
  { src: '/assets/viet-kudo/icon-italic.svg', label: 'Nghiêng', command: 'italic' },
  { src: '/assets/viet-kudo/icon-strike.svg', label: 'Gạch ngang', command: 'strikeThrough' },
  { src: '/assets/viet-kudo/icon-list.svg', label: 'Danh sách số', command: 'orderedList' },
  { src: '/assets/viet-kudo/icon-link.svg', label: 'Liên kết', command: 'link' },
  { src: '/assets/viet-kudo/icon-quote.svg', label: 'Trích dẫn', command: 'quote' },
];

export function MessageEditor({
  value,
  onChange,
  errorMessage,
}: MessageEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>('');
  const labelId = useId();
  const counterId = useId();
  const errorId = useId();
  const [mention, setMention] = useState<MentionState>(INITIAL_MENTION);
  const [plainLen, setPlainLen] = useState(0);

  // One-time hydration of innerHTML — keep caret stable thereafter.
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = value || '';
    lastEmittedRef.current = value || '';
    setPlainLen(htmlToPlainText(value || '').length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External resets — when the parent clears the form, re-sync the DOM.
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === '' && lastEmittedRef.current !== '') {
      editorRef.current.innerHTML = '';
      lastEmittedRef.current = '';
      setPlainLen(0);
      setMention(INITIAL_MENTION);
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    lastEmittedRef.current = html;
    onChange(html);
    setPlainLen(htmlToPlainText(html).length);
  }, [onChange]);

  // Debounced typeahead for mention popover.
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

  function handleInput() {
    emit();
    const el = editorRef.current;
    if (!el) return;
    const caretInfo = getCaretPlainOffset(el);
    if (!caretInfo) {
      setMention(INITIAL_MENTION);
      return;
    }
    const { plainText, offset } = caretInfo;
    let i = offset - 1;
    while (i >= 0 && TOKEN_CHAR.test(plainText[i])) i -= 1;
    if (i < 0 || plainText[i] !== '@') {
      setMention(INITIAL_MENTION);
      return;
    }
    if (i > 0 && !/\s/.test(plainText[i - 1])) {
      setMention(INITIAL_MENTION);
      return;
    }
    setMention((prev) => ({
      ...prev,
      open: true,
      prefix: plainText.slice(i + 1, offset),
      start: i,
      end: offset,
    }));
  }

  function runCommand(cmd: ToolDef['command']) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (cmd === 'bold') document.execCommand('bold');
    else if (cmd === 'italic') document.execCommand('italic');
    else if (cmd === 'strikeThrough') document.execCommand('strikeThrough');
    else if (cmd === 'orderedList') document.execCommand('insertOrderedList');
    else if (cmd === 'quote') document.execCommand('formatBlock', false, 'blockquote');
    else if (cmd === 'link') {
      const url = window.prompt('Nhập đường dẫn (https://…)');
      if (url && /^(https?:|mailto:)/i.test(url)) {
        document.execCommand('createLink', false, url);
      }
    }
    emit();
  }

  function insertMention(u: UserSuggestion) {
    const el = editorRef.current;
    if (!el) return;
    const replacement = `@${u.full_name} `;
    // Build a fresh plain-text composition: replace mention.start..end with
    // the new token, then reflow into the DOM as raw text. We drop any
    // inline formatting that happened to surround the token — acceptable
    // trade-off for a small editor.
    const all = el.innerText;
    const before = all.slice(0, mention.start);
    const after = all.slice(mention.end);
    const next = before + replacement + after;
    el.innerText = next;
    // Place caret right after the inserted mention.
    setPlainCaretOffset(el, before.length + replacement.length);
    setMention(INITIAL_MENTION);
    emit();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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

  // Strip styles/scripts/etc. from pasted HTML — keep only plain text so the
  // saved HTML stays inside our allowlist.
  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  }

  const remaining = MESSAGE_MAX - plainLen;
  const showError = Boolean(errorMessage);

  const counterClass = useMemo(
    () =>
      remaining < 50
        ? 'font-montserrat text-[12px] text-saa-kudo-hashtag'
        : 'font-montserrat text-[12px] text-saa-kudo-muted',
    [remaining],
  );

  return (
    <div className="flex w-full flex-col items-stretch gap-[8px]">
      <span id={labelId} className="sr-only">
        Nội dung Kudo
      </span>
      <div
        className={`flex w-full flex-col rounded-[12px] border bg-white ${
          showError ? 'border-saa-kudo-hashtag' : 'border-saa-border'
        }`}
      >
        <div
          role="toolbar"
          aria-label="Định dạng tin nhắn"
          className="flex flex-row items-center gap-[4px] border-b border-saa-border/40 px-[8px] py-[6px]"
        >
          {TOOLS.map((t) => (
            <button
              key={t.label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => runCommand(t.command)}
              aria-label={t.label}
              title={t.label}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-[4px] text-saa-kudo-text hover:bg-[rgba(255,234,158,0.30)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
            >
              {/* Icons ship with fill="white" (Figma dark canvas). Invert
                  to darken on the editor's white toolbar background. */}
              <Image
                src={t.src}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="invert"
              />
            </button>
          ))}
        </div>
        <div className="relative">
          <div
            ref={editorRef}
            id="kudo-message"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-labelledby={labelId}
            aria-describedby={`${counterId}${showError ? ` ${errorId}` : ''}`}
            aria-required="true"
            aria-invalid={showError}
            data-placeholder="Hãy gửi gắm lời cám ơn và ghi nhận đến đồng đội tại đây nhé!"
            onInput={handleInput}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            className="kudo-rich-editor block min-h-[144px] w-full resize-y rounded-b-[12px] bg-transparent px-[16px] py-[12px] font-montserrat text-[16px] leading-[24px] text-saa-kudo-text focus:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
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
      <div className="flex w-full flex-row items-center justify-between gap-[8px]" aria-live="polite">
        <span className="font-montserrat text-[12px] text-saa-kudo-muted">
          @ + tên để nhắc đồng nghiệp
        </span>
        <span id={counterId} className={counterClass}>
          {plainLen}/{MESSAGE_MAX}
        </span>
      </div>
      {showError && (
        <p id={errorId} role="alert" className="font-montserrat text-[12px] text-saa-kudo-hashtag">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Caret helpers — translate between the editor's DOM positions and the
// plain-text offsets we use for @mention detection.

function getCaretPlainOffset(
  root: HTMLElement,
): { plainText: string; offset: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.endContainer)) return null;
  const pre = range.cloneRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  const offset = pre.toString().length;
  return { plainText: root.innerText, offset };
}

function setPlainCaretOffset(root: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
    node = walker.nextNode();
  }
  // Past the end — place caret at the very end.
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}
