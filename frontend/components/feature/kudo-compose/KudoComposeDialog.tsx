// "use client": owns form state via useReducer, focus trap, Escape handler,
// AbortController for submit + uploads, and router navigation on close.
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { createClient } from '@/lib/supabase/browser';
import { createKudo } from '@/lib/api/kudos-compose/client';
import type { Hashtag } from '@/lib/api/kudos/types';
import {
  emptyKudoForm,
  fieldOrder,
  validateKudoForm,
  type FieldErrors,
  type FieldName,
  type KudoFormValues,
} from '@/lib/validation/kudo';
import { ReceiverPicker } from './ReceiverPicker';
import { MessageTextarea } from './MessageTextarea';
import { HashtagPicker } from './HashtagPicker';
import { ImageUploader } from './ImageUploader';
import { AnonymousToggle } from './AnonymousToggle';
import { SubmitBar } from './SubmitBar';
import { ErrorBanner } from './ErrorBanner';
import { useUploadPool } from './use-upload-pool';

interface KudoComposeDialogProps {
  initialHashtags: Hashtag[];
  /**
   * `modal` is rendered as a centered overlay over a backdrop (intercepted
   * route); `page` is rendered inline with no backdrop (full-page fallback).
   */
  mode: 'modal' | 'page';
}

type Action =
  | { type: 'set'; patch: Partial<KudoFormValues> }
  | { type: 'reset' };

function reducer(state: KudoFormValues, action: Action): KudoFormValues {
  if (action.type === 'reset') return emptyKudoForm();
  return { ...state, ...action.patch };
}

const TITLE_ID = 'kudo-compose-title';

