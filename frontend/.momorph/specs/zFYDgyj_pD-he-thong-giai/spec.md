# Feature Specification: Hệ thống giải (Frontend)

**Frame ID**: `zFYDgyj_pD`
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Frontend only — authenticated awards-catalog page, left-rail scroll-spy navigation, six award detail cards rendered from the auth-gated `GET /awards?detail=true` endpoint, the bottom "Sun* Kudos" CTA banner, and supporting a11y/responsiveness. BE schema, locale projection, and `GET /awards/{slug}` shape live in [../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md](../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md).

---

## Overview

The Hệ thống giải page is a **read-only, single-route page** at `/he-thong-giai`. It is **authenticated-only** — unauthenticated visitors are redirected to `/login`. The page presents the six SAA 2025 award categories (Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP) as long-form info blocks anchored by a sticky left-rail menu (scroll-spy). At the bottom a `Sun* Kudos` CTA banner links to the Kudos feature. The page is server-rendered from a single batch call to `GET /functions/v1/awards?detail=true&locale=<vi|en|ja>` so first paint includes content; the left-rail interactions and scroll-spy run client-side.

Money figures, long descriptions, quantities, and unit types are only available via the **detail** variant (auth-required) — the public `GET /awards` returns summary fields only. This page therefore must not be reachable via SSR without an authenticated session cookie.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticated browse of all six awards (Priority: P1)

A signed-in Sun-er navigates to `/he-thong-giai`. The page renders the title, the left-rail menu with 6 items, and 6 detail blocks (image, title, long description, quantity, unit type, prize value).

**Why this priority**: This is the entire purpose of the screen — read the awards.

**Independent Test**: Playwright: sign in, visit `/he-thong-giai`, assert (a) the page returns 200, (b) all 6 award headings exist in DOM order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP (TC ID-5, ID-6), (c) each block shows quantity + unit + prize value from the canonical seed (TC ID-6 canonical numbers).

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to `/he-thong-giai` (TC ID-0), **Then** the page is server-rendered with the page title block, the left-rail menu, the 6 detail cards, and the Sun* Kudos CTA banner all visible without further fetches.
2. **Given** the rendered page (TC ID-3), **When** inspected, **Then** the overall layout is: title block at the top, left-rail menu sticky on the left (desktop), 6 detail cards stacked in the centre, Sun* Kudos banner pinned to the bottom region.
3. **Given** the title block (TC ID-4), **When** rendered, **Then** the supertitle reads "Sun* annual awards 2025" and the main heading reads "Hệ thống giải thưởng SAA 2025".
4. **Given** the user's `app_user.locale` is `vi` (default), **When** the page loads, **Then** the FE calls `GET /functions/v1/awards?detail=true&locale=vi` and each card's `title`, `short_description`, `long_description` are rendered in Vietnamese.
5. **Given** the same call returns canonical numbers, **When** the cards render (TC ID-6), **Then**: Top Talent = 10 Đơn vị, 7.000.000 VNĐ; Top Project = 02 Tập thể, 15.000.000 VNĐ; Top Project Leader = 03 Cá nhân, 7.000.000 VNĐ; Best Manager = 01 Cá nhân, 10.000.000 VNĐ; Signature 2025 = 01 Cá nhân hoặc Tập thể, 5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể); MVP = 01 Cá nhân, 15.000.000 VNĐ.

### User Story 2 — Unauthenticated visitor is redirected (Priority: P1)

An unauthenticated user attempts to reach `/he-thong-giai`. The FE detects the missing session and redirects to `/login`.

**Why this priority**: Prize money is sensitive; the BE auth-gate (BE FR-001) only protects the data — the FE must also avoid rendering a half-broken page before the user is bounced.

**Independent Test**: Playwright with no cookies: visit `/he-thong-giai`, assert HTTP 302 (or client redirect) → `/login`, with a return-to parameter `?next=/he-thong-giai` (TC ID-1).

