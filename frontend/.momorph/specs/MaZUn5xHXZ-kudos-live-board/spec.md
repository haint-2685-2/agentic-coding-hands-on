# Feature Specification: Sun* Kudos — Live Board (Frontend)

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Frontend only — Next.js 14 App Router screen at `/kudos`. UI composition, client-side state, filter/search behaviour, like/unlike interaction, notification panel wiring, and the integration glue against the existing read endpoints documented in [../../../../backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md](../../../../backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md). The kudos *write* path is owned by the Viết Kudo screen and is not in this spec; the Secret Box dialog is owned by `J3-4YFIpMM`.

---

## Overview

The Live Board is the heart of Sun* Kudos: a four-pane layout that gives every Sun-er a lens onto recognition activity in real time.

1. **Banner KV + quick-input pill** — entry-point to the Viết Kudo dialog (no submission inside this spec).
2. **Highlight carousel** — top 5 kudos within current filters; previous/next controls and dot pagination.
3. **All Kudos feed** — paginated/infinite-scroll list of all kudos, filterable by hashtag and department, with per-card like/copy-link/view-detail actions.
4. **Spotlight word-cloud (toggle pane)** — recipients sized by kudos count, with a search bar, pan/zoom controls, and a total count badge.
5. **Sidebar** — global stats, top-senders / top-receivers leaderboards, and an "Mở quà" CTA opening the Secret Box dialog.

The page requires authentication; anonymous visitors are redirected to `/login` with a `next=/kudos` return-to parameter.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the Kudos feed (Priority: P1)

A signed-in Sun-er opens `/kudos`. The page shows the highlight carousel up top, a paginated feed beneath it with the most recent kudos, and the stats sidebar to the right. Each card shows sender, receiver, message, hashtags, image gallery (≤ 5), relative time, and a heart/copy-link/view-detail action row.

**Why this priority**: The feed is the reason this page exists (TC `9dfda316`, `f92dc686`, `926d92a5`).

**Independent Test**: Playwright — seed 25 kudos; sign in; load `/kudos`; assert the feed renders 20 cards initially, ordered DESC by `created_at`; scroll to bottom; assert next page loads from `next_cursor`; assert the empty-state message `Hiện tại chưa có Kudos nào.` appears when the seed table is truncated and the page is reloaded.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the page mounts, **Then** the FE calls `GET /functions/v1/kudos?limit=20` and renders the items in `created_at` DESC order with all fields documented in BE spec US1.6.
2. **Given** the user reaches the bottom of the feed via scroll, **When** the IntersectionObserver fires, **Then** the FE calls `GET /functions/v1/kudos?limit=20&before=<next_cursor>` and appends the next page; cards already rendered MUST NOT be re-rendered.
3. **Given** the empty state (`items=[]`), **When** the feed renders, **Then** the message `Hiện tại chưa có Kudos nào.` is shown in place of the list (TC `926d92a5`).
4. **Given** the API returns `401` mid-session, **When** the response arrives, **Then** the FE redirects to `/login?next=/kudos` (TC `71b3ef43`).
5. **Given** any kudos in the feed has `is_anonymous: true`, **When** the card renders, **Then** the sender shows the masked label "Ẩn danh" with a generic avatar; the avatar is NOT clickable.

---

### User Story 2 — Highlight carousel: top 5 (Priority: P1)

The signed-in user sees a carousel of the 5 highest-ranked kudos above the feed.

**Acceptance Scenarios**:

1. **Given** at least 5 eligible kudos exist, **When** the page mounts, **Then** the FE calls `GET /functions/v1/kudos/highlights` and renders exactly 5 slides; arrows are visible (TC `86092c3a`).
2. **Given** the user clicks the Next arrow, **When** the active slide is not the last, **Then** the carousel advances by one; the Next arrow becomes disabled on the last slide (TC `81446f61`).
3. **Given** the user clicks the Prev arrow, **When** the active slide is not the first, **Then** the carousel retreats by one; the Prev arrow is disabled on the first slide.
4. **Given** filters change (hashtag or department), **When** the new selection is applied, **Then** the highlight carousel re-fetches with the same query params as the feed and re-renders.
5. **Given** fewer than 5 kudos satisfy the filter, **When** the response returns, **Then** the carousel renders whatever count came back without padding; if 0, the carousel is hidden entirely.

