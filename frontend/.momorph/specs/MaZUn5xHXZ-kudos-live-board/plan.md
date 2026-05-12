# Implementation Plan: Sun* Kudos — Live Board (Frontend)

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**Date**: 2026-05-12
**Spec**: [`./spec.md`](./spec.md)
**Status**: Draft

---

## Summary

Deliver `/kudos` — the four-pane Live Board — as a Next.js 14 RSC + Client composition: RSC `app/kudos/page.tsx` performs the first-page fetch of feed, highlights, stats, hashtag/department dropdowns from the cookie-bound Supabase client; client islands handle filtering (URL search params as source of truth), infinite scroll, optimistic like/unlike (debounced 500ms, reducer-based), the dynamically-imported Spotlight word-cloud, and the intercepted Secret-Box modal at `/kudos/secret-box`. Auth gate is enforced at the route layout (redirect to `/login?next=/kudos`). No Realtime in MVP — feed polls every 30s when visible and idle.

---

## Technical Context

**Language/Framework**: TypeScript (strict) / Next.js 14 App Router
**Primary Dependencies**: `react`, `next`, `@supabase/supabase-js`, `@supabase/ssr`, `tailwindcss`, `clsx`, `tailwind-merge`. **Dynamic-only**: a word-cloud renderer (e.g. `d3-cloud` + `d3-selection`) imported via `next/dynamic({ ssr: false })`.
**Database**: N/A (FE-only)
**Testing**: Vitest (unit, for reducers + helpers) + Playwright (E2E)
**State Management**: URL search params + page-scoped `useReducer` (likes map) + local component `useState`. No global store.
**API Style**: REST over Supabase Edge Functions; shared `_client.ts` wrapper with the Homepage feature.

---

## Constitution Compliance Check

*GATE: must pass before tasks.md is generated.*

- [x] **Principle I — FE-only scope**: All 10 endpoints in spec `API Dependencies` already exist in `backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md`. No BE work.
- [x] **Principle II — RSC by default**: `app/kudos/page.tsx`, `app/kudos/layout.tsx`, `KudosBanner.tsx`, `SidebarStats.tsx` shell, `FeedHeader.tsx`, `KudoCard.tsx` outer markup are RSC. `"use client"` is scoped to: filter dropdowns, carousel, infinite-scroll feed body, like button, copy-link button, quick-input pill, Spotlight pane, Secret-Box trigger. Each `"use client"` file carries the trigger comment.
- [x] **Principle III — TDD**: Each P1 acceptance scenario has a Playwright spec written before the component (tasks flagged `[TEST-FIRST]`). The likes reducer + URL-filter sync helper get Vitest unit tests.
- [x] **Principle IV — A11y & security**: heart `aria-pressed`, carousel `aria-disabled` at ends, spotlight parallel `<ul>` for SR users, focus trap on lightbox/modal/dropdowns; no service-role key; only `NEXT_PUBLIC_*` env in client bundle.
- [x] **Principle V — Spec-driven commits**: one `feat(ui): implement kudos live board` commit; deps pinned.

**Violations**: none. Dynamic-import of word-cloud (TR-007) is recorded here so the Phase 10 bundle audit treats it as out-of-route-chunk.

---

## Architecture Decisions

### Route tree

```
app/
├── kudos/
│   ├── layout.tsx              # RSC — auth gate (redirect /login?next=/kudos)
│   ├── page.tsx                # RSC — first-page fetch of feed + highlights + stats + filters
│   ├── error.tsx               # Client — render-error fallback
│   ├── loading.tsx             # RSC — skeleton (banner + carousel + first 5 feed cards)
│   └── @modal/                 # Parallel modal slot (intercepted route)
│       └── secret-box/
│           └── page.tsx        # Intercepted modal mount (body owned by J3-4YFIpMM spec)
```

Note: `@modal` is mounted in `app/layout.tsx` (root). `/kudos/<id>` detail page is **out of scope**; this plan only references it as a click target.

### Component decomposition