**Acceptance Scenarios**:

1. **Given** no Supabase session cookie, **When** the request hits the Server Component, **Then** it issues a `redirect('/login?next=/he-thong-giai')` before any data fetch.
2. **Given** the user signs in via the login flow with `?next=/he-thong-giai` (Login spec US1), **When** OAuth completes, **Then** the FE post-login handler navigates to `/he-thong-giai`.
3. **Given** an expired access token at SSR time, **When** the Server Component attempts `GET /awards?detail=true`, **Then** a `401` response also triggers `redirect('/login?next=/he-thong-giai')` (no broken page).

### User Story 3 — Left-rail scroll-spy navigation (Priority: P1)

The user clicks a menu item; the page smoothly scrolls to the matching section. As the user scrolls manually, the active menu item updates.

**Independent Test**: Playwright: click each of the 6 menu items in turn (TC ID-9), assert `window.scrollY` lands at the corresponding `<section id=...>` offset and the clicked item gets the `aria-current="true"` attribute (TC ID-11).

**Acceptance Scenarios**:

1. **Given** the page rendered with menu items (TC ID-5), **When** the user clicks "Top Project", **Then** the viewport scrolls smoothly (`scroll-behavior: smooth` honoured unless the user has `prefers-reduced-motion: reduce`) to the `<section id="top-project">` and the URL hash updates to `#top-project`.
2. **Given** the user scrolls manually through the cards, **When** a card crosses an intersection threshold (50% visible by default; tunable), **Then** the matching menu item's `aria-current="true"` is set and the previously active one's is removed (TC ID-9, ID-11).
3. **Given** the user hovers a menu item (TC ID-10), **When** the pointer is over the item, **Then** a visible hover state is shown via CSS only.
4. **Given** the user uses keyboard `Tab` into the left rail, **When** focus lands on an item, **Then** a visible focus ring is shown (a11y AA); `Enter` activates the link.
5. **Given** an invalid hash like `/he-thong-giai#nonexistent` (TC ID-13), **When** the page mounts, **Then** no JS error is thrown; the page falls back to no active item and stays at the top.

### User Story 4 — Locale switch updates content (Priority: P2)

The user changes the language in the header dropdown (defined in Login spec); the page re-fetches and re-renders in the new locale, preserving scroll position.

**Acceptance Scenarios**:

1. **Given** the user is on `/he-thong-giai` with locale `vi`, **When** they switch to `en` from the header, **Then** the FE either (a) re-renders via a soft route refresh (`router.refresh()` after `PATCH /me/language`) re-running the Server Component with `locale=en`, or (b) invalidates an SWR cache keyed on `locale`. Either implementation MUST end with all six cards' `title` / `short_description` / `long_description` displayed in EN.
2. **Given** an EN string is missing on a particular award, **When** the BE falls back to VI (BE US1 AC2), **Then** the FE renders the VI string transparently — no client-side fallback logic is needed.
3. **Given** the language switch happened mid-scroll, **When** the re-render completes, **Then** `window.scrollY` is preserved (page does not scroll back to top).

### User Story 5 — Sun* Kudos CTA banner navigates away (Priority: P2)

The user scrolls to the bottom and clicks "Chi tiết" on the Sun* Kudos banner; they are taken to the Sun* Kudos route.

**Independent Test**: Playwright: scroll to the banner (TC ID-8), click "Chi tiết" (TC ID-12), assert `location.pathname === "/kudos"` (or the canonical Kudos route).

**Acceptance Scenarios**:

1. **Given** the user reaches the bottom of the page (TC ID-8), **When** the Sun* Kudos block renders, **Then** it shows the "Phong trào ghi nhận" label, "Sun* Kudos" title, a short description, and the "Chi tiết" button.
2. **Given** the user clicks "Chi tiết" (TC ID-12), **When** the navigation runs, **Then** the FE pushes `/kudos` (Live Board screen) in the same tab.
3. **Given** the destination is unreachable (network failure during navigation; TC ID-14), **When** the failure surfaces, **Then** a Next.js error boundary or a toast `"Không thể mở trang Sun* Kudos, vui lòng thử lại."` is shown; the user remains on the awards page.