---

### User Story 3 — Filter feed and highlights by hashtag and department (Priority: P1)

The user picks a hashtag from the `B.1.1` dropdown and/or a department from the `B.1.2` dropdown. Both the highlight carousel and the feed narrow to the intersection.

**Why this priority**: Filtering is the primary discovery mechanic (TC `0e56cacb`, `159fed13`).

**Acceptance Scenarios**:

1. **Given** the user opens the hashtag dropdown, **When** the FE hasn't loaded it yet, **Then** it calls `GET /functions/v1/hashtags?limit=50` once per session and caches the result in memory.
2. **Given** the user selects `#dedicated`, **When** the selection commits, **Then** the FE updates the URL search param to `?hashtag=dedicated` AND refetches both `/kudos` and `/kudos/highlights` with the new param.
3. **Given** the user selects a department, **When** the selection commits, **Then** the URL updates to `?department=<uuid>` (preserving `hashtag` if set) AND both endpoints refetch.
4. **Given** the user clicks a hashtag chip on a feed card (`B.4.3` / `C.3.7`), **When** clicked, **Then** the FE updates `?hashtag=<slug>` and the feed/highlights refetch (TC `d01729d4`).
5. **Given** the user clears a filter, **When** the param is removed from the URL, **Then** the empty-state behaviour mirrors US1 step 3 if no kudos match the cleared state.
6. **Given** an active filter, **When** the user copies the URL and opens it in a new tab, **Then** the filters are reapplied from the URL (URL is the source of truth).

---

### User Story 4 — Like / unlike a kudos card (Priority: P1)

The user clicks the heart on any kudos card that they did not send. The heart turns from gray to red, the count increments, and the change persists across reload.

**Why this priority**: Core engagement loop (TC `7a7ec63e`, `91e102ba`, `63645b03`, `31936b72`).

**Acceptance Scenarios**:

1. **Given** the card's `viewer_has_liked = false` AND `viewer_is_sender = false`, **When** the user clicks the heart, **Then** the FE optimistically flips the heart to liked, increments `like_count` by `hearts_added` (default `1`), and calls `POST /functions/v1/kudos/{id}/like`.
2. **Given** `viewer_is_sender = true`, **When** the heart is rendered, **Then** the heart button is `disabled` and has `aria-disabled="true"` with tooltip "Bạn không thể like Kudos của chính mình" (TC `63645b03`); clicking does nothing.
3. **Given** the user has already liked, **When** they click again, **Then** the FE optimistically unflips the heart, decrements the count, and calls `DELETE /functions/v1/kudos/{id}/like`.
4. **Given** a like call returns `403 kudo/cannot_like_own`, **When** the response arrives, **Then** the optimistic flip is reverted and a toast displays the BE message.
5. **Given** the response carries `hearts_added: 2` (special-day), **When** the FE applies the optimistic increment, **Then** it reconciles the local count to the server-returned `like_count` on success (no double-count, TC `31936b72`).
6. **Given** the user rapid-clicks the heart, **When** more than one request would fire in <500ms, **Then** the FE debounces to a single network call reflecting the final state.

---

### User Story 5 — Copy share link (Priority: P2)

The user clicks the copy-link button (`C.4.2`) on a card. The kudo's deep-link is copied to the clipboard and a toast confirms "Link copied — ready to share!" (TC `0adfd7ce`).

**Acceptance Scenarios**:

