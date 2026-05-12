# Implementation Plan: Open Secret Box (Frontend)

**Frame**: `J3-4YFIpMM-open-secret-box`
**Frame Name**: `Open secret box - chưa mở`
**Date**: 2026-05-12
**Spec**: `specs/J3-4YFIpMM-open-secret-box/spec.md`
**Status**: Draft

---

## Summary

Render the `/secret-box` modal experience: a Server Component runs the auth gate, fetches `GET /functions/v1/me/secret-boxes` for initial counter + history, and passes that state to a single Client modal. The Client modal owns the click → loading → reveal animation and calls `POST /functions/v1/me/secret-boxes/open` via a Server Action wrapper. The FE binds badge image + name strictly to what the BE returns (no client RNG, no client-supplied `badge_code`), maps `409/429/403/network` errors into localised banners, refetches the counter on `visibilitychange`, and traps focus inside the dialog.

---

## Technical Context

**Language/Framework**: TypeScript (strict) / Next.js 14 (App Router only).
**Primary Dependencies**: `react@18`, `next@14`, `@supabase/supabase-js`, `@supabase/ssr`, `tailwindcss`, `clsx`. No `swr` / no global store.
**Database**: N/A on the FE — BE owns `secret_box`, `badge`, and the `fn_open_secret_box` RPC.
**Testing**: Vitest (pure helpers) + Playwright (E2E against `supabase start` + `functions serve`). `axe-core/playwright` for a11y.
**State Management**: React `useState` inside the modal Client Component. No global store (constitution II). Server Action for the mutation per constitution data-fetching guidance.
**API Style**: Supabase Auth SDK for the gate (cookie-bound); typed wrapper + Server Action for the Edge Function calls. BE error shape `{ error: { code, message } }`.

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin*

- [x] **I — Frontend-only scope**: no SQL, no RLS, no Edge Function. RPC `fn_open_secret_box` already exists in BE.
- [x] **II — Server Components by default**: `app/secret-box/page.tsx` is RSC; only `SecretBoxModal.tsx` carries `"use client"`, with a one-line justification comment.
- [x] **III — TDD**: Playwright E2E covers all US1–US5 ACs against the local BE (no BE mocking). Vitest covers pure helpers (`formatCount`, `mapBoxError`, `parseRetryAfter`).
- [x] **IV — A11y + secure coding**: `<button>` for the box (not `<div onClick>`), `role="dialog" aria-modal="true"`, focus trap, `Escape` closes, `role="alert"` for banners, `aria-live="polite"` for reveal. Only `NEXT_PUBLIC_*` referenced; service-role key never read.
- [x] **V — Spec-driven commits**: one `feat(ui): implement open-secret-box` commit; deps pinned.

**Violations (if any)**: none.

---

## Architecture Decisions

### Route tree

```text
app/
└── secret-box/
    └── page.tsx                  # RSC — auth gate (getUser → redirect('/login?redirectTo=/secret-box')) + initial GET /me/secret-boxes; renders <SecretBoxModal initial={...}/>
```

- The page is a route, not an intercepted parallel route — v1 keeps it simple. (Parallel/intercepted routes are explicitly out of scope; v1 navigates to `/secret-box` directly.)
- A Server Action lives in `app/secret-box/actions.ts` (`openBoxAction`) to keep the bearer-token plumbing server-side.

### Component decomposition