### User Story 6 — Picture-Award images load (Priority: P3)

Each award card includes a picture (`D.*.1` in Figma). Images are served via signed URLs from the BE.

**Acceptance Scenarios**:

1. **Given** the BE returns `hero_image_path` for each award, **When** the page renders, **Then** the FE resolves a Storage signed URL (or uses a public bucket if the BE so chose) and renders an `<img alt="<award.title>">` (TC ID-7).
2. **Given** an image fails to load, **When** the `onError` fires, **Then** a placeholder tile with the award title is shown; no console error is thrown.
3. **Given** the user has slow network, **When** the image is below the fold, **Then** `loading="lazy"` defers it.

### Edge Cases

- **Empty award list**: should never happen (6 seed rows are part of BE migration) but if `data.items.length === 0`, render an empty state "Hệ thống giải thưởng đang được cập nhật".
- **Missing localization for a card**: BE returns VI fallback (BE US1 AC2). FE does no further fallback.
- **Long descriptions with `\n` line breaks**: render with `white-space: pre-wrap` so newlines display as paragraph breaks. Length cap is BE-enforced (4000 chars).
- **Currency formatting**: BE returns integers (e.g. `7000000`). FE uses `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })` for locale `vi`; for `en`/`ja` we keep `'vi-VN'` formatting and append the VND suffix — money is paid in VND regardless of UI language.
- **Signature 2025 dual value**: when `value_vnd_team !== null`, render BOTH values labelled (e.g. "5.000.000 VNĐ — Cá nhân / 8.000.000 VNĐ — Tập thể"). When `null`, render only the single value.
- **Scroll-spy with reduced motion**: if `prefers-reduced-motion: reduce`, scroll jumps instantly to the section instead of smooth-scrolling.
- **`IntersectionObserver` unavailable** (very old browsers): scroll-spy gracefully degrades — clicks still navigate via hash links; the active-item indicator simply doesn't update on manual scroll. No JS error.
- **Network failure on the initial `GET /awards?detail=true`**: the Server Component throws — handled by `app/he-thong-giai/error.tsx` rendering a "Đã có lỗi, vui lòng tải lại trang" message with a "Tải lại" button.
- **Right-rail / off-canvas on mobile**: the left-rail menu becomes a horizontal pill bar at the top on `<md` breakpoints (or hidden behind a "Mục lục" toggle).
- **Banner missing CTA route**: defensive — if the `/kudos` route is not yet built, the "Chi tiết" link is rendered as a disabled button with `aria-disabled="true"` rather than a broken link.
- **User scrolls during locale switch**: scroll position is preserved (US4 AC3).

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Keyvisual `3` | `313:8437` | Hero banner with campaign artwork | None — decorative; `alt="Keyvisual Sun* Annual Award 2025"` |
| Title block `A` | `313:8453` | Supertitle + main heading | None (static) |
| Section container `B` | `313:8458` | Wraps the menu + cards grid | Container only |
| Left-rail menu `C` | `313:8459` | Sticky scroll-spy nav | Container — `role="navigation"` + `aria-label="Danh mục giải thưởng"` |
| Menu item "Top Talent" `C.1` | `313:8460` | Anchor link `#top-talent` | Click → smooth-scroll to `D.1` and set `aria-current="true"` (TC ID-9) |
| Menu item "Top Project" `C.2` | `313:8461` | Anchor link `#top-project` | Same pattern |
| Menu item "Top Project Leader" `C.3` | `313:8462` | Anchor `#top-project-leader` | Same pattern |
| Menu item "Best Manager" `C.4` | `313:8463` | Anchor `#best-manager` | Same pattern |
| Menu item "Signature 2025 - Creator" `C.5` | `313:8464` | Anchor `#signature-2025-creator` | Same pattern |
| Menu item "MVP" `C.6` | `313:8465` | Anchor `#mvp` | Same pattern |
| Card "Top Talent" `D.1` | `313:8467` | Award info block | None (read-only); `<section id="top-talent">` |
| Top Talent image `D.1.1` | `I313:8467;214:2525` | Award picture | None — decorative `<img>` |
| Top Talent content `D.1.2` | `I313:8467;214:2526` | Title + long description + quantity + value | None (read-only) |
| Card "Top Project" `D.2` | `313:8468` | Award info block | None; `<section id="top-project">` |
| Card "Top Project Leader" `D.3` | `313:8469` | Award info block | None; `<section id="top-project-leader">` |
| Card "Best Manager" `D.4` | `313:8470` | Award info block | None; `<section id="best-manager">` |
| Card "Signature 2025 - Creator" `D.5` | `313:8471` | Award info block (dual value) | None; `<section id="signature-2025-creator">` |
| Card "MVP" `D.6` | `313:8510` | Award info block | None; `<section id="mvp">` |
| Sun* Kudos banner `D1` | `335:12023` | CTA banner at page bottom | Container |
| Sun* Kudos content `D2` | `I335:12023;313:8419` | Title + description block | None (read-only) |
| "Chi tiết" button `D2.1` | `I335:12023;313:8426` | Text-link button | Click → `router.push('/kudos')` (TC ID-12, ID-14) |