1. **Given** the Clipboard API is available, **When** the user clicks the icon, **Then** the FE writes `${origin}/kudos/${id}` to the clipboard and shows the success toast.
2. **Given** the Clipboard API is blocked (insecure context / permission denied), **When** the click happens, **Then** a fallback text input is selected and the user is prompted with `Cmd/Ctrl-C`; a graceful error toast is shown if even the fallback fails.

---

### User Story 6 — Spotlight word-cloud with search (Priority: P2)

The user toggles the Spotlight tab and sees the recipients laid out as a word cloud with the total count "{N} KUDOS". A search bar filters the node list by name (up to 100 chars); pan/zoom toggles between modes.

**Acceptance Scenarios**:

1. **Given** the user opens Spotlight, **When** the pane mounts, **Then** the FE calls `GET /functions/v1/kudos/spotlight` and renders nodes ordered by count DESC; the total badge reads the server-returned `total_kudos`.
2. **Given** the user types `Hà` (1 char ≤ length ≤ 100), **When** input idles 300ms, **Then** the FE calls `GET /kudos/spotlight?q=Hà` and re-renders nodes.
3. **Given** the user types 101 characters, **When** the input reaches 101, **Then** the FE prevents further input (maxlength enforced) AND if the BE somehow returns `422`, the FE surfaces the message — but does not fire the call (TC `9e689933`).
4. **Given** the loading state, **When** the request is in flight, **Then** a skeleton/loading indicator is shown over the cloud (TC `d035e3b8`).
5. **Given** the empty state, **When** the response carries `items: []`, **Then** an empty-state copy "Chưa có dữ liệu" is shown (TC `d662780b` style).
6. **Given** the user clicks a node, **When** the click fires, **Then** the FE navigates to the corresponding Kudos detail page `/kudos/<id>` (TC `33ca8f8a`); hover shows a tooltip with name + received-at relative time.
7. **Given** the user toggles pan/zoom (`B.7.2`), **When** the button is clicked, **Then** the cursor/interaction mode flips between drag-to-pan and scroll-to-zoom (TC `cac4b7a3`).

---

### User Story 7 — Sidebar stats, leaderboards, and Secret Box entry (Priority: P2)

The right sidebar shows aggregate stats and two leaderboards (top senders, top receivers). A button "Mở quà" opens the Secret Box dialog (defined in `J3-4YFIpMM`).

**Acceptance Scenarios**:

1. **Given** the page mounts, **When** the sidebar hydrates, **Then** the FE calls `GET /functions/v1/kudos/stats` once and renders totals + the two leaderboards (TC `99ade8e6`).
2. **Given** the user clicks an avatar/name in the leaderboard (`6b1e2359`), **When** the click fires, **Then** the FE navigates to `/users/<id>`; hovering shows a profile preview tooltip after 300ms.
3. **Given** the user clicks "Mở quà" (`D.1.8`), **When** clicked, **Then** the Secret Box dialog opens via the route segment defined by `J3-4YFIpMM` (TC `43b54c29`).
4. **Given** the stats response is `{ total_kudos: 0, ... }`, **When** the sidebar renders, **Then** the leaderboards show the placeholder "Chưa có dữ liệu" (TC `d662780b`).

---

### User Story 8 — Quick-input pill opens Viết Kudo (Priority: P3 — UI wiring only)

Clicking the pill (`A.1`) at the top of the page opens the Viết Kudo dialog. This spec only owns the click → open transition; the dialog content lives in its own spec.

**Acceptance Scenarios**:

1. **Given** the pill is focused, **When** the user presses `Enter`/`Space` or clicks, **Then** the Viết Kudo dialog mounts and the pill remains the return-focus target on close.
2. **Given** the dialog closes on successful submission, **When** the page receives the success event, **Then** the FE refreshes both the feed and the highlight carousel (so the new kudos appears) — no full page reload.

---

### Edge Cases