| File | Role | RSC/Client | Notes |
|---|---|---|---|
| `app/secret-box/page.tsx` | Page shell — auth gate, initial `GET /me/secret-boxes`, render modal | RSC | Async. Passes `{ unopenedCount, openedHistory }` as `initial` prop. |
| `app/secret-box/actions.ts` | `openBoxAction()` Server Action wrapping `POST /me/secret-boxes/open` | RSC | Returns `{ ok: true, badge, unopened_count } \| { ok: false, code, message, retryAfter? }`. Reads `Retry-After` header. |
| `components/feature/secret-box/SecretBoxModal.tsx` | Whole interactive dialog (title, instructional text, box button, counter, close, banner, badge reveal) | **Client** | Owns `isOpening`, `lastBadge`, `unopenedCount`, `error`, `retryUntil`. `"use client"` justified by (a) `useState` + (b) keyboard + click handlers + (c) `visibilitychange` listener. |
| `components/feature/secret-box/BoxButton.tsx` | The clickable illustrated box `<button>`; renders badge inside frame after reveal | Client | Co-located inside the modal file or split out if it exceeds ~120 lines. `aria-disabled` when `unopenedCount === 0`. Live region for reveal. |
| `components/feature/secret-box/UnopenedCounter.tsx` | Counter display ("Secretbox chưa mở: 04") | RSC (pure) | Stateless; receives `count` prop. Formatting via `formatCount` helper. |
| `components/feature/secret-box/BoxErrorBanner.tsx` | Conditional banner / toast for 409/429/403/network | RSC (pure) | Stateless; receives `code` + `message`. `role="alert"`. |
| `components/ui/Dialog.tsx` | Headless dialog primitive — focus trap, ESC handler, backdrop, `aria-modal` | Client | Reusable across the app. |
| `components/ui/Button.tsx` | Existing primitive — reused by `BoxButton` + close button | RSC | From Login phase. |
| `lib/api/secretBox.ts` | Typed fetch wrappers: `getMyBoxes()`, `openBox()` — used by the Server Action and (optionally) the visibility-refetch | RSC-callable | Functions are pure async with explicit return types. |

**Grouping rationale**: `components/ui/Dialog.tsx` becomes a reusable primitive; everything else under `components/feature/secret-box/` is screen-specific. Splitting `UnopenedCounter` + `BoxErrorBanner` into stateless RSCs (rendered as children of the Client modal via the "Client wraps Server" pattern would over-complicate; in practice we render them inside the Client modal as plain JSX since they have no state).

### State strategy

- **`isOpening`**: local `useState`; locked while the request is in flight (FR-004, SC-003).
- **`unopenedCount`**: local `useState`, seeded from the RSC `initial` prop, overwritten from each `POST /open` response and on every `visibilitychange` refetch (FR-013).
- **`lastBadge`**: local `useState`; the latest revealed badge for the reveal frame.
- **`error`**: local `useState`; carries `{ code, message, retryAfter? }`.
- **`retryUntil`**: timestamp computed from `Retry-After` header on 429; box disabled until `Date.now() >= retryUntil`.
- **No global store, no URL state.** `?error=` is supported as an optional deep-link for `auth/account-disabled` (mirrors Login), read in the RSC and passed as initial `error`.

### Data fetching

- **Auth gate + initial fetch (RSC)**:
  - `app/secret-box/page.tsx` → `createServerClient()` → `getUser()` → if no user `redirect('/login?redirectTo=/secret-box')`.
  - Then `lib/api/secretBox.ts::getMyBoxes(supabase)` → `GET /functions/v1/me/secret-boxes` → `{ unopened_count, opened }`.
- **Mutation (Server Action)**:
  - `app/secret-box/actions.ts::openBoxAction()` → `POST /functions/v1/me/secret-boxes/open` with empty body and the user's session bearer (auto-injected via `createServerClient`). Returns a discriminated-union result. Reads `Retry-After` for 429.
- **Visibility refetch (Client)**:
  - `useEffect` registers a `visibilitychange` listener; on `visibilityState === 'visible'` calls `getMyBoxes` via `createBrowserClient` (or invokes a thin Server Action `refreshBoxesAction`). Updates `unopenedCount`.
- **No `/functions/v1/me` direct call** — the auth gate uses Supabase SSR cookie validation which is equivalent.

**Typed wrapper signatures** (`lib/api/secretBox.ts`):

