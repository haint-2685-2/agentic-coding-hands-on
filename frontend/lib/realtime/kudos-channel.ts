/**
 * Optional Supabase Realtime subscription for `/kudos`. The MVP polls every
 * 30s per the spec (Out of Scope: realtime push). This module is a thin
 * wrapper kept stable for the follow-up that wires `postgres_changes` on the
 * `kudo` table; callers should treat the returned `unsubscribe` as a
 * `() => void` and tolerate it being a no-op.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface KudosRealtimeHandlers {
  onInsert?: (id: string) => void;
}

export function subscribeKudosChannel(
  supabase: SupabaseClient,
  handlers: KudosRealtimeHandlers,
): () => void {
  // Realtime intentionally disabled for MVP — feed polls every 30s. The
  // function is exported so the integration boundary is in place and the
  // follow-up only has to flip the body without touching call sites.
  void supabase;
  void handlers;
  return () => {
    /* no-op */
  };
}
