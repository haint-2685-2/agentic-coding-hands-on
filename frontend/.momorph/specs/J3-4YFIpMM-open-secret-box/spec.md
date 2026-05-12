# Feature Specification: Open Secret Box (Frontend)

**Frame ID**: `J3-4YFIpMM`
**Frame Name**: `Open secret box - chưa mở`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Client-side only — render the Secret Box modal, drive the "click box → open → reveal badge" interaction, gate the screen behind auth (redirect anon to `/login`), show counters and recent-history fed by the BE, and degrade gracefully when the BE reports "no boxes left" or "already opened" concurrency. The random-pick logic, the `SKIP LOCKED` RPC, drop-weight enforcement, and the `secret_box` / `badge` schema are **out of scope** — see [../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md](../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md).

---

## Overview

The Secret Box experience is a modal-style page that lets a signed-in Sun-er click an illustrated box to open one entitlement at a time. Each click triggers the BE RPC `POST /me/secret-boxes/open`, which returns one randomly-selected badge plus the updated `unopened_count`. The FE animates the open transition (closed → loading → reveal), then returns to the standby state with the new badge framed inside the box illustration and the counter decremented. When `unopened_count = 0` the instructional copy hides and the box click is disabled.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open one box and reveal a badge (Priority: P1)

A signed-in user with at least one unopened secret box clicks the box illustration. The FE shows a brief loading/opening state, then reveals the badge inside the box frame, decrements the counter visibly, and re-enables the box for the next click (if any boxes remain).

**Why this priority**: Core kudos-game mechanic; the screen is meaningless without this loop.

**Independent Test**: Playwright E2E against the local BE stack. Seed the test user with 2 unopened boxes via a SQL fixture. Open the modal route. Click the box. Assert (a) the click handler enters loading state within 100 ms, (b) the FE network panel shows exactly one `POST /functions/v1/me/secret-boxes/open`, (c) on `200` response the badge image swaps to match `badge_code`, (d) counter shows `01`, (e) clicking again opens the second box and counter shows `00`, (f) the box becomes non-interactive after that.

**Acceptance Scenarios**:

1. **Given** the modal is open with `unopened_count >= 1`, **When** the user clicks the box illustration, **Then** the FE calls `POST /functions/v1/me/secret-boxes/open` (no body) with the Supabase session.
2. **Given** the BE responds `200 { badge: { code, name, description, image_path }, unopened_count }`, **When** the FE receives the response, **Then** the box transitions through the "opening" state (loading indicator overlaying the box) then reveals the badge artwork inside the box frame and updates the counter display.
3. **Given** the new `unopened_count > 0`, **When** the reveal completes, **Then** the instructional line "Click vào box để tiếp tục mở" remains visible and the box illustration is clickable again.
4. **Given** the new `unopened_count == 0`, **When** the reveal completes, **Then** the instructional line is hidden, the box illustration is `aria-disabled="true"` and clicks are no-ops.
5. **Given** the user double-clicks the box rapidly, **When** the second click fires before the first response, **Then** the second click is a no-op (button is locked while a request is in flight).

---

### User Story 2 — Anonymous user is sent to Login (Priority: P1)

If an unauthenticated visitor navigates to `/secret-box`, they must not see the modal. The FE redirects them to `/login` and they can return to `/secret-box` after signing in.

**Why this priority**: Per BE US1 AC3 / MoMorph TC `84a5ba82`, the endpoint returns `401` for anon — but we should never let the user reach the click in the first place.

**Independent Test**: Playwright: clear all cookies; visit `/secret-box`. Assert (a) the response is a redirect to `/login?redirectTo=/secret-box`, (b) the modal is never rendered, (c) after completing login the user lands back on `/secret-box`.

**Acceptance Scenarios**:

1. **Given** no Supabase session cookie, **When** the `/secret-box` Server Component runs `supabase.auth.getUser()`, **Then** it `redirect('/login?redirectTo=/secret-box')`.
2. **Given** a valid session whose `is_active = false`, **When** the page loads and the first API call returns `403 { code: 'auth/account-disabled' }`, **Then** the FE shows a banner *"Tài khoản của bạn đã bị vô hiệu hóa."* / *"Your account has been disabled."* and the box is rendered in disabled state.

