// "use client" required: this module owns React state + a reducer + Context
// shared between the highlight carousel and the feed.
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { createClient } from '@/lib/supabase/browser';
import { toggleLike } from '@/lib/api/kudos/client';
import type { Kudo } from '@/lib/api/kudos/types';

interface LikeEntry {
  liked: boolean;
  count: number;
}

type LikesMap = Record<string, LikeEntry>;

type Action =
  | { type: 'seed'; entries: LikesMap }
  | { type: 'optimistic'; id: string; nextLiked: boolean }
  | { type: 'reconcile'; id: string; liked: boolean; count: number }
  | { type: 'rollback'; id: string; previous: LikeEntry };

function reducer(state: LikesMap, action: Action): LikesMap {
  switch (action.type) {
    case 'seed': {
      // Merge — never overwrite a more recent optimistic state we may already
      // have for an item that re-appears in a later page.
      const merged: LikesMap = { ...action.entries };
      for (const [id, entry] of Object.entries(state)) {
        merged[id] = entry;
      }
      return merged;
    }
    case 'optimistic': {
      const current = state[action.id];
      if (!current) return state;
      const delta = action.nextLiked === current.liked ? 0 : action.nextLiked ? 1 : -1;
      return {
        ...state,
        [action.id]: {
          liked: action.nextLiked,
          count: Math.max(0, current.count + delta),
        },
      };
    }
    case 'reconcile':
      return {
        ...state,
        [action.id]: { liked: action.liked, count: action.count },
      };
    case 'rollback':
      return { ...state, [action.id]: action.previous };
    default:
      return state;
  }
}

interface LikesContextValue {
  state: LikesMap;
  seed: (items: Kudo[]) => void;
  toggle: (kudo: Kudo) => void;
  get: (id: string, fallback: LikeEntry) => LikeEntry;
}

const LikesContext = createContext<LikesContextValue | null>(null);

interface LikesProviderProps {
  initial: Kudo[];
  children: React.ReactNode;
}

export function LikesProvider({ initial, children }: LikesProviderProps) {
  const [state, dispatch] = useReducer(
    reducer,
    initial,
    (items: Kudo[]): LikesMap => {
      const m: LikesMap = {};
      for (const k of items) {
        m[k.id] = { liked: k.viewer_has_liked, count: k.like_count };
      }
      return m;
    },
  );

  // 500ms debounce per kudo id — coalesces rapid taps into a single net call.
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Inflight tracking so a slower network reply doesn't clobber a newer
  // optimistic state.
  const inflight = useRef<Record<string, number>>({});

  const seed = useCallback((items: Kudo[]) => {
    const entries: LikesMap = {};
    for (const k of items) {
      entries[k.id] = { liked: k.viewer_has_liked, count: k.like_count };
    }
    dispatch({ type: 'seed', entries });
  }, []);

  const get = useCallback(
    (id: string, fallback: LikeEntry): LikeEntry => state[id] ?? fallback,
    [state],
  );

  const toggle = useCallback((kudo: Kudo) => {
    if (kudo.viewer_is_sender) return;
    const id = kudo.id;
    const previous = state[id] ?? {
      liked: kudo.viewer_has_liked,
      count: kudo.like_count,
    };
    const nextLiked = !previous.liked;
    // Optimistic flip immediately so the UI feels native.
    dispatch({ type: 'optimistic', id, nextLiked });

    // Debounce the network call by 500ms.
    if (timers.current[id]) clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(async () => {
      const ticket = (inflight.current[id] ?? 0) + 1;
      inflight.current[id] = ticket;
      const supabase = createClient();
      const result = await toggleLike(supabase, id, previous.liked);
      // If a newer optimistic action superseded this request, ignore the
      // server's view — the next debounced call will reconcile.
      if (inflight.current[id] !== ticket) return;
      if (result.ok) {
        dispatch({
          type: 'reconcile',
          id,
          liked: result.data.liked,
          count: result.data.like_count,
        });
      } else {
        dispatch({ type: 'rollback', id, previous });
      }
    }, 500);
  }, [state]);

  const value = useMemo<LikesContextValue>(
    () => ({ state, seed, toggle, get }),
    [state, seed, toggle, get],
  );

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesContextValue {
  const ctx = useContext(LikesContext);
  if (!ctx) {
    throw new Error('useLikes must be used inside <LikesProvider>');
  }
  return ctx;
}