- **Unauthenticated arrival on `/kudos`**: middleware redirects to `/login?next=/kudos`; on successful login the user is brought back to `/kudos` with any prior URL filters intact.
- **Slow first paint**: highlight carousel + feed are wrapped in independent Suspense boundaries so the sidebar and banner render immediately.
- **Stale data during like races**: if two tabs of the same user toggle like rapidly, the server-returned `like_count` always reconciles local state on response.
- **Very long kudo message**: clamp to 6 lines with a "Xem thêm" expander; never break the card grid layout.
- **Image gallery overflow**: render up to 5 image tiles in a 5-up strip; clicking any opens a lightbox (TC `f9b68ffa`).
- **Deactivated profile click**: receiver/sender avatar click → if `GET /users/{id}` returns `404`, render a toast "Tài khoản không khả dụng" and stay on `/kudos` (TC `2cd77a0c`, `630f42a3`).
- **No realtime channel**: MVP polls feed every 30s; if BE later exposes Supabase Realtime on `kudo`, the FE should detect channel availability and switch off polling.
- **Hashtag/department dropdowns empty**: render the dropdown trigger disabled and a tooltip "Chưa có dữ liệu".
- **Rate-limit (429)**: surface a toast "Bạn thao tác quá nhanh, thử lại sau" and back off polling intervals by ×2 for 60s.
- **Spotlight truncation header `X-Truncated: true`**: render a hint "Hiển thị 500 Sunner đầu" near the total badge.
- **Profile lookup race**: hover preview cancels its request when the cursor leaves the avatar before 300ms.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Banner KV (A) | `2940:13437` | Hero banner | Static |
| Quick-input pill (A.1) | `2940:13449` | "Hôm nay, bạn muốn gửi lời cảm ơn..." | Click → Viết Kudo dialog |
| Highlight section (B) | `2940:13451` | Wraps header + carousel | n/a |
| Highlight header (B.1) | `2940:13452` | Title + filter row | n/a |
| Hashtag filter (B.1.1) | `2940:13459` | Dropdown | Click → menu; select → URL `?hashtag=` |
| Department filter (B.1.2) | `2940:13460` | Dropdown | Click → menu; select → URL `?department=` |
| Highlight wrapper (B.2) | `2940:13461` | Carousel container | n/a |
| Highlight slide (B.2.3) | `2940:13463` | Carousel viewport | Swipe / arrow keys |
| Highlight kudo card (B.3) | `2940:13465` | Featured card | Like / Copy / Detail / Profile clicks |
| Next arrow (B.2.2) | `2940:13468` | Carousel next | Click; disabled on last slide |
| Prev arrow (B.2.1) | `2940:13470` | Carousel prev | Click; disabled on first slide |
| Slide pagination (B.5) | `2940:13471` | Dots + page number | Click to jump |
| Sender avatar (B.3.1) | `I2940:13465;335:9443;256:4734` | Avatar | Click → `/users/<sender.id>` |
| Sender info (B.3.2) | `I2940:13465;335:9443;256:4737` | Name + dept | Click → profile |
| Receiver avatar (B.3.5) | `I2940:13465;335:9446;256:4734` | Avatar | Click → `/users/<receiver.id>` |
| Receiver info (B.3.6) | `I2940:13465;335:9446;256:4737` | Name + dept | Click → profile |
| Card body (B.4) | `I2940:13465;335:9448` | Content wrapper | n/a |
| Time (B.4.1) | `I2940:13465;335:9449` | Relative time | n/a |
| Message (B.4.2) | `I2940:13465;335:9450` | Text body | "Xem thêm" expander if clamped |
| Hashtag chip (B.4.3) | `I2940:13465;335:9458` | Tag list | Click → URL `?hashtag=<slug>` |
| Card actions row (B.4.4) | `I2940:13465;335:9461` | Heart + Copy + Detail | per-action handlers |
| Awards header (B.6) | `2940:13476` | Section header for feed | n/a |
| Spotlight section (B.7) | `2940:13474` (wrapper `2940:14174`) | Word-cloud pane | Toggle from feed/spotlight |
| Spotlight total (B.7.1) | `3007:17482` | "{N} KUDOS" | Aria-live polite |
| Pan/Zoom toggle (B.7.2) | `3007:17479` | Mode switch | Click toggles mode |
| Spotlight search (B.7.3) | `2940:14833` | Search input | Debounced `?q=` |
| All Kudos section (C) | `2940:13475` | Feed wrapper | n/a |
| Section header (C.1) | `2940:14221` | "All Kudos" title | n/a |
| Feed list (C.2) | `2940:13482` | Card list | Infinite scroll sentinel |
| Kudo card (C.3) | `3127:21871` | Standard kudo card | per-card interactions |
| Sender info (C.3.1) | `I3127:21871;256:4858` | Sender block | Click → profile |
| Sent arrow (C.3.2) | `I3127:21871;256:5161` | Decoration | n/a |
| Receiver info (C.3.3) | `I3127:21871;256:4860` | Receiver block | Click → profile |
| Time (C.3.4) | `I3127:21871;256:5229` | Relative time | n/a |
| Content (C.3.5) | `I3127:21871;256:5155` | Message body | "Xem thêm" expander |
| Image gallery (C.3.6) | `I3127:21871;256:5176` | Up to 5 images | Click → lightbox |
| Hashtag chip (C.3.7) | `I3127:21871;256:5158` | Tag list | Click → URL `?hashtag=<slug>` |
| Actions row (C.4) | `I3127:21871;256:5194` | Heart + Copy + Detail | per-action handlers |
| Heart button (C.4.1) | `I3127:21871;256:5175` | Like toggle | Disabled if `viewer_is_sender` |
| Copy link (C.4.2) | `I3127:21871;256:5216` | Clipboard copy | Toast on success |
| Sidebar (D) | `2940:13488` | Right rail | n/a |
| Stats overall (D.1) | `2940:13489` | Totals block | n/a |
| Kudos received stat (D.1.2) | `2940:13491` | Number | n/a |
| Kudos sent stat (D.1.3) | `2940:13492` | Number | n/a |
| Hearts stat (D.1.4) | `3241:14882` | Number | n/a |
| Separator (D.1.5) | `2940:13494` | Visual divider | n/a |
| Boxes opened (D.1.6) | `2940:13495` | Number | n/a |
| Boxes pending (D.1.7) | `2940:13496` | Number | n/a |
| "Mở quà" button (D.1.8) | `2940:13497` | CTA | Click → Secret Box dialog |
| Top 10 receivers list (D.3) | `2940:13510` | Leaderboard | per-row click → profile |
| Title (D.3.1) | `2940:13513` | Leaderboard heading | n/a |
| Leaderboard rows (D.3.2..D.3.6) | `2940:13516..2940:13520` | Top user rows | Click avatar/name → profile |
| Hashtag chip row (D.4) | `I3127:21871;2234:33038` | Tag pill | Click filters feed |