### Navigation Flow

- **From**: Header main menu "Hệ thống giải" link (TC ID-2), or homepage award-card click-through (`i87tDx10uM`), or direct URL `/he-thong-giai` (TC ID-0).
- **To**: `/kudos` (Live Board) via the bottom CTA (TC ID-12). Otherwise the page is a terminal read-only destination.
- **Triggers**: header click, homepage card click, direct URL, hash navigation `/he-thong-giai#<slug>` deep-link, locale switch from header.

### Responsive & Accessibility

- **Breakpoints**:
  - `≥1024 px`: two-column layout — sticky left-rail menu (`position: sticky; top: <header-offset>`) on the left, cards stack on the right.
  - `768–1023 px`: left rail becomes a horizontal pill bar at the top of the section, sticky beneath the page header.
  - `<768 px`: pill bar is horizontally scrollable; cards stack full-width.
- **Animations / transitions**:
  - Smooth-scroll on menu click (`behavior: 'smooth'`), respecting `prefers-reduced-motion`.
  - Hover state on menu items (CSS only).
  - No card-level entrance animations (read-heavy content).
- **A11y AA**:
  - Menu items are `<a href="#slug">` anchors inside a `<nav aria-label="Danh mục giải thưởng">`. Active state is conveyed via `aria-current="true"` (not just visual underline).
  - Each card is a `<section aria-labelledby="<slug>-title">` with its title as an `<h2 id="<slug>-title">`. Long descriptions use semantic paragraphs.
  - Image alt text is the award title (e.g. `alt="Top Talent"`); decorative-only graphics use `alt=""`.
  - Tab order: skip-link → header → left-rail menu → 6 cards (in document order) → Sun* Kudos CTA → footer.
  - Focus rings visible on all interactive elements.
  - Contrast ratios for body text and money figures meet ≥ 4.5:1 (constitution Principle IV).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST gate access to `/he-thong-giai` behind a valid Supabase session at the Server Component layer. Unauthenticated → `redirect('/login?next=/he-thong-giai')` before any data fetch.