```ts
export async function getMyBoxes(supabase): Promise<{ unopened_count: number; opened: OpenedHistory[] }>;
export async function openBox(supabase): Promise<OpenBoxResult>;  // discriminated union; sets AbortController upstream
```

### Loading / error / empty states

| State | UX |
|---|---|
| `isOpening` | `BoxButton` disabled; loading indicator overlays the box; caption "Đang mở…" / "Opening…" appears after ~3 s slow-response threshold (spec edge case). |
| `unopenedCount === 0` (initial or after open) | Instructional line removed from DOM (FR-011); `BoxButton` `aria-disabled="true"`; "empty" visual state. |
| `409 secret_box/no_boxes` | Non-blocking toast/banner + counter → 0 + instructional hidden; modal does NOT auto-close (US3 AC2). |
| `429 rate/limited` | Banner "too fast"; box disabled until `retryUntil`; auto-re-enables. |
| `403 auth/account-disabled` | Banner; box disabled permanently for the session. |
| Network / 5xx | Generic retry banner; box re-enabled. |
| Image load failure | `<img onError>` swaps to placeholder silhouette; `aria-label` carries `badge.name` (FR-012). |
| Reduced motion | Reveal animation collapses to instant swap (≤ 50 ms, SC-007). |

### A11y notes

- Modal: `<div role="dialog" aria-modal="true" aria-labelledby="secret-box-title">`. Focus trapped via `Dialog` primitive — Tab/Shift-Tab cycle only over: BoxButton, Close, banner (if focusable). Focus moves to the box on open; returns to the opener on close.
- BoxButton: `<button aria-label="Open a secret box (N remaining)" aria-disabled={count === 0}>` — label updated each render. Live-region (`aria-live="polite"`) wraps the reveal area so SR announces the new badge.
- Counter: rendered as `<p><span class="sr-label">Secretbox chưa mở:</span> <span aria-live="off">04</span></p>` — the SR-friendly phrase is one announcement on mount; subsequent updates rely on the reveal live-region (avoids double-speak).
- ESC closes; click on backdrop closes (unless `isOpening`).
- Contrast: implementer must verify yellow-on-dark counter; axe assertion in Polish phase.

---

## Risks / open questions

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Server Action can't return `Retry-After` cleanly (headers don't propagate through React Server Actions) | Med | Med | Either include `retryAfter` in the action's return payload (compute inside the action by reading the underlying fetch response) OR fall back to a typed wrapper called via `fetch` from the Client. Plan picks option A — the action wraps the raw fetch and returns the parsed seconds. |
| Supabase Storage host not whitelisted in `next.config.mjs` `images.remotePatterns` | Med | Low | Use plain `<img>` for badges instead of `<Image>`; deferred to implement-ui if optimisation becomes necessary. |
| Race: `visibilitychange` refetch arrives during an `isOpening` request | Low | Low | Refetch is guarded by `if (!isOpening)`; otherwise dropped — the open response already updates state authoritatively. |
| AbortController cancels the in-flight open if the route is left mid-request, but the BE may still complete the transaction | Low | Med | Acceptable — the BE is authoritative; on return to the page the counter refetch reflects the actual state. Documented as US1 edge case. |
| Focus trap breaks if the only enabled control is `aria-disabled` (focus has nowhere to go) | Low | Med | Even when disabled, BoxButton remains focusable (`aria-disabled`, not `disabled`); Close button is always enabled — at least 2 focus targets. |

**Open questions**: none blocking. Modal entry behaviour (modal vs full page) deferred to implement-ui — semantics remain dialog either way.

---

## Next Steps

1. Tasks emitted in `tasks.md` (this batch).
2. Implement per task order; commit as `feat(ui): implement open-secret-box`.
3. Quality gate: `pnpm typecheck && pnpm lint && pnpm build && pnpm e2e` against a fresh `supabase db reset` with seeded boxes.