### Navigation Flow

- **Entry**: route `/kudos`, reachable from header nav, `ABOUT KUDOS` CTA on Homepage, the Kudos promo block, and direct URL.
- **Exits**:
  - Profile click on any avatar/name → `/users/<id>`.
  - View Detail / message body click / Spotlight node click → `/kudos/<id>`.
  - Hashtag chip click → stays on `/kudos?hashtag=<slug>`.
  - "Mở quà" → Secret Box dialog at the same route (modal route segment).
  - Auth failure mid-session → `/login?next=/kudos`.

### Visual Requirements

- **Responsive breakpoints**: `< 768px` (sidebar collapses below the feed; carousel scrolls 1 slide; Spotlight occupies full width when toggled), `768–1280px` (sidebar narrows; feed 1 col), `≥ 1280px` (feed + sidebar split, carousel up to 3 slides visible).
- **Animations**: heart bounce on like; carousel slide transition; spotlight zoom pan; toast fade-in/out; lightbox crossfade on image change.
- **Accessibility (WCAG 2.1 AA)**:
  - The quick-input pill is a real `<button>` (not a fake input) with `aria-haspopup="dialog"`.
  - Carousel arrows have `aria-label="Slide trước"` / `"Slide kế"` and reflect `aria-disabled` at the ends.
  - Heart button uses `aria-pressed` for liked-state and toggles `aria-label` between "Thả tim" / "Bỏ tim"; disabled state for own kudos uses `aria-disabled="true"` and is announced.
  - Spotlight: provide a parallel `<ul>` of recipients with counts for screen readers (visually hidden) so the canvas/SVG cloud doesn't strand non-visual users.
  - Image lightbox: focus trap, `Esc` to close, `←/→` to navigate.
  - Hashtag/department dropdowns: typeahead + arrow-key navigation; `Esc` closes.
  - Toasts use `role="status"` (success) / `role="alert"` (error).
  - All hit areas ≥ 40×40 CSS px; focus ring visible on every control.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The route `/kudos` MUST require authentication; unauthenticated visits MUST redirect to `/login?next=/kudos`.