- **FR-002**: System MUST fetch all six awards in one round-trip via `GET /functions/v1/awards?detail=true&locale=<user.locale>` from the Server Component (cookie-bound). It MUST NOT call `GET /awards/{slug}` six times.
- **FR-003**: System MUST render the title block, left-rail menu, six award cards (Top Talent → MVP in `display_order`), and the Sun* Kudos CTA banner.
- **FR-004**: System MUST render each card with: hero image (`hero_image_path` → signed URL or public path), `title`, `long_description` (preserving line breaks), `quantity`, `unit_type`, and `value_vnd` formatted as VND. When `value_vnd_team !== null`, render both values labelled.
- **FR-005**: System MUST implement scroll-spy: clicking a left-rail item smooth-scrolls to the matching section and updates `aria-current`; manual scrolling updates `aria-current` based on the most-visible section (`IntersectionObserver` with `rootMargin` accounting for sticky header).
- **FR-006**: System MUST sync the URL hash to the active section (`history.replaceState`, not `push`, to avoid polluting back-button history).
- **FR-007**: System MUST render the Sun* Kudos CTA "Chi tiết" as a `<Link href="/kudos">` (Next.js Link).
- **FR-008**: System MUST handle the BE error shape on the initial fetch; any `5xx` triggers the route's `error.tsx` boundary with a "Tải lại" retry button. A `401` (token expired between cookie present and request) triggers re-auth via `redirect('/login?next=...')`.
- **FR-009**: System MUST respect `prefers-reduced-motion: reduce` and disable smooth scroll behaviour when set.
- **FR-010**: System MUST preserve scroll position across a locale change.

### Technical Requirements

- **TR-001 (Component split)**: The page route `app/he-thong-giai/page.tsx` is a **Server Component** that performs auth check + initial fetch and passes data to a small `"use client"` `AwardsCatalog` component that owns scroll-spy state and the `IntersectionObserver`. The cards themselves are Server Components (pure markup).
- **TR-002 (Data fetching)**: Use the server-side Supabase client from `lib/supabase/server.ts` (cookie-bound) so the access token is attached automatically. No `useEffect`-based fetch.
- **TR-003 (Caching)**: The route uses `dynamic = 'force-dynamic'` (or omits caching) because data is auth-gated and locale-dependent. The BE sets `Cache-Control: private, max-age=300`; the FE may opt to call with `next: { revalidate: 300 }` if it switches to fetch caching, but per-user cache safety MUST be preserved.
- **TR-004 (No state library)**: scroll-spy state is local React `useState` + `useRef`. No global store.
- **TR-005 (i18n)**: locale parameter is sourced from `app_user.locale` returned by `GET /me` (cookie-resolved on the server). UI chrome strings (page title, banner labels) live in a typed i18n catalog under `lib/i18n/` keyed by the same `vi|en|ja` enum.
- **TR-006 (a11y testing)**: Run `@axe-core/playwright` against the rendered page in CI — zero serious/critical issues.
- **TR-007 (Security)**: Only `NEXT_PUBLIC_*` env vars are read. The server fetch attaches the access token via the cookie-bound client; no token leaks to the bundle.
- **TR-008 (Testing)**: each Acceptance Scenario maps to a Playwright test in `tests/e2e/he-thong-giai.spec.ts`. Pure helpers (currency formatter, slug→hash mapper) are Vitest-tested in `tests/unit/`.

### Key Entities *(client-side only)*

