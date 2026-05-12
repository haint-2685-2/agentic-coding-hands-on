# Feature Specification: Homepage SAA (Frontend)

**Frame ID**: `i87tDx10uM`
**Frame Name**: `Homepage SAA`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Frontend only — Next.js 14 App Router screen that renders Homepage SAA. UI composition, client-side state, navigation, accessibility, and the integration glue against the existing Edge Functions documented in [../../../../backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md](../../../../backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md). Server logic, schemas, RLS, and migrations are out of scope and not duplicated here.

---

## Overview

Homepage SAA is the public landing page that doubles as the authenticated user's dashboard entry. The FE composes six surfaces over a single route (`/`):

1. **Header** — logo, primary nav (About / Awards / Sun* Kudos), language switch, notification bell, and account avatar menu.
2. **Hero/Key Visual + Countdown** — "ROOT FURTHER" hero text and a real-time `Days/Hours/Minutes` countdown driven by `GET /config/event`.
3. **Event info block** — date/time, venue, broadcast note.
4. **CTA pair** — `ABOUT AWARDS` and `ABOUT KUDOS` buttons.
5. **Awards section** — 6-card responsive grid sourced from `GET /awards`, each card deep-linking to `/awards#<slug>`.
6. **Sun* Kudos promo block** — narrative card linking to `/kudos`.
7. **Footer** — secondary nav + copyright.
8. **Floating widget** — bottom-right quick-action button.

The page is reachable by both anonymous and authenticated visitors. Anonymous users see everything except the notification badge and the avatar dropdown; authenticated users additionally see those two surfaces and (if `role=admin`) the "Admin Dashboard" entry inside the dropdown.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitor sees the live countdown to the event (Priority: P1)

A first-time visitor opens `/` and immediately reads the hero + sees three two-digit tiles (Days, Hours, Minutes) ticking down to the SAA event start. The "Coming soon" label is visible until the moment the event starts; after that the tiles freeze at `00 00 00` and the label is hidden.

**Why this priority**: The countdown is the page's defining visual; if it doesn't load, the landing experience is broken (TC ID-12 / ID-39 / ID-41–43).

**Independent Test**: Playwright E2E — `supabase db reset` with `event_config.event_start_at` set to a future timestamp; load `/` anonymously; assert three tiles render with leading zeros; assert "Coming soon" is visible; replace the row with a past timestamp; reload; assert tiles read `00 00 00` and the label is hidden.

**Acceptance Scenarios**:

1. **Given** the page is loaded and `GET /functions/v1/config/event` returns `{ event_start_at, is_started: false }`, **When** the countdown component mounts, **Then** it renders three tiles whose values reflect `event_start_at - now()` and updates at least once per minute on the client.
2. **Given** any tile value is single-digit, **When** the countdown renders, **Then** the value is left-padded to two digits (e.g. `05`).
3. **Given** the response carries `is_started: true`, **When** the page renders, **Then** the "Coming soon" label is removed from the DOM and tiles read `00 00 00`.
4. **Given** the endpoint returns `event_start_at: null` or the request fails, **When** the page renders, **Then** the tiles display `--` placeholders and the page still renders the rest of the content (no crash, no Suspense boundary stuck).
5. **Given** the browser tab is hidden for >1 minute, **When** the tab regains focus, **Then** the next tick recomputes from the wall clock rather than drifting from `setInterval`.

---

### User Story 2 — Visitor browses the 6 award cards (Priority: P1)

A visitor scrolls to the awards section and sees a responsive grid of 6 award cards. Clicking the image, the title, or the `Chi tiết` link of any card opens `/awards#<slug>` and the browser scrolls to the matching section.

**Why this priority**: Awards browsing is the primary content discovery path from the homepage (TC ID-15..ID-16, ID-47..ID-52).

**Independent Test**: Playwright — seed the 6 awards via BE migration; load `/`; assert exactly 6 cards rendered in `display_order`; click each card's title and assert the URL changes to `/awards#<expected-slug>`.

**Acceptance Scenarios**:

1. **Given** `GET /functions/v1/awards?locale=<current>` returns 6 active awards, **When** the section renders on a desktop viewport, **Then** the cards are laid out in a 3-column grid in `display_order` ASC.
2. **Given** the same data on a tablet or mobile viewport (≤ 1024px), **When** the section renders, **Then** the cards are laid out in a 2-column grid.
3. **Given** any card, **When** the user clicks the thumbnail, the title, OR the `Chi tiết` link, **Then** the browser navigates to `/awards#<slug>` (same `<slug>` as returned by the API).
4. **Given** the user navigates from the homepage to an award via the deep-link, **When** the awards page loads, **Then** the section with `id="<slug>"` is scrolled into view (FE relies on the browser's native hash-scroll plus a one-time `scrollIntoView({behavior:'smooth'})` if the target was rendered after hydration).
5. **Given** the API call fails, **When** the section renders, **Then** an inline error/skeleton state is shown and the rest of the page continues to render.

---

### User Story 3 — Authenticated user sees the unread notification badge and opens the panel (Priority: P1)

A signed-in Sun-er with one or more unread notifications sees a red dot/number on the bell icon. Clicking the bell opens a panel listing the most recent notifications; clicking a notification follows its `link`; clicking "Mark all read" clears the badge.

**Why this priority**: Notifications are the only feedback channel for kudos/awards events (TC ID-11, ID-27..ID-29).

**Independent Test**: Playwright — sign in as a user with 3 unread notifications (seeded via BE); load `/`; assert the bell shows a badge; click it; assert the panel shows the 3 items in `created_at` DESC order; click "Mark all read"; assert the badge disappears.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the homepage hydrates, **Then** the bell component fetches `GET /functions/v1/me/notifications/unread-count` and renders a badge if `unread_count > 0`.
2. **Given** the bell shows a badge, **When** the user clicks the bell, **Then** the panel opens, calls `GET /functions/v1/me/notifications?limit=20`, and renders items with `title`, `body`, relative time, and a read/unread visual marker.
3. **Given** the panel is open, **When** the user clicks an unread item, **Then** the FE calls `PATCH /functions/v1/me/notifications/{id}` with `{ read: true }`, decrements the badge optimistically, and follows `item.link` if present.
4. **Given** the panel is open, **When** the user clicks "Mark all read", **Then** the FE calls `POST /functions/v1/me/notifications/mark-all-read`, the badge clears, and the list visually updates to "all read".
5. **Given** the user is anonymous, **When** the homepage renders, **Then** the bell is not rendered at all (no badge, no panel, no unauthenticated fetch).
6. **Given** the badge poll returns a 401, **When** the response arrives, **Then** the FE treats the session as expired, removes the bell, and signals the auth layer to refresh — no infinite retry.

---

### User Story 4 — Account menu shows Admin Dashboard for admins only (Priority: P2)

An admin clicks the avatar; the dropdown shows `Profile`, `Admin Dashboard`, `Sign out`. A regular user only sees `Profile` and `Sign out`.

**Why this priority**: Role-driven UI hint; security still enforced server-side (TC ID-5..ID-6 / ID-37..ID-38).

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the FE receives `{ role: "admin" }` from `GET /functions/v1/me`, **Then** the dropdown renders the `Admin Dashboard` item linking to `/admin`.
2. **Given** `role: "user"`, **When** the dropdown opens, **Then** the `Admin Dashboard` item is absent from the DOM (not just hidden via CSS).
3. **Given** the dropdown is open, **When** the user clicks `Sign out`, **Then** the FE calls Supabase Auth `signOut()`, clears any in-memory profile state, and reloads `/`.

---

### User Story 5 — Pre-login and post-login language switch (Priority: P2)

A visitor uses the `VN | EN` switch in the header. Pre-login the choice is stored in the `saa_locale` cookie and reloads the page with the chosen locale. Post-login the choice additionally calls `PATCH /me/language` so the preference persists across devices.

**Acceptance Scenarios**:

1. **Given** an anonymous visitor on `/`, **When** they pick `EN`, **Then** the FE writes cookie `saa_locale=en`, refreshes the route, and Server Components re-render in English.
2. **Given** an authenticated visitor, **When** they pick `EN`, **Then** the FE writes the cookie AND fires `PATCH /functions/v1/me/language` with `{ locale: "en" }`; on a 200 response no UI change is needed, on a 422/500 a toast surfaces the error message.
3. **Given** only `vi` and `en` are exposed in the dropdown, **When** the menu is opened, **Then** no `ja` option is rendered (TC ID-58).

---

### User Story 6 — Floating widget quick actions (Priority: P3)

A floating pill at the bottom-right opens a small action menu (out of scope for full content of those actions; FE wires the open/close behavior only).

**Acceptance Scenarios**:

1. **Given** the widget is closed, **When** the user clicks it, **Then** a popover opens with the actions documented in the linked frame (`_hphd32jN2 / Sv7DFwBw1h`).
2. **Given** the popover is open, **When** the user clicks outside it or presses `Esc`, **Then** the popover closes and focus returns to the trigger.

---

### Edge Cases

- **Slow network on first paint**: All non-essential dynamic surfaces (countdown, awards, notifications) MUST be wrapped in a Suspense boundary with a skeleton fallback so the hero and static copy paint immediately.
- **Notification poll while panel is open**: Badge refresh polling MUST pause while the panel is open and resume on close to avoid flicker; an open panel is the source of truth.
- **Hash navigation with not-yet-rendered awards page**: If the user lands on `/awards#<slug>` before the section hydrates, the FE re-runs `scrollIntoView` once on hydration to honour the hash.
- **Empty awards list** (e.g. all `is_active=false`): The awards grid renders an empty state copy "Sắp công bố" rather than collapsing.
- **Disabled account (`/me` returns 403)**: FE surfaces a "Tài khoản bị tạm khoá" banner and signs the user out.
- **Missing `event_start_at`**: Tiles render as `-- -- --`; the "Coming soon" label stays visible (treat missing data as "not yet started").
- **Browser without `Intl.RelativeTimeFormat`**: Fall back to absolute timestamps in the notification panel.
- **Tab inactivity for hours**: When the tab returns to focus and the user is authenticated, refresh the unread badge once before resuming the 60-second poll cadence.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Header (A1) | `2167:9091` | Logo + nav + controls strip | Sticky on scroll; keyboard-tabbable left-to-right |
| Logo (A1.1) | `I2167:9091;178:1033` | Sun* SAA wordmark | Click → `/`, scroll to top |
| Nav `About SAA 2025` (A1.2) | `I2167:9091;186:1579` | Selected nav item on homepage | Click → scroll to top; hover → highlight |
| Nav `Awards Information` (A1.3) | `I2167:9091;186:1587` | Hover-state nav item | Click → `/awards` |
| Nav `Sun* Kudos` (A1.5) | `I2167:9091;186:1593` | Normal-state nav item | Click → `/kudos` |
| Notification bell (A1.6) | `I2167:9091;186:2101` | Bell + unread dot | Authed only; click → panel |
| Language switch (A1.7) | `I2167:9091;186:1696` | `VN \| EN` dropdown | Click → menu; select → reload + (if authed) PATCH |
| Avatar menu (A1.8) | `I2167:9091;186:1597` | Account dropdown trigger | Click → `Profile / Admin Dashboard? / Sign out` |
| Key Visual (3.5) | `2167:9027` | Hero text + countdown wrapper | Static composition |
| Countdown (B1) | `2167:9035` | Wrapper for label + 3 tiles | Auto-updates per minute |
| `Coming soon` label (B1.2) | `2167:9036` | Subtitle text | Hidden when `is_started=true` |
| Tiles wrapper (B1.3) | `2167:9037` | Holds Days/Hours/Minutes | n/a |
| Days tile (B1.3.1) | `2167:9038` | 2-digit value + `DAYS` label | n/a |
| Hours tile (B1.3.2) | `2167:9043` | 2-digit value + `HOURS` label | n/a |
| Minutes tile (B1.3.3) | `2167:9048` | 2-digit value + `MINUTES` label | n/a |
| Event info (B2) | `2167:9053` | Time / venue / broadcast | Static |
| CTA pair (B3) | `2167:9062` | Wrapper for the two buttons | n/a |
| `ABOUT AWARDS` button (B3.1) | `2167:9063` | Primary CTA | Click → `/awards` |
| `ABOUT KUDOS` button (B3.2) | `2167:9064` | Secondary CTA | Click → `/kudos` |
| Hero copy (B4) | `5001:14827` | "Root Further" paragraph | Static |
| Awards header (C1) | `2167:9069` | Section title | Static |
| Awards grid (C2) | `5005:14974` | Wrapper for 6 cards | Responsive 3/2/2 column |
| Top Talent card (C2.1) | `2167:9075` | Card instance | Click → `/awards#top-talent` |
| Top Project card (C2.2) | `2167:9076` | Card instance | Click → `/awards#top-project` |
| Top Project Leader card (C2.3) | `2167:9077` | Card instance | Click → `/awards#top-project-leader` |
| Best Manager card (C2.4) | `2167:9079` | Card instance | Click → `/awards#best-manager` |
| Signature 2025 card (C2.5) | `2167:9080` | Card instance | Click → `/awards#signature-2025-creator` |
| MVP card (C2.6) | `2167:9081` | Card instance | Click → `/awards#mvp` |
| Card image (C2.1.1) | `I2167:9075;214:1019` | Award thumbnail | Click → same hash route |
| Card title (C2.1.2) | `I2167:9075;214:1021` | Award name | Click → same hash route |
| Card description (C2.1.3) | `I2167:9075;214:1022` | 1–2 line truncated copy | n/a |
| Card `Chi tiết` link (C2.1.4) | `I2167:9075;214:1023` | Detail link | Click → same hash route |
| Sun* Kudos promo (D1) | `3390:10349` | Kudos narrative card | n/a |
| Kudos promo content (D2) | `I3390:10349;313:8419` | Copy block | n/a |
| Kudos promo CTA (D2.1) | `I3390:10349;313:8426` | `Chi tiết` button | Click → `/kudos` |
| Floating widget (6) | `5022:15169` | Quick-action FAB | Click → popover |
| Footer (7) | `5001:14800` | Footer wrapper | n/a |
| Footer logo (7.1) | `I5001:14800;342:1408` | Footer brand mark | Click → `/`, scroll to top |
| Footer nav `About` (7.2) | `I5001:14800;342:1410` | Mirror of A1.2 | Click → `/` |
| Footer nav `Awards` (7.3) | `I5001:14800;342:1411` | Mirror of A1.3 | Click → `/awards` |
| Footer nav `Kudos` (7.4) | `I5001:14800;342:1412` | Mirror of A1.5 | Click → `/kudos` |
| Footer nav `Tiêu chuẩn` (7.5) | `I5001:14800;1161:9487` | Standards link | Click → `/standards` |

### Navigation Flow

- **Entry**: route `/` (App Router `app/page.tsx`); reachable from any external link, the footer logo of any page, or after sign-out.
- **Exits**:
  - Header/footer logos and `About SAA 2025` → `/` (scroll to top).
  - `Awards Information` nav, `ABOUT AWARDS` CTA, any award card → `/awards` (with optional `#<slug>`).
  - `Sun* Kudos` nav, `ABOUT KUDOS` CTA, Kudos promo `Chi tiết` → `/kudos`.
  - Avatar `Profile` → `/profile`; `Admin Dashboard` → `/admin`; `Sign out` → Supabase `signOut()` → `/`.
  - Notification panel item click → `item.link` (deep-link inside the app).

### Visual Requirements

- **Responsive breakpoints**: mobile `< 768px` (single-column content, 2-col awards grid), tablet `768–1024px` (2-col awards grid), desktop `≥ 1024px` (3-col awards grid).
- **Animations**: countdown ticks once per minute; card hover lift; smooth-scroll on hash navigation; notification panel fade/slide.
- **Accessibility (WCAG 2.1 AA)**:
  - Tab order = visual order (logo → nav → bell → lang → avatar → main content → footer).
  - The bell button has `aria-label="Thông báo"` and `aria-haspopup="dialog"`; the badge has `aria-live="polite"`.
  - The avatar trigger has `aria-haspopup="menu"`, `aria-expanded`, and `Esc` closes the menu, returning focus to the trigger.
  - All cards expose a single semantic link wrapping image+title+`Chi tiết` (one tab stop per card); a secondary visible `Chi tiết` link uses `aria-hidden="true"` if it would duplicate the announcement.
  - Countdown tiles are wrapped in a single `<time datetime="<ISO>">` element with a visually-hidden text summary ("Còn 12 ngày 04 giờ 17 phút").
  - Focus ring visible on every interactive element; minimum hit area ≥ 40×40 CSS px.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST see the Homepage at `/` whether or not they are authenticated; the page MUST NOT redirect anonymous users to `/login`.
- **FR-002**: The countdown component MUST recompute remaining time from the absolute UTC timestamp returned by `GET /config/event` and the local wall clock at least once every 60 seconds while the tab is visible.
- **FR-003**: The countdown MUST left-pad each tile to two digits and MUST freeze at `00 00 00` (and hide the `Coming soon` label) when the API response says `is_started: true` OR the locally computed delta is `≤ 0`.
- **FR-004**: The awards grid MUST render exactly the items returned by `GET /awards?locale=<current>`, in the order returned, with no client-side reordering or filtering.
- **FR-005**: Every clickable area of an award card (image / title / description / Chi tiết link) MUST resolve to the same href `/awards#<slug>`; pressing `Enter` on the card MUST navigate as well.
- **FR-006**: The notification bell MUST be hidden for anonymous users (no skeleton, no fetch) and visible for authenticated users.
- **FR-007**: The unread badge MUST poll `GET /me/notifications/unread-count` every 60 seconds while the tab is visible AND the panel is closed; polling MUST stop when the tab is hidden and resume on focus with a single immediate refresh.
- **FR-008**: Opening the notification panel MUST call `GET /me/notifications?limit=20` once per open; subsequent paging MUST use the returned `next_cursor` via `?before=<cursor>`.
- **FR-009**: Clicking an unread notification MUST optimistically mark it read in the local store; on a network error the optimistic change MUST be reverted and a toast displayed.
- **FR-010**: The account menu MUST conditionally render `Admin Dashboard` based on `role` from `GET /me`; the link MUST be absent from the DOM for non-admins.
- **FR-011**: The language switch MUST persist the choice via cookie `saa_locale=<vi|en>` for all users and, when authenticated, additionally call `PATCH /me/language`.
- **FR-012**: All header/footer navigation links MUST be rendered as `<a>` elements (or `next/link`) so they remain functional with JavaScript disabled.
- **FR-013**: The floating widget MUST be keyboard-operable (`Enter`/`Space` to open, `Esc` to close) and MUST trap focus while open.
- **FR-014**: The page MUST render a localized version per the `saa_locale` cookie; if the cookie is unset, default to `vi`.

### Technical Requirements

- **TR-001 (Route segment layout)**: `app/page.tsx` is a **Server Component**. The Header (auth-aware), Notification bell, Avatar menu, Countdown, Language switch, and Floating widget are **Client Components** (`"use client"` with the trigger comment per constitution Principle II).
- **TR-002 (Data fetching)**:
  - `GET /config/event` and `GET /awards` are fetched in the Server Component using `lib/supabase/server.ts` (cookie-bound) and passed as props to the client Countdown / Awards Grid — no client-side `useEffect` for initial data.
  - Notification badge + panel are fetched from the Client Component using `lib/supabase/browser.ts` (the data is per-user and changes frequently).
  - Awards and event config are revalidated with `revalidate: 60` (matches BE `Cache-Control: public, max-age=60`).
- **TR-003 (URL state)**: The hash on award navigation (`/awards#<slug>`) is the canonical state holder; no search-param state on Homepage itself.
- **TR-004 (Suspense)**: The Awards grid and Countdown are wrapped in `<Suspense fallback={<Skeleton/>}>`; the hero copy, CTAs, and footer render synchronously.
- **TR-005 (Error boundaries)**: An `app/error.tsx` boundary catches render errors; individual fetches use a typed wrapper in `lib/api/` so HTTP errors surface as typed unions rather than thrown.
- **TR-006 (Polling lifecycle)**: Notification polling uses a single `useEffect` keyed on `document.visibilityState` + panel open state to avoid duplicate intervals across remounts.
- **TR-007 (Optimistic updates)**: Mark-as-read uses an optimistic local update keyed by notification `id`; failures roll back via the same store.
- **TR-008 (Bundle)**: No CSS-in-JS; Tailwind only. The bell/avatar/lang components are dynamically split (`next/dynamic`) so anonymous visitors do not download the auth menu chunk.
- **TR-009 (Accessibility)**: Focus management around the notification panel + avatar menu uses a small `useFocusTrap` helper in `lib/`; `Esc` closes both.
- **TR-010 (i18n)**: Static copy lives in `lib/i18n/<locale>/homepage.ts`; selection driven by the `saa_locale` cookie read in the Server Component via `cookies()`.

### Key Entities *(client-side projections only — authoritative shapes live in the BE spec)*

- **`EventConfig`** — `{ event_start_at: string | null, event_location: string, event_time_label: string, broadcast_note: string | null, is_started: boolean }`.
- **`Award`** — `{ id: string, slug: string, title: string, short_description: string, hero_image_path: string, display_order: number }`.
- **`Notification`** — `{ id: string, type: string, title: string, body: string, link: string | null, metadata: Record<string, unknown>, read_at: string | null, created_at: string }`.
- **`Me`** — `{ id: string, email: string, full_name: string, avatar_url: string | null, locale: 'vi' | 'en' | 'ja', role: 'user' | 'admin', is_active: boolean }`.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/functions/v1/config/event` | GET | Countdown source | Exists (BE spec FR-001) |
| `/functions/v1/awards?locale=<vi\|en>` | GET | Awards grid | Exists (BE spec FR-002) |
| `/functions/v1/me` | GET | Header avatar + role gate | Exists (Login spec) |
| `/functions/v1/me/notifications/unread-count` | GET | Badge | Exists (BE spec FR-003) |
| `/functions/v1/me/notifications?limit=20&before=<iso>` | GET | Panel list | Exists (BE spec FR-004) |
| `/functions/v1/me/notifications/{id}` | PATCH | Mark one read | Exists (BE spec FR-005) |
| `/functions/v1/me/notifications/mark-all-read` | POST | Mark all read | Exists (BE spec FR-006) |
| `/functions/v1/me/language` | PATCH | Persist locale post-login | Exists (Login spec FR-005) |
| Supabase Auth `signOut()` | n/a | Logout from avatar menu | Exists (Login spec) |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% of homepage-touching acceptance scenarios above have at least one Playwright E2E test (constitution Principle III).
- **SC-002**: Largest Contentful Paint on `/` ≤ 2.5s on a simulated `Fast 3G` profile against a warmed local BE.
- **SC-003**: Anonymous-visitor JS bundle for `/` ≤ 200 KB gzip (no auth menu, no notifications chunks).
- **SC-004**: Lighthouse Accessibility score on `/` ≥ 95; manual keyboard pass: every interactive surface reachable, focus visible, `Esc` closes every open menu/panel.
- **SC-005**: Notification badge polling generates ≤ 1 request / 60s per visible authenticated tab.
- **SC-006**: A locale switch round-trip (VN ↔ EN) completes in ≤ 1s and renders without flicker on a warm cache.

---

## Out of Scope

- Server-side behaviour of `/config/event`, `/awards`, `/me/*` endpoints — defined in the BE spec.
- Production of notification rows (the kudos / awards features create them) — see Viết Kudo and Awards features.
- `/awards`, `/kudos`, `/profile`, `/admin`, `/standards` page implementations — separate FE specs.
- The Floating widget's inner action items (`_hphd32jN2 / Sv7DFwBw1h`) — out of this feature.
- Realtime push of new notifications — MVP polls; Supabase Realtime is a follow-up.
- Server-side i18n catalog beyond `vi` and `en` (BE supports `ja`; FE deliberately does not expose it).

---

## Dependencies

- [x] Constitution document exists (`frontend/.momorph/constitution.md`).
- [x] BE spec exists and is referenced (`backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md`).
- [x] Login BE spec defines `/me` (`backend/.momorph/specs/GzbNeVGJHz-login/spec.md`).
- [ ] `lib/supabase/server.ts` and `lib/supabase/browser.ts` clients implemented (Phase 3).
- [ ] `lib/api/` typed wrappers for the 8 endpoints listed above (Phase 3).
- [ ] `lib/i18n/vi/homepage.ts` and `lib/i18n/en/homepage.ts` copy decks (Phase 3).

---

## Notes

- **Why fetch awards + event in the Server Component**: both endpoints are public, cache-friendly (`max-age=60` on the BE), and required for the initial paint. Server-side fetching keeps the anonymous bundle smaller and avoids a Suspense flash for the most common path.
- **Why split notification + avatar + lang as dynamic client chunks**: anonymous visitors (a meaningful share of the homepage's traffic) should not pay the JS cost for surfaces they never see.
- **Cookie name `saa_locale`**: matches the BE Login spec contract (Notes section of `GzbNeVGJHz-login`).
- **Locale exposure mismatch with BE**: BE accepts `vi|en|ja`; FE only exposes `vi|en` in the dropdown. The `ja` value is preserved on read but cannot be selected from this UI — recorded here so future i18n work doesn't re-litigate the gap.
- **Slug list for the 6 awards**: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp` (matches BE seed and Awards spec).