- **FR-002**: The feed MUST initially fetch via `GET /kudos?limit=20` and use cursor pagination (`?before=<cursor>`) for subsequent pages.
- **FR-003**: Infinite scroll MUST be implemented with `IntersectionObserver`; the trigger element is appended at the end of the rendered list.
- **FR-004**: Active filters MUST be stored in URL search params (`?hashtag=`, `?department=`); the URL is the single source of truth for filter state.
- **FR-005**: Both `GET /kudos` and `GET /kudos/highlights` MUST receive the same filter params on every fetch.
- **FR-006**: The hashtag dropdown source MUST be `GET /hashtags?limit=50`; cached per session, refreshed on full page reload only.
- **FR-007**: The department dropdown source MUST be `GET /departments`; cached per session.
- **FR-008**: Clicking a hashtag chip inside any card MUST set `?hashtag=<slug>` and refetch the feed and highlights — no inline filter logic on the client.
- **FR-009**: The heart button MUST be disabled when `viewer_is_sender = true` and MUST toggle via `POST` / `DELETE /kudos/{id}/like` with optimistic UI.
- **FR-010**: Like clicks MUST be debounced to 500ms to coalesce rapid taps; the net state is the latest user action.
- **FR-011**: The copy-link button MUST write `${origin}/kudos/${id}` to the clipboard and surface the toast `Link copied — ready to share!`.
- **FR-012**: The view-detail action (any card content click outside of an interactive sub-element) MUST navigate to `/kudos/<id>`.
- **FR-013**: The Spotlight pane MUST debounce search input by 300ms before calling `GET /kudos/spotlight?q=` and MUST cap input length to 100 characters via `maxlength`.
- **FR-014**: The Spotlight pane MUST render `total_kudos` in the badge and announce changes via `aria-live="polite"`.
- **FR-015**: The sidebar MUST fetch `GET /kudos/stats` once on mount; values are not polled but MUST be re-fetched after the Viết Kudo dialog reports a successful create.
- **FR-016**: The "Mở quà" button MUST open the Secret Box dialog (mounted as an intercepted modal route per `J3-4YFIpMM`); the underlying `/kudos` page MUST remain visible behind it.
- **FR-017**: Anonymous kudos cards MUST mask the sender to "Ẩn danh" with a non-clickable generic avatar; the receiver MUST still be clickable.
- **FR-018**: When a profile lookup returns `404`, the FE MUST show a toast and remain on `/kudos`.
- **FR-019**: A 401 from any endpoint MUST trigger a redirect to `/login?next=/kudos`.
- **FR-020**: A 429 from any endpoint MUST trigger a toast and exponential backoff on the affected poll loop (×2 up to 5 minutes).

### Technical Requirements