| File | Layer | Role | Props |
|------|-------|------|-------|
| `app/kudos/layout.tsx` | RSC | Auth gate via `getMe()`; redirect on null | `children, modal` |
| `app/kudos/page.tsx` | RSC | Parallel fetch of `kudos`, `highlights`, `stats`, `hashtags`, `departments`; reads search params; composes children | — |
| `components/feature/kudos/KudosBanner.tsx` | RSC | Banner KV + quick-input pill mount | — |
| `components/feature/kudos/QuickInputPill.tsx` | Client (event + dialog open) | `<button>` → opens Viết Kudo dialog; node `A.1 / 2940:13449` | — |
| `components/feature/kudos/HighlightSection.tsx` | RSC | Wraps `HighlightHeader` + `<HighlightCarousel/>` Suspense boundary | `initialItems, filters` |
| `components/feature/kudos/HighlightHeader.tsx` | RSC shell + Client filter children | Title + filter row (`B.1`) | — |
| `components/feature/kudos/HashtagFilter.tsx` | Client (URL state) | Dropdown `B.1.1 / 2940:13459`; writes `?hashtag=` via `router.replace` | `options, current` |
| `components/feature/kudos/DepartmentFilter.tsx` | Client (URL state) | Dropdown `B.1.2 / 2940:13460`; writes `?department=` | `options, current` |
| `components/feature/kudos/HighlightCarousel.tsx` | Client (state + keyboard) | Slides `B.2.3 / 2940:13463`; prev/next; refetches on filter change via SWR-like effect | `initialItems, filters` |
| `components/feature/kudos/FeedSection.tsx` | Client (state + IntersectionObserver + poll) | Owns the feed list, infinite scroll, 30s poll loop; node `C / 2940:13475` | `initialItems, initialCursor, filters` |
| `components/feature/kudos/KudoCard.tsx` | RSC shell + Client islands | Single card `C.3 / 3127:21871`; renders message, hashtag chips (Client `HashtagChip`), image gallery, time, ActionsRow (Client) | `kudo: Kudo` |
| `components/feature/kudos/HashtagChip.tsx` | Client (event) | Pill that writes `?hashtag=<slug>` | `slug, label` |
| `components/feature/kudos/ActionsRow.tsx` | Client | Wraps `HeartButton` + `CopyLinkButton` + `ViewDetailLink` (`C.4 / 256:5194`) | `kudoId, viewerHasLiked, viewerIsSender, likeCount` |
| `components/feature/kudos/HeartButton.tsx` | Client (state + debounce) | `aria-pressed` toggle; optimistic via reducer; node `C.4.1 / 256:5175` | `kudoId, initialLiked, initialCount, disabled` |
| `components/feature/kudos/CopyLinkButton.tsx` | Client | Clipboard write + toast; node `C.4.2 / 256:5216` | `kudoId` |
| `components/feature/kudos/ImageGallery.tsx` | Client (state for lightbox) | Up to 5 tiles + lightbox; node `C.3.6 / 256:5176` | `images` |
| `components/feature/kudos/SpotlightPane.tsx` | Client (state + debounce + dynamic word-cloud) | Toggle `B.7 / 2940:14174`; calls `/kudos/spotlight?q=` | `initialNodes, totalKudos` |
| `components/feature/kudos/SpotlightSearch.tsx` | Client | `maxLength=100` input; 300ms debounce; node `B.7.3 / 2940:14833` | `onQuery` |
| `components/feature/kudos/SidebarStats.tsx` | RSC shell | Stats numbers `D.1`; mounts `SecretBoxTrigger` | `stats` |
| `components/feature/kudos/Leaderboard.tsx` | RSC | Top 10 receivers / senders rows `D.3` | `entries, title` |
| `components/feature/kudos/SecretBoxTrigger.tsx` | Client | Button "Mở quà" `D.1.8 / 2940:13497`; navigates to `/kudos/secret-box` (intercepted) | — |
| `components/feature/kudos/EmptyState.tsx` | RSC | "Hiện tại chưa có Kudos nào." / "Chưa có dữ liệu" | `variant` |
| `components/ui/Lightbox.tsx` | Client (focus trap) | Reused image viewer | — |
| `components/ui/Toast.tsx` | Client | Shared with Homepage feature | — |

Grouping: `components/ui/*` shared primitives; `components/feature/kudos/*` screen-local.

### State strategy

- **URL search params (source of truth)**: `?hashtag=<slug>`, `?department=<uuid>`. Read in RSC via `searchParams` prop for the initial fetch; in client islands via `useSearchParams`. Filter mutations call `router.replace({ scroll: false })` so the back/forward stack is not polluted while typing in dropdown search (TR-003).
- **Feed**: `useReducer` inside `FeedSection.tsx` keyed by `(filters)`. State shape `{ items, nextCursor, isLoading, isPolling, isPaused }`. `IntersectionObserver` sentinel triggers `append`. Poll loop is one `useEffect` keyed on `visibilityState` + `isUserScrolling` (1s debounce); 30s cadence; pauses on filter change until network completes (TR-009).
- **Likes**: page-scoped `useReducer` `(kudoId → { liked, count })` mounted at the `FeedSection` boundary and broadcast to both feed cards and carousel cards via React Context. Toggle is debounced 500ms (FR-010); the reducer applies the optimistic flip, the wrapper fires `POST` or `DELETE` based on the **current** state (TR-010), the response reconciles `like_count` (handles `hearts_added: 2` per US4 AC5). On error the snapshot rollback + toast.
- **Hashtag/Department dropdowns**: initial server-fetched into RSC and passed as props; client component memoizes for the session (FR-006 / FR-007). No refetch on filter change.
- **Spotlight**: own `useReducer` inside the dynamically-loaded chunk; `q` debounced 300ms; canvas/SVG rendered after `next/dynamic({ ssr: false })` (TR-007).
- **Sidebar stats**: server-fetched once; re-fetched after a Viết Kudo success event bubbles to `/kudos` via a custom `kudo:created` window event (FR-015).

### Data fetching

Typed wrappers under `lib/api/kudos.ts` + `lib/api/users.ts`:

| Wrapper | BE endpoint | Caller |
|---------|-------------|--------|
| `listKudos({ before?, hashtag?, department? })` | `GET /functions/v1/kudos?limit=20&before=&hashtag=&department=` | RSC (first page) + `FeedSection` (subsequent) |
| `listHighlights({ hashtag?, department? })` | `GET /functions/v1/kudos/highlights?hashtag=&department=` | RSC initial + `HighlightCarousel` refetch on filter change |
| `getSpotlight({ q? })` | `GET /functions/v1/kudos/spotlight?q=` | `SpotlightPane` (client) |
| `getKudosStats()` | `GET /functions/v1/kudos/stats` | RSC (once) + re-fetch on `kudo:created` |
| `listHashtags()` | `GET /functions/v1/hashtags?limit=50` | RSC |
| `listDepartments()` | `GET /functions/v1/departments` | RSC |
| `toggleLike(id, currentLiked)` | `POST` or `DELETE /functions/v1/kudos/{id}/like` | `HeartButton` (client) |
| `getUser(id)` | `GET /functions/v1/users/{id}` | hover preview + profile click guard |
| `getMe()` | `GET /functions/v1/me` | layout auth gate |

All wrappers return `{ ok, data } | { ok, error }`. 401 anywhere → router push to `/login?next=/kudos` (FR-019). 429 → exponential backoff in the affected poll loop (FR-020).

### Loading / error / empty states

| Surface | Loading | Error | Empty |
|---------|---------|-------|-------|
| Banner / quick-input | n/a | n/a | n/a |
| Highlight carousel | Suspense → 5 skeleton slides | inline "Không tải được highlights" + retry | hidden entirely when 0 items (US2 AC5) |
| Feed | Suspense → 5 skeleton cards | `app/kudos/error.tsx` | `<EmptyState variant="feed"/>` "Hiện tại chưa có Kudos nào." (US1 AC3) |
| Spotlight | overlay spinner on cloud (US6 AC4) | inline error + retry | "Chưa có dữ liệu" (US6 AC5) |
| Sidebar stats | row-level shimmer | inline error | "Chưa có dữ liệu" for leaderboards (US7 AC4) |
| Heart button | optimistic (no visible loading) | rollback + toast (US4 AC4) | n/a |
| Copy link | n/a | fallback selection + error toast (US5 AC2) | n/a |
| Lightbox | crossfade between images | per-image broken thumb retains gallery | n/a |
| Hashtag/Dept dropdowns | trigger shows "—" while loading (RSC means this is rare) | disabled trigger + tooltip "Chưa có dữ liệu" (Edge case) | same disabled state |

### A11y notes

- Quick-input pill is a real `<button aria-haspopup="dialog">`.
- Carousel arrows reflect `aria-disabled` at ends + `ArrowLeft/Right` keyboard navigation when the carousel is focused (TR-008).
- Heart button: `aria-pressed`, `aria-label` toggles "Thả tim"/"Bỏ tim"; `aria-disabled="true"` for own kudos with tooltip "Bạn không thể like Kudos của chính mình".
- Image lightbox: focus trap (shared `useFocusTrap` from Homepage Phase 2), `Esc` closes, `←/→` navigates.
- Spotlight: parallel visually-hidden `<ul>` of recipients with counts so non-visual users get the same content as the canvas cloud.
- Toasts: `role="status"` for success, `role="alert"` for errors.
- All hit areas ≥ 40×40 CSS px; focus ring visible everywhere.

---

## Risks & Open Questions

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Word-cloud library cost in main bundle | High | High | `next/dynamic({ ssr: false })`; verify chunk split in `pnpm build` analyze (SC-002) |
| Likes race between feed card + carousel card for same kudo | High | Medium | Single page-scoped reducer via Context shared by both lists |
| Filter spam on rapid hashtag toggling | Medium | Medium | `router.replace` (not `push`); debounce dropdown commits; backend already cache-friendly |
| `/users/{id}` hover preview floods network on grid hover | Medium | Low | 300ms hover delay + AbortController on mouseleave (Edge case) |
| Polling competes with infinite-scroll fetches | Medium | Medium | `isUserScrolling` flag pauses poll for 1s after scroll (TR-009) |
| Secret-box intercepted route fails when entered via direct URL | Low | Medium | Provide a non-intercepted fallback page at the same path (delegated to `J3-4YFIpMM` plan) |
| Spotlight truncation header `X-Truncated: true` | Low | Low | Read header in wrapper; render hint "Hiển thị 500 Sunner đầu" |

**Open questions**: pinch-zoom on touch is intentionally deferred per spec Out-of-Scope; revisit if QA flags.

---

## Notes

- The likes reducer + Context provider lives at `components/feature/kudos/LikesProvider.tsx` so both `FeedSection` and `HighlightCarousel` consume the same store.
- The intercepted modal route `app/@modal/secret-box/page.tsx` mounts the dialog body provided by the Secret Box FE spec (`J3-4YFIpMM`); this plan only delivers the trigger + parallel slot wiring.
- `kudo:created` window event is the FE-only signal used between Viết Kudo dialog and this board; it does not cross a process boundary.
- See [`./spec.md`](./spec.md) for FR/TR IDs and acceptance scenarios; this plan does not duplicate them.