export function KudoComposeDialog({
  initialHashtags,
  mode,
}: KudoComposeDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const [values, dispatch] = useReducer(reducer, undefined, emptyKudoForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | undefined>(undefined);
  const submitCtrlRef = useRef<AbortController | null>(null);

  const uploadPool = useUploadPool({
    concurrency: 3,
    onComplete: (path) => {
      dispatch({
        type: 'set',
        patch: { image_paths: [...valuesRef.current.image_paths, path] },
      });
    },
    onError: (msg) => setBanner(msg),
  });

  // Mirror values in a ref so async callbacks read the latest snapshot.
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Track dirty state for confirm-on-close.
  const isDirty =
    values.receiver_id !== null ||
    values.message.length > 0 ||
    values.hashtags.length > 0 ||
    values.image_paths.length > 0 ||
    uploadPool.entries.length > 0;

  const close = useCallback(() => {
    // Abort in-flight network work.
    submitCtrlRef.current?.abort();
    uploadPool.abortAll();
    // Restore focus before route change.
    if (previouslyFocusedRef.current) {
      try {
        previouslyFocusedRef.current.focus();
      } catch {
        /* noop */
      }
    }
    // Intercepted route → back(); full page → push to /kudos.
    if (mode === 'modal') {
      router.back();
    } else {
      router.push('/kudos');
    }
  }, [router, uploadPool, mode]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const ok = window.confirm('Bạn có muốn huỷ thay đổi?');
      if (!ok) return;
    }
    close();
  }, [close, isDirty]);

  // Focus trap + Escape handler + body scroll lock for modal mode.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    if (mode === 'modal') {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleCancel]);

  // Initial focus → receiver field (per spec US1 AC1).
  useEffect(() => {
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'input[role="combobox"]',
      );
      first?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  function focusFirstInvalid(errs: FieldErrors) {
    for (const f of fieldOrder()) {
      if (errs[f as FieldName]) {
        const root = dialogRef.current;
        if (!root) return;
        let target: HTMLElement | null = null;
        if (f === 'receiver_id') {
          target = root.querySelector<HTMLElement>('input[role="combobox"]');
        } else if (f === 'message') {
          target = root.querySelector<HTMLElement>('#kudo-message');
        } else if (f === 'hashtags') {
          target = root.querySelector<HTMLElement>('[aria-haspopup="listbox"]');
        }
        target?.focus();
        return;
      }
    }
  }

  async function onSubmit() {
    const result = validateKudoForm(valuesRef.current);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstInvalid(result.errors);
      return;
    }
    if (uploadPool.entries.some((e) => e.status === 'uploading' || e.status === 'queued')) {
      setBanner('Vui lòng đợi ảnh tải lên xong.');
      return;
    }

    setBanner(null);
    setErrors({});
    setSubmitting(true);
    const ctrl = new AbortController();
    submitCtrlRef.current = ctrl;
    try {
      const supabase = createClient();
      const res = await createKudo(supabase, result.payload!, {
        signal: ctrl.signal,
      });
      if (res.ok) {
        // No optimistic feed prepend per plan.
        dispatch({ type: 'reset' });
        close();
        return;
      }
      // Error mapping.
      const err = res.error;
      if (err.status === 422 && err.fields && err.fields.length > 0) {
        const map: FieldErrors = {};
        const first = err.fields[0];
        if (first === 'receiver_id' || first === 'message') {
          map[first] = err.message;
        } else if (first === 'hashtags' || first === 'images') {
          map[first] = err.message;
        } else {
          setBanner(err.message);
        }
        setErrors(map);
        focusFirstInvalid(map);
        return;
      }
      if (err.code === 'kudo/self_receiver' || err.code === 'user/not_found') {
        setErrors({ receiver_id: err.message });
        focusFirstInvalid({ receiver_id: err.message });
        return;
      }
      if (err.code === 'kudo/duplicate') {
        setBanner('Bạn vừa gửi cùng nội dung tới người này.');
        return;
      }
      if (err.status === 429) {
        setBanner('Bạn đang gửi Kudo quá nhanh, vui lòng thử lại sau.');
        setRetryAfter(err.retryAfterSec);
        if (err.retryAfterSec) {
          setTimeout(() => setRetryAfter(undefined), err.retryAfterSec * 1000);
        }
        return;
      }
      setBanner(err.message || 'Không gửi được Kudo, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      submitCtrlRef.current = null;
    }
  }

  // Compute derived submit-state.
  const validation = validateKudoForm(values);
  const canSubmit =
    validation.ok &&
    !submitting &&
    !retryAfter &&
    uploadPool.entries.every((e) => e.status === 'done' || e.status === 'error');

  const card = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      className="flex w-full max-w-[752px] flex-col items-stretch gap-[32px] rounded-[24px] bg-saa-kudo-card p-[40px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="flex w-full flex-row items-start justify-between gap-[16px]">
        <h2
          id={TITLE_ID}
          className="flex-1 text-center font-montserrat text-[24px] font-bold leading-[32px] text-saa-kudo-text md:text-[32px] md:leading-[40px]"
        >
          Gửi lời cám ơn và ghi nhận đến đồng đội
        </h2>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Đóng"
          className="flex h-[32px] w-[32px] items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saa-gold"
        >
          <Image
            src="/assets/viet-kudo/icon-close.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
          />
        </button>
      </div>

      <ErrorBanner message={banner} onDismiss={() => setBanner(null)} />

      <ReceiverPicker
        value={
          values.receiver_id
            ? {
                id: values.receiver_id,
                full_name: values.receiver_full_name,
                department_name: values.receiver_department,
              }
            : null
        }
        onChange={(v) =>
          dispatch({
            type: 'set',
            patch: {
              receiver_id: v?.id ?? null,
              receiver_full_name: v?.full_name ?? '',
              receiver_department: v?.department_name ?? null,
            },
          })
        }
        errorMessage={errors.receiver_id}
        errorId={errors.receiver_id ? 'kudo-error-receiver' : undefined}
      />
      {errors.receiver_id && (
        <p
          id="kudo-error-receiver"
          role="alert"
          className="font-montserrat text-[12px] text-saa-kudo-hashtag"
        >
          {errors.receiver_id}
        </p>
      )}

      <MessageTextarea
        value={values.message}
        onChange={(v) => dispatch({ type: 'set', patch: { message: v } })}
        errorMessage={errors.message}
      />

      <HashtagPicker
        value={values.hashtags}
        onChange={(v) => dispatch({ type: 'set', patch: { hashtags: v } })}
        initialOptions={initialHashtags}
        errorMessage={errors.hashtags}
        errorId={errors.hashtags ? 'kudo-error-hashtags' : undefined}
      />
      {errors.hashtags && (
        <p
          id="kudo-error-hashtags"
          role="alert"
          className="font-montserrat text-[12px] text-saa-kudo-hashtag"
        >
          {errors.hashtags}
        </p>
      )}

      <ImageUploader
        entries={uploadPool.entries}
        onPick={(files) => {
          const { rejected } = uploadPool.enqueue(files);
          if (rejected.length > 0) {
            setBanner(`${rejected[0].file.name}: ${rejected[0].reason}`);
          }
        }}
        onRemove={(id) => {
          const entry = uploadPool.entries.find((e) => e.id === id);
          uploadPool.remove(id);
          if (entry?.path) {
            dispatch({
              type: 'set',
              patch: {
                image_paths: valuesRef.current.image_paths.filter(
                  (p) => p !== entry.path,
                ),
              },
            });
          }
        }}
        onReject={(msg) => setBanner(msg)}
      />

      <AnonymousToggle
        isAnonymous={values.is_anonymous}
        displayName={values.anonymous_display_name}
        onAnonymousChange={(v) =>
          dispatch({
            type: 'set',
            patch: {
              is_anonymous: v,
              anonymous_display_name: v ? values.anonymous_display_name : '',
            },
          })
        }
        onDisplayNameChange={(v) =>
          dispatch({ type: 'set', patch: { anonymous_display_name: v } })
        }
        errorMessage={errors.anonymous_display_name}
      />

      <SubmitBar
        onCancel={handleCancel}
        onSubmit={onSubmit}
        submitting={submitting}
        canSubmit={canSubmit}
        retryAfterSec={retryAfter}
      />
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="flex min-h-screen w-full items-start justify-center bg-saa-kudo-container px-[16px] py-[40px]">
        {card}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 px-[16px] py-[40px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      {card}
    </div>
  );
}