---

### User Story 3 — Handle "no boxes left" gracefully (Priority: P2)

If the user opens the modal when `unopened_count = 0` (either because they've already opened everything, or because another tab beat them to the last box), the FE must clearly communicate that there's nothing to open — no broken click, no crash.

**Why this priority**: BE returns `409 secret_box/no_boxes`. The screen must not appear broken.

**Acceptance Scenarios**:

1. **Given** the initial `GET /functions/v1/me/secret-boxes` returns `unopened_count: 0`, **When** the modal renders, **Then** the counter shows `00`, the instructional line is hidden, the box illustration is rendered in a "closed/empty" visual state (deferred to implement-ui) with `aria-disabled="true"`, and clicking does nothing.
2. **Given** the user is mid-open (clicked once) and a concurrent tab opens the last box first, **When** the FE's `POST /open` returns `409 { error: { code: 'secret_box/no_boxes', message: '...' } }`, **Then** the FE updates the counter to `00`, hides the instructional line, and shows a non-blocking toast/banner *"Không còn secret box để mở."* / *"No more secret boxes to open."* (the modal does NOT auto-close).
3. **Given** the BE responds with `429 { code: 'rate/limited' }` (rate-limit per BE FR-005), **When** the FE receives it, **Then** it shows *"Bạn đang mở quá nhanh — vui lòng chờ giây lát."* / *"You're opening too fast — please wait a moment."* and locks the box for the duration of the `Retry-After` header.

---

### User Story 4 — Read counters on mount + after each open (Priority: P2)

The counter "Secretbox chưa mở: NN" is sourced from the BE on mount, then re-derived from each `POST /open` response (the BE returns the new `unopened_count` so a second `GET` is not required).

**Acceptance Scenarios**:

1. **Given** the modal mounts, **When** the Server Component runs, **Then** it fetches `GET /functions/v1/me/secret-boxes` once and renders `unopened_count` formatted as a 2-digit zero-padded string (e.g. `04`).
2. **Given** the BE returns `unopened_count: 100` (test case `ce44f5ed` maximum allowed value), **When** the value renders, **Then** it is displayed without truncation (e.g. `100`, not `99+` or clipped). The label `Secretbox chưa mở` is rendered exactly as written.
3. **Given** the user successfully opens a box, **When** the FE updates local state from the `POST /open` response, **Then** the counter on screen reflects the new `unopened_count` immediately (no extra GET round-trip).
4. **Given** a stale counter is suspected (e.g. focus returns to the tab after long idle), **When** the page regains visibility (`visibilitychange` event), **Then** the FE refetches `GET /me/secret-boxes` to resync — protects against TC `5cc072ad` client-side tampering (BE is always authoritative).

---

### User Story 5 — Close the modal (Priority: P3)

The `X` close button at the top-right of the modal closes it and returns the user to whatever route hosts it (typically the previous page or Homepage).

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** the user clicks the `X` close button, **Then** the modal closes and the previous route is restored (or `/` if `/secret-box` was the entry).
2. **Given** the modal is open, **When** the user presses `Escape`, **Then** the modal closes (same behaviour as clicking `X`).
3. **Given** the modal is open, **When** focus is trapped inside (per constitution Principle IV), **Then** `Tab` cycles only through the box, the close button, and any banner/toast — not the body underneath.

---

### Edge Cases

- **Double-click the box**: the second click is ignored while `isOpening === true`. No duplicate `POST /open`.
- **Box image asset missing / 404**: per MoMorph TC `43badf5d` + BE Edge Case, the FE renders a fallback badge silhouette and an `aria-label` describing the badge name; the screen does not crash.
- **Badge `image_path` returns an unexpected MIME / corrupt bytes**: the `<img>` `onError` handler swaps in the fallback. Page logs a single warning to the console (`console.warn`, not `console.error`, to avoid noisy CI logs).
- **Network drop mid-open**: `POST /open` rejects with a fetch error. The FE shows *"Mất kết nối, vui lòng thử lại."* / *"Connection lost, please try again."* and re-enables the box.
- **Browser back during loading state**: leaving the route cancels the in-flight request (via `AbortController`); no orphan state.
- **Tab focus loss during loading**: the request continues in the background; on focus regain the FE checks `isOpening` and either reflects the response (if it landed) or refetches the counter to resync.
- **Client tampering with the displayed counter via DevTools** (TC `5cc072ad`): the next `GET /me/secret-boxes` (e.g. on focus regain) overwrites the local state — the FE NEVER trusts the on-screen number as a source of truth.
- **Client tampering with the badge image URL** (TC `2e7bec78`): images render from `badge.image_path` returned by the BE; the FE does NOT support a `?image=` query param or any way for the user to inject an arbitrary URL.
- **Reduced motion**: the opening animation MUST honour `prefers-reduced-motion` (cross-fade instead of spin, or instant swap).
- **Very slow open response (> 3 s)**: a secondary "Đang mở…" / "Opening…" caption appears under the box; the loading indicator stays.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Modal title `A` | `1466:7678` | Static heading "MỞ SECRET BOX THÀNH CÔNG" (test case `a0cd2f27`) | Non-interactive. Render as `<h1>` / `<h2>` for screen readers. |
| Instructional text `B` | `1466:7681` | Localised hint "Click vào box để tiếp tục mở" (test case `a891383a`) | Non-interactive. Conditional render — hidden when `unopened_count === 0` (test case `d9d6e01a`). |
| Box image (click target) `C` | `1466:7684` | Illustrated gift box; reveals the badge artwork inside on open (test cases `dd842531`, `56da7ec8`, `4bbf0b67`) | Click → `POST /me/secret-boxes/open`. Hover → pointer cursor + subtle elevation (visual detail deferred). `aria-disabled` when `unopened_count === 0` (test case `2a8a63de`). Click enabled when `unopened_count > 0` (test case `7c3c912f`). |
| Unopened counter `D` | `1466:7689` | Label "Secretbox chưa mở" + value (e.g. `04`) (test cases `3a8ac6b5`, `ce44f5ed`, `96fb45e8`) | Non-interactive. Value reflects `unopened_count` from BE; re-rendered on every successful open. |
| Modal close `X` *(present in design, no explicit node id in MoMorph data — locate visually in `1466:7676` modal root)* | (root frame `1466:7676`) | Top-right close button (test cases `632c600b`, `982ae7f9`) | Click → close modal. `Escape` shortcut → close (a11y). |
| Error / toast banner *(new — derived from US3)* | n/a | Conditionally rendered when BE returns `409`, `429`, `403`, or network error | Auto-dismiss after a few seconds OR manual dismiss; details deferred to implement-ui. `role="alert"` for SR announcement. |

### Navigation Flow

- **From**: any authenticated screen that links to `/secret-box` (Homepage shortcut, Live Board, kudos detail).
- **To**: prior route on close, or `/login?redirectTo=/secret-box` if the user is anonymous on entry.
- **Triggers**:
  - Box click (auth + `unopened_count > 0`) → `POST /me/secret-boxes/open` → reveal badge in place.
  - Close `X` or `Escape` → leave modal.

### Visual Requirements

- **Responsive breakpoints**: mobile (≤ 640) → modal occupies full viewport with safe-area padding; tablet (641–1024) and desktop (≥ 1025) → modal is centered with backdrop. Title stays centered top across breakpoints (test case `1f381999`). Box stays centered horizontally and vertically inside modal (test case `dd842531`). Counter stays at modal bottom.
- **Animations / Transitions**:
  - Box "opening" transition: closed → opening → revealed (behavioural; exact frames/values deferred to implement-ui phase fetch from Figma).
  - Reveal: badge image cross-fades in.
  - Honour `prefers-reduced-motion` (skip cross-fade, instant swap).
- **Accessibility (WCAG 2.1 AA)**:
  - Modal is a `<div role="dialog" aria-modal="true" aria-labelledby="...">`; focus is trapped inside while open; `Escape` closes; on close, focus is returned to the element that opened the modal.
  - Box illustration is a `<button>` (not a `<div onClick>`), with `aria-label` like "Open a secret box (4 remaining)" updated each render.
  - When `aria-disabled="true"`, the button still receives focus and announces "Open a secret box, no boxes remaining".
  - Counter is rendered in semantic markup so a screen reader announces label + value as one phrase.
  - Live region (`aria-live="polite"`) wraps the badge reveal area so SR announces the new badge name after each open.
  - Contrast ≥ AA on all text including the counter (the design notes "yellow on dark" — implementer must verify in implement-ui).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/secret-box` route MUST be a Server Component that first calls `supabase.auth.getUser()`; if no user, `redirect('/login?redirectTo=/secret-box')`. If a user exists, fetch `GET /functions/v1/me/secret-boxes` server-side and pass the initial state to the Client Component.
- **FR-002**: The box illustration MUST be a Client Component (it owns `isOpening` state + click handler). It MUST render as a `<button>` for keyboard + assistive-tech access.
- **FR-003**: Clicking the box MUST call `POST /functions/v1/me/secret-boxes/open` with the Supabase session and no body. Unknown keys in any request body are forbidden (BE enforces `strict()` schema → would return `422`).
- **FR-004**: While `isOpening === true` the box MUST be `disabled` AND show a loading/opening indicator AND ignore additional clicks AND prevent route navigation? (no — back is allowed; the in-flight request is aborted via `AbortController`).
- **FR-005**: On `200`, the FE MUST (a) update the displayed badge image to `badge.image_path` (resolved against the Supabase Storage public URL OR an `<img src>` whose URL is exactly the BE-returned `image_path` — no client-side URL synthesis beyond joining the storage base), (b) set the displayed badge name from `badge.name` (localised via `Accept-Language` header or the user's `locale`), (c) update `unopened_count` from the response.
- **FR-006**: On `409 secret_box/no_boxes`, the FE MUST update `unopened_count` to `0`, hide the instructional text, render the box in its disabled state, and show a non-blocking error banner with the localised message.
- **FR-007**: On `429 rate/limited`, the FE MUST disable the box for `Retry-After` seconds (parsed from header) and show a localised "too fast" banner.
- **FR-008**: On `403 auth/account-disabled`, the FE MUST show the "account disabled" banner and disable the box permanently for the session.
- **FR-009**: On any other error (network failure, `500`, etc.), the FE MUST show a generic localised retry banner and re-enable the box.
- **FR-010**: The counter MUST be displayed as zero-padded 2-digit (`04`) when value is < 100, and as the raw integer when ≥ 100 (no truncation, test case `ce44f5ed`).
- **FR-011**: The instructional line MUST be removed from the DOM (not merely visually hidden) when `unopened_count === 0`, to keep the screen-reader output accurate.
- **FR-012**: The badge `<img>` MUST have an `onError` fallback that swaps in a placeholder badge silhouette and an `alt`/`aria-label` describing the badge name from `badge.name`.
- **FR-013**: On `visibilitychange` event with `document.visibilityState === 'visible'`, the FE MUST refetch `GET /me/secret-boxes` to resync against the BE (defends US4 AC4 + BE Edge Case "race against grant").
- **FR-014**: Closing the modal (`X` or `Escape`) MUST navigate back via `router.back()` if there is history, otherwise `router.push('/')`.
- **FR-015**: The modal MUST trap focus inside it while open (Tab cycles through interactive elements; Shift+Tab cycles backwards; focus does not escape to the page body).

### Technical Requirements

- **TR-001 (Component split)**: `app/secret-box/page.tsx` = Server Component (auth gate + initial fetch). `components/feature/secret-box/SecretBoxModal.tsx` = Client Component (state: `isOpening`, `lastBadge`, `unopenedCount`, `error`). Each `"use client"` file MUST justify the directive per constitution Principle II.
- **TR-002 (Supabase client)**: Server fetch uses `createServerClient` from `lib/supabase/server.ts`. Client mutation uses either a Server Action wrapper under `lib/api/secretBox.ts` OR a `fetch` through `lib/supabase/browser.ts` — Server Action preferred per constitution.
- **TR-003 (State management)**: local `useState` in `SecretBoxModal`. No global store. URL state not needed. `searchParams` may carry `?error=auth/account-disabled` for direct deep-link error states (mirroring the Login pattern).
- **TR-004 (Mutation pattern)**: prefer a Server Action `openBoxAction()` that internally calls the Edge Function; benefits = no client-side bearer token plumbing, automatic revalidation. If Server Action proves awkward (e.g. need to read `Retry-After` header from response), fall back to a typed wrapper in `lib/api/secretBox.ts` and call it via fetch from the Client Component.
- **TR-005 (Realtime / concurrency)**: BE uses `FOR UPDATE SKIP LOCKED` to serialise opens; the FE has no realtime channel for this screen — the BE response is the source of truth. (Future enhancement: Supabase Realtime on `secret_box` table to live-update counter from other tabs — explicit non-goal for v1.)
- **TR-006 (Performance)**: time from box click to loading indicator visible ≤ 100 ms; time from BE `200` response to badge reveal completion ≤ 300 ms (animation budget).
- **TR-007 (Security)**: the FE MUST NOT accept, read, or send any `badge_code` in the request body. The FE MUST NOT compute or display a badge until the BE responds with one. No client-side RNG. (Defends TC `2e7bec78`, BE FR-003.)
- **TR-008 (Image rendering)**: badge images render from `badge.image_path` resolved against the Supabase Storage public URL (configured via `NEXT_PUBLIC_SUPABASE_URL`). Use Next.js `<Image>` only if the storage host is whitelisted in `next.config.mjs` — otherwise use plain `<img>`.
- **TR-009 (a11y)**: as per Visual Requirements; constitution Principle IV.
- **TR-010 (Error contract)**: error rendering MUST consume the BE shape `{ error: { code, message } }` per the FE constitution + BE constitution. Localised text is keyed by `code`; `message` is the fallback.

### Key Entities *(client-side projections of BE entities)*

- **`Badge` (FE-facing)**: `{ code: string; name: string; description: string; image_path: string }`. The BE returns localised `name`/`description` according to the user's `locale`; FE renders verbatim.
- **`SecretBoxState` (component state)**: `{ unopenedCount: number; openedHistory: { badge_code: string; badge_name: string; opened_at: string }[]; lastRevealed: Badge | null; isOpening: boolean; error: { code: string; message: string } | null }`.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/functions/v1/me/secret-boxes` | GET | Initial counters + recent history; resync on `visibilitychange` | Exists — BE FR-002 |
| `/functions/v1/me/secret-boxes/open` | POST | Open exactly one box; returns `{ badge, unopened_count }` | Exists — BE FR-001 |
| `/functions/v1/me` | GET | Implicit — used by the auth gate (`supabase.auth.getUser()` triggers it via Supabase SSR cookie validation) | Exists — Login BE spec FR-004 |

Cross-reference: [../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md](../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of acceptance scenarios (US1–US5) covered by Playwright E2E tests against the local BE stack (constitution Principle III).
- **SC-002**: Time from box click to visible loading indicator ≤ 100 ms (Playwright `performance.now()` measurement).
- **SC-003**: 0 occurrences of duplicate `POST /open` calls on rapid double-click (asserted via network spy).
- **SC-004**: 0 occurrences of the FE accepting or sending `badge_code` in request bodies (fuzz test asserts the request body is empty `{}` or `''`).
- **SC-005**: 0 violations from `axe-core` Playwright run on `/secret-box` in both `unopened_count > 0` and `unopened_count === 0` states.
- **SC-006**: Focus is trapped inside the modal — Playwright Tab-loop test asserts focus never lands on `<body>` while the modal is open.
- **SC-007**: On `prefers-reduced-motion: reduce`, the reveal animation completes in ≤ 50 ms (instant cross-fade or no animation).
- **SC-008**: Counter value always matches the latest BE response — fuzz test that tampers with `window.__SECRET_BOX_STATE__` (or React DevTools) and then triggers `visibilitychange` asserts the value is overwritten by the BE.

---

## Out of Scope

- The mechanism that **grants** secret boxes (daily login, like streak, admin bonus) — BE has placeholder columns, no FE for granting.
- Badge display on the user's profile / collection page — separate feature.
- Trading or gifting boxes — not designed.
- Server-side random pick, drop-weight enforcement, `FOR UPDATE SKIP LOCKED` RPC — BE concerns (see BE spec).
- Anti-abuse beyond what the BE provides (no CAPTCHA, no client-side rate-limit beyond the in-flight lock).
- Realtime multi-tab counter sync via Supabase Realtime — explicit non-goal for v1.
- Pixel-level styling (colours, font sizes, exact spacing, drop-shadow, glow effects, sparkle artwork) — deferred to `momorph.implement-ui` which fetches CSS from Figma on demand.
- A "history list" UI of past opens — BE returns `opened` array but v1 only renders the latest reveal; rendering the full history is a P3 follow-up.

---

## Dependencies

- [x] Constitution document exists (`frontend/.momorph/constitution.md`)
- [x] BE Open Secret Box spec exists at `../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md` (API contracts, error codes, drop-weight semantics)
- [x] Login spec exists (`frontend/.momorph/specs/GzbNeVGJHz-login/spec.md`) — auth gate pattern is reused
- [ ] `lib/supabase/{browser,server}.ts` scaffolded (Phase 3 implement-ui)
- [ ] `lib/api/secretBox.ts` typed wrapper (Phase 3) OR a Server Action `openBoxAction`
- [ ] Badge artwork available in Supabase Storage at the paths returned by the BE — depends on FE/design supplying assets, BE only stores the path strings (BE Dependencies)
- [ ] Localised i18n string table `lib/i18n/secretBox.{vi,en,ja}.ts`
- [ ] `next.config.mjs` `images.remotePatterns` whitelists the Supabase Storage host (only if using Next.js `<Image>`)

---

## Notes

- **Why Server Component for the page shell**: lets us run the auth gate + initial `GET /me/secret-boxes` during SSR so the modal renders with the correct counter on first paint (no flash of "00" or skeleton).
- **Why `<button>` not `<div>` for the box illustration**: keyboard operability + screen-reader semantics, per constitution Principle IV. The visual styling can render the button to look like an illustration; semantic role MUST stay button.
- **Why no client-side RNG / probability table on the FE**: even though the drop table is visible in the BE spec, putting it on the FE invites a developer-tools user to "predict" their roll or to render a fake reveal. The FE intentionally has no knowledge of the drop weights — the BE is the only source of truth.
- **Why `visibilitychange` refetch**: the BE design notes "race against grant" — a new box may appear in another flow while this tab is in the background. Refetching on visibility regain gives users an accurate counter without us building a realtime channel.
- **Why Server Action preferred over `fetch`**: matches constitution data-fetching guidance + auto-revalidates the Server Component's initial state on the next render; smaller client bundle. Fall back is allowed if header parsing (e.g. `Retry-After`) becomes awkward.
- **MoMorph test cases consumed**: `84a5ba82` (auth gate), `1f381999` + `a0cd2f27` (title), `d9d6e01a` + `a891383a` (instructional conditional), `dd842531` + `56da7ec8` + `4bbf0b67` (box centered + badge reveal), `3a8ac6b5` + `ce44f5ed` + `96fb45e8` (counter), `632c600b` + `982ae7f9` (close), `7c3c912f` (click enabled), `2a8a63de` (click disabled at 0), `d566fbeb` (random distribution — BE concern; FE just renders what's returned), `43badf5d` (fallback on bad image), `5cc072ad` (counter tampering — FE refetches), `2e7bec78` (image URL tampering — FE binds to BE-returned path only). All mapped to ACs and FRs above.