- **TR-001 (Route segment layout)**: `app/kudos/page.tsx` is a **Server Component** that performs the initial `GET /kudos` and `GET /kudos/highlights` fetches via the cookie-bound `lib/supabase/server.ts` client and passes the first page as props to client components. The carousel, feed, sidebar, spotlight, like-button, dropdowns, and quick-input pill are **Client Components** (`"use client"` with the trigger comment per constitution Principle II).
- **TR-002 (Data fetching strategy)**:
  - Initial feed + highlight + hashtag/department lists + stats are fetched server-side for a fast first paint.
  - Subsequent feed pages, filter changes, spotlight, and like mutations are fetched from the client through typed wrappers in `lib/api/kudos.ts`.
  - **No Supabase Realtime for MVP** — the FE polls `GET /kudos` every 30s when the tab is visible AND no filter dialog is open; polling pauses while the user is scrolling actively (debounced 1s).
- **TR-003 (URL search-param state)**: Filters live in the URL via `useSearchParams` + `router.replace({ scroll: false })`; navigation never replaces the history stack while typing in dropdown search.
- **TR-004 (Optimistic updates)**: A small store (React `useReducer` per page, not a global Redux) maps `kudo_id → { liked, count }` and applies optimistic flips; reconciliation comes from the server response.
- **TR-005 (Suspense)**: The Highlight carousel and the Feed each have their own `<Suspense>` boundary so a slow `/highlights` doesn't block the feed.
- **TR-006 (Error boundaries)**: `app/kudos/error.tsx` catches render errors; per-card errors (e.g. image 404) are isolated to the card.
- **TR-007 (Bundle)**: Spotlight is dynamically imported with `next/dynamic({ ssr: false })` because its canvas/SVG renderer is heavy and only loads when the user toggles the pane.
- **TR-008 (Accessibility helpers)**: Reuse the focus-trap utility introduced for the Homepage notification panel; carousel keyboard handling implements `ArrowLeft`/`ArrowRight` to step slides when the carousel has focus.
- **TR-009 (Polling lifecycle)**: Single `useEffect` keyed on `document.visibilityState`, filter state, and a "user is scrolling" flag; only one interval is alive at a time.
- **TR-010 (Mutation safety)**: Like calls go through `lib/api/kudos.ts#toggleLike(id, current)`; the wrapper handles `POST`/`DELETE` selection based on the current state; the server response is the authoritative reconcile.
- **TR-011 (Secret Box modal)**: The "Mở quà" button uses an App Router intercepted route `@modal/secret-box` so the underlying URL changes from `/kudos` to `/kudos/secret-box` without re-mounting the page.

### Key Entities *(client-side projections only — authoritative shapes live in the BE spec)*