- **`AwardDetail`** — shape returned by `GET /awards?detail=true`: `{ id: string, slug: string, title: string, short_description: string, long_description: string, hero_image_path: string, display_order: number, quantity: number, unit_type: 'Đơn vị' | 'Tập thể' | 'Cá nhân' | 'Cá nhân hoặc Tập thể', value_vnd: number, value_vnd_team: number | null }`.
- **`ActiveSection`** — local UI state: `slug: string | null` tracking the most-visible card.

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/functions/v1/me` | GET | Resolve `app_user.locale` for the request | Exists (Login spec) |
| `/functions/v1/awards?detail=true&locale=` | GET | Batch fetch all 6 awards with detail fields | Exists (BE FR-002) |
| Storage signed URL for `hero_image_path` | GET | Hero images per card | Exists (Supabase Storage) |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 6 Acceptance Scenario groups above have at least one Playwright test (constitution Principle III).
- **SC-002**: Initial page paint (FCP) ≤ 1.5 s p75 over a warm local stack; cards render with content (no skeleton flash) because the data is server-fetched.
- **SC-003**: Lighthouse a11y score ≥ 95 on the page; `@axe-core/playwright` reports zero serious/critical issues (TR-006).
- **SC-004**: Keyboard-only navigation can reach all 6 menu items and the "Chi tiết" CTA with a visible focus indicator at every stop.
- **SC-005**: Locale switch round-trip (header dropdown → page re-render in new locale) ≤ 800 ms p95 on a warm BE.
- **SC-006**: All six award figures match canonical values from BE seed (TC ID-6) — asserted by a Playwright snapshot test of the rendered VND strings.

---

## Out of Scope

- **Server-side concerns**: schema migration for `long_description_*`, `quantity`, `unit_type`, `value_vnd`, `value_vnd_team`; locale fallback; auth gating at the endpoint; `Cache-Control` headers; seed canonical values. Defined by [../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md](../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md).
- **Award detail single-page** (`/awards/[slug]`) — out; this page is the only awards detail surface for now. The BE's `GET /awards/{slug}` is available but unused by this screen.
- **Admin tooling to edit awards** — out; awards are seed data.
- **Awards results / nominees / winners** — separate future feature.
- **Hero image cropping or art-direction** — `<img>` renders the BE-supplied asset as-is.
- **Per-award sharing / deep-link previews / OG tags** — not in TCs.
- **Print stylesheet** — not requested.
- **Sun* Kudos banner with dynamic data** (e.g. "X kudos sent this week") — banner is static per BE spec.

---

## Dependencies

- [x] FE constitution (`frontend/.momorph/constitution.md`).
- [x] BE Hệ thống giải spec ([../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md](../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md)).
- [x] Login spec ([../GzbNeVGJHz-login/spec.md](../GzbNeVGJHz-login/spec.md)) — auth gate + locale source.
- [x] Homepage SAA BE spec ([../../../../backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md](../../../../backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md)) — base `award` entity.
- [ ] `lib/supabase/server.ts` cookie-bound client.
- [ ] `lib/i18n/` UI chrome catalog (page title, banner labels).
- [ ] `lib/format/currency.ts` VND formatter (this spec).
- [ ] Awards seed migration applied (BE TR-003 + seed UPDATE).
- [ ] Header language dropdown shipped (Login spec US3) — required for US4.

---

## Notes

- **Why one batch endpoint and not six**: per BE FR-002, `GET /awards?detail=true` returns all six in a single response. Calling `/awards/{slug}` six times would 6× the auth overhead and break the all-or-nothing render guarantee.
- **Why Server Component as the root**: SEO matters less (auth-gated), but FCP-with-content is materially better than a client-side fetch with a skeleton. Constitution Principle II (Server Components by default) also pushes this direction.
- **Why anchors not router.push**: anchor links (`<a href="#slug">`) are progressive-enhancement-friendly — they work without JS, and the `IntersectionObserver`-driven active state is layered on top. Using `router.push` for hash changes would re-run the Server Component unnecessarily.
- **Currency formatting decision**: keep VND formatting with `vi-VN` locale even when the UI language is EN or JA. The award value is in VND; switching numeric formatting to en-US would produce `₫7,000,000` which is non-canonical. Locale only switches **content language**, not currency formatting.
- **No `react-markdown` for long descriptions**: BE stores plain text only (BE FR-005). Rendering with `white-space: pre-wrap` preserves line breaks without introducing an XSS surface.
- **Sun* Kudos CTA link target**: assumed `/kudos` (Live Board) per the existing screen layout in `app/`. If routing differs, this is a single-line change.
