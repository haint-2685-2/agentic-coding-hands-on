// "use client": exposes a React hook with state + AbortController.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import {
  requestUploadUrl,
  uploadImageBytes,
} from '@/lib/api/kudos-compose/client';
import { IMAGE_BYTES_MAX, IMAGE_MIMES } from '@/lib/validation/kudo';

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadEntry {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: UploadStatus;
  path?: string;
  error?: string;
}

interface UseUploadPoolOptions {
  concurrency?: number;
  onComplete?: (path: string, id: string) => void;
  onError?: (msg: string, id: string) => void;
}

/**
 * Caps concurrent presigned-PUT uploads (default 3) and exposes the queue
 * state. Aborting a single entry or the whole pool is honoured via
 * AbortController. Validation of MIME + size happens here so callers don't
 * have to repeat it.
 */
export function useUploadPool({
  concurrency = 3,
  onComplete,
  onError,
}: UseUploadPoolOptions = {}) {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const activeRef = useRef(0);
  const queueRef = useRef<string[]>([]);

  // Cleanup object URLs when the entry is removed/unmounted.
  useEffect(() => {
    return () => {
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current.clear();
    };
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<UploadEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const pump = useCallback(async () => {
    while (activeRef.current < concurrency && queueRef.current.length > 0) {
      const id = queueRef.current.shift();
      if (!id) break;
      activeRef.current += 1;
      void runOne(id);
    }
  }, [concurrency]);

  const runOne = useCallback(
    async (id: string) => {
      const entry =
        entriesRef.current.find((e) => e.id === id) ?? null;
      if (!entry) {
        activeRef.current -= 1;
        return;
      }
      const controller = new AbortController();
      controllersRef.current.set(id, controller);
      update(id, { status: 'uploading', progress: 0 });

      try {
        const supabase = createClient();
        const urlRes = await requestUploadUrl(supabase, entry.file.type, {
          signal: controller.signal,
        });
        if (!urlRes.ok) {
          update(id, { status: 'error', error: urlRes.message });
          onError?.(urlRes.message, id);
          return;
        }
        const putRes = await uploadImageBytes(urlRes.data.upload_url, entry.file, {
          signal: controller.signal,
          onProgress: (pct) => update(id, { progress: pct }),
        });
        if (controller.signal.aborted) return;
        if (!putRes.ok) {
          update(id, {
            status: 'error',
            error: 'Tải ảnh thất bại, vui lòng thử lại',
          });
          onError?.('Tải ảnh thất bại, vui lòng thử lại', id);
          return;
        }
        update(id, {
          status: 'done',
          progress: 100,
          path: urlRes.data.path,
        });
        onComplete?.(urlRes.data.path, id);
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg =
            err instanceof Error ? err.message : 'Tải ảnh thất bại';
          update(id, { status: 'error', error: msg });
          onError?.(msg, id);
        }
      } finally {
        controllersRef.current.delete(id);
        activeRef.current = Math.max(0, activeRef.current - 1);
        void pump();
      }
    },
    [onComplete, onError, pump, update],
  );

  // Mirror state in a ref so the pump can read it without re-binding.
  const entriesRef = useRef<UploadEntry[]>([]);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const enqueue = useCallback(
    (files: File[]): { rejected: { file: File; reason: string }[] } => {
      const accepted: UploadEntry[] = [];
      const rejected: { file: File; reason: string }[] = [];
      for (const f of files) {
        if (!IMAGE_MIMES.includes(f.type as (typeof IMAGE_MIMES)[number])) {
          rejected.push({ file: f, reason: 'Chỉ chấp nhận JPG hoặc PNG' });
          continue;
        }
        if (f.size > IMAGE_BYTES_MAX) {
          rejected.push({ file: f, reason: 'Vượt quá 5 MB' });
          continue;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        accepted.push({
          id,
          file: f,
          previewUrl: URL.createObjectURL(f),
          progress: 0,
          status: 'queued',
        });
      }
      if (accepted.length > 0) {
        setEntries((prev) => [...prev, ...accepted]);
        queueRef.current.push(...accepted.map((e) => e.id));
        // Pump on the next tick so React state is committed first.
        setTimeout(() => void pump(), 0);
      }
      return { rejected };
    },
    [pump],
  );

  const remove = useCallback((id: string) => {
    const ctrl = controllersRef.current.get(id);
    if (ctrl) ctrl.abort();
    controllersRef.current.delete(id);
    setEntries((prev) => {
      const e = prev.find((x) => x.id === id);
      if (e?.previewUrl) {
        try {
          URL.revokeObjectURL(e.previewUrl);
        } catch {
          /* noop */
        }
      }
      return prev.filter((x) => x.id !== id);
    });
    queueRef.current = queueRef.current.filter((x) => x !== id);
  }, []);

  const abortAll = useCallback(() => {
    controllersRef.current.forEach((c) => c.abort());
    controllersRef.current.clear();
    queueRef.current = [];
    activeRef.current = 0;
  }, []);

  return { entries, enqueue, remove, abortAll };
}