- **`Kudo`** — `{ id, created_at, message, hashtags: string[], images: { id, url, position }[], sender, receiver, like_count, viewer_has_liked, viewer_is_sender, is_anonymous? }`.
- **`UserMini`** — `{ id, full_name, avatar_url, department_id, department_name }` (sender/receiver shape on `Kudo`).
- **`Hashtag`** — `{ slug, name, usage_count }`.
- **`Department`** — `{ id, name, kudo_count }`.
- **`SpotlightNode`** — `{ user_id, full_name, avatar_url, department_name, count }`.
- **`KudosStats`** — `{ total_kudos, total_senders, total_receivers, total_hearts, top_senders: User5[], top_receivers: User5[] }`.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/functions/v1/kudos?limit=20&before=&hashtag=&department=` | GET | Paginated feed | Exists (BE spec FR-001) |
| `/functions/v1/kudos/highlights?hashtag=&department=` | GET | Top-5 carousel | Exists (BE spec FR-002) |
| `/functions/v1/kudos/spotlight?q=` | GET | Spotlight word-cloud | Exists (BE spec FR-003) |
| `/functions/v1/kudos/stats` | GET | Sidebar stats + leaderboards | Exists (BE spec FR-004) |
| `/functions/v1/hashtags?limit=50` | GET | Hashtag dropdown source | Exists (BE spec FR-005) |
| `/functions/v1/departments` | GET | Department dropdown source | Exists (BE spec FR-006) |
| `/functions/v1/kudos/{id}/like` | POST | Like (idempotent) | Exists (BE spec FR-007) |
| `/functions/v1/kudos/{id}/like` | DELETE | Unlike (idempotent) | Exists (BE spec FR-008) |
| `/functions/v1/users/{id}` | GET | Profile lookup (avatar click) | Exists (BE spec FR-009) |
| `/functions/v1/me` | GET | Auth gate (for layout) | Exists (Login spec) |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% of acceptance scenarios above have at least one Playwright E2E test (constitution Principle III).
- **SC-002**: Time-to-interactive on `/kudos` ≤ 3s on `Fast 3G` profile against a warmed local BE; first card visible ≤ 2s.
- **SC-003**: Heart-toggle round-trip ≤ 300ms end-to-end on a healthy local network (visible flip is instant due to optimistic update).
- **SC-004**: Spotlight first paint ≤ 1.5s after toggle; search update ≤ 600ms after 300ms debounce.
- **SC-005**: Lighthouse Accessibility score on `/kudos` ≥ 92; manual keyboard pass: full feed traversal possible with Tab + Arrow keys; every interactive surface has visible focus.
- **SC-006**: Filter URL share works end-to-end — copying the URL with `?hashtag=` and `?department=` into a fresh session reproduces the same filtered view.
- **SC-007**: No duplicate likes after rapid clicks (verified by an automated test firing 10 toggles in 1s).

---

## Out of Scope

- The kudos **write** path (`Viết Kudo` screen `ihQ26W78P2`) — only the entry-point click is wired here.
- The Secret Box dialog body — owned by `J3-4YFIpMM`.
- The Kudos **detail** page `/kudos/<id>` — separate feature.
- Profile detail page `/users/<id>` — separate feature; this spec only consumes the minimal `/users/{id}` lookup.
- Realtime push of new kudos — MVP polls; Realtime is a follow-up.
- Pan/zoom advanced gestures (pinch) on touch devices — basic toggle only.
- Server-side caching of `/hashtags` and `/departments` — that's a BE TR-004 concern.
- Moderation / report-content UI — separate Admin spec.

---

## Dependencies

- [x] Constitution document exists (`frontend/.momorph/constitution.md`).
- [x] BE spec exists and is referenced (`backend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/spec.md`).
- [x] Login BE spec defines auth gating (`backend/.momorph/specs/GzbNeVGJHz-login/spec.md`).
- [x] Homepage FE spec defines the cross-screen header + notification bell (`frontend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md`).
- [ ] `lib/supabase/server.ts` + `lib/supabase/browser.ts` clients (Phase 3).
- [ ] `lib/api/kudos.ts` typed wrappers for the 10 endpoints above (Phase 3).
- [ ] Shared focus-trap + toast primitives in `components/ui/` (Phase 3).
- [ ] Secret Box intercepted modal route (`J3-4YFIpMM` FE spec) — must be available before `/kudos/secret-box` works end-to-end.

---

## Notes

- **Why URL search params for filters**: shareable links, browser back/forward behaviour, server-side first paint can use the same params. Avoids a separate global filter store.
- **Why polling not Realtime for MVP**: BE spec defers Realtime to a follow-up; FE should not assume the channel exists. The 30s cadence matches the BE highlight MV refresh window.
- **Why dynamic-import Spotlight**: rendering a canvas/SVG word cloud carries a non-trivial library cost (e.g. `d3-cloud` or similar); only paying that cost on toggle keeps the initial route fast.
- **Why a separate optimistic store per page rather than global**: the like-state is only relevant inside `/kudos` and `/kudos/<id>`; a page-scoped reducer keeps the surface small and dies on unmount.
- **Anonymous handling**: rendering logic checks `is_anonymous` and short-circuits sender info — the BE has already masked the payload, the FE just trusts and renders the mask consistently.
- **Department filter target**: BE filters by `receiver.department_id` (BE spec Notes). The FE label simply says "Phòng ban" to match the design; if BE later adds `sender_department`, this UI may expose a second selector — out of scope today.
