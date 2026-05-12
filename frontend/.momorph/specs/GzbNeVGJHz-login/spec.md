# Feature Specification: Login (Frontend)

**Frame ID**: `GzbNeVGJHz`
**Frame Name**: `Login`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
**Created**: 2026-05-12
**Status**: Draft
**Scope**: Client-side only — render the Login route, drive the Google OAuth redirect flow from Supabase Auth, hold pre-login locale in a cookie, redirect already-authenticated users away from `/login`, and render error banners returned by the BE. Server-side OAuth callback handling, JWT issuance, `app_user` upsert, and the `hd=sun-asterisk.com` domain check are **out of scope** — see [../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md](../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md).

---

## Overview

The Login screen is the public, unauthenticated entry point of SAA 2025 Sun* Kudos. The UI is single-purpose: present the project's hero ("ROOT FURTHER") and a single **"LOGIN With Google"** call-to-action. A pre-login language picker in the header lets a Sun-er flip the UI between `VN` / `EN` / `JA` before signing in; the choice is stored in a cookie (`saa_locale`) so the BE can read it during the first OAuth callback and persist it on the new `app_user` row. Once the user is authenticated, the FE detects the session on mount and redirects them to Homepage SAA.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Click "LOGIN With Google" and reach Homepage SAA (Priority: P1)

A Sun-er opens `/login`, clicks the Google CTA, completes the Google account chooser, and lands on Homepage SAA fully signed in. While the OAuth round-trip is in flight, the button is disabled and shows a loader so the user does not double-submit.

**Why this priority**: There is no other authentication path. Without this UI the whole app is unreachable. This is the MVP gate.

**Independent Test**: Playwright E2E against the local BE stack (`supabase start` + `functions serve`). Stub Google via the BE's mock OIDC IdP. Click the Google button; assert (a) the button enters disabled+loading state within 100 ms of click, (b) the browser is redirected to Supabase's authorize URL, (c) after the callback round-trip the URL becomes `/` (Homepage SAA), (d) `GET /functions/v1/me` returns `200`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on `/login`, **When** they click the "LOGIN With Google" button, **Then** the FE calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/callback, queryParams: { hd: 'sun-asterisk.com' } } })` and the browser navigates to the returned `data.url`.
2. **Given** the OAuth flow is in flight (click registered, navigation pending), **When** the user observes the button, **Then** the button is `disabled`, shows a loading indicator, and the visible label remains stable (no flash of empty content).
3. **Given** the Supabase OAuth callback page (`/auth/callback`) receives a code, **When** the route's Server Component runs, **Then** it exchanges the code via `supabase.auth.exchangeCodeForSession(code)` and `redirect('/')` to Homepage SAA.
4. **Given** the user is already authenticated (cookie session present), **When** they navigate to `/login`, **Then** the Server Component reads the session and immediately `redirect('/')` — the Login UI is never rendered.

---

### User Story 2 — Surface auth errors (forbidden domain / unverified email) (Priority: P1)

When the BE rejects the callback (because the Google account is not `@sun-asterisk.com`, or the email is not verified), the FE must show a human-readable error banner above the Google button and keep the user on `/login` so they can retry with a different account.

**Why this priority**: Without this, a non-Sun-er gets a blank page or an opaque crash. Sun* security audit requires the rejection to be visible.

**Independent Test**: Playwright: complete OAuth with a stubbed `@gmail.com` identity. Assert (a) URL stays on `/login?error=auth/forbidden-domain`, (b) an error banner with the BE-supplied `message` is rendered above the CTA, (c) the CTA is re-enabled (not stuck in loading state).

**Acceptance Scenarios**:

1. **Given** the `/auth/callback` Server Component receives `?error=auth/forbidden-domain&error_description=...` (or the code exchange returns a `403` with body `{ error: { code: 'auth/forbidden-domain', message: '...' } }`), **When** it handles the response, **Then** it `redirect('/login?error=auth/forbidden-domain')` and the Login page renders a banner whose text is the localised message: *"Chỉ tài khoản Google của Sun* được phép đăng nhập."* (vi) / *"Only Sun-asterisk Google accounts are allowed."* (en).
2. **Given** the callback responds with `auth/email-not-verified`, **When** the Login page mounts with `?error=auth/email-not-verified`, **Then** the banner reads *"Email của bạn chưa được xác thực."* / *"Your email is not verified."*
3. **Given** the error banner is shown, **When** the user clicks the Google button again, **Then** the banner is dismissed (cleared from the URL query) and a fresh OAuth flow starts.
4. **Given** any unknown / unexpected error code arrives at `/login?error=<unknown>`, **When** the Login page renders, **Then** it shows a generic banner *"Đăng nhập thất bại, vui lòng thử lại."* / *"Sign-in failed, please try again."* (no raw error code leaked).

---

### User Story 3 — Pre-login locale picker (Priority: P2)

A first-time visitor whose native language is not Vietnamese flips the header picker from `VN` to `EN` (or `JA`) **before** signing in. The choice (a) immediately re-renders the page in the chosen locale, (b) is stored in cookie `saa_locale`, and (c) is honoured by the BE when the new `app_user` row is created on first OAuth success.

**Why this priority**: A new joiner from a non-VN office must not lose their locale choice across the OAuth round-trip. The BE depends on the cookie name `saa_locale` — see BE spec FR-003 / US3.

**Independent Test**: Playwright: open `/login` (default VN), open the language picker, select `EN`. Assert (a) hero copy switches to English, (b) `document.cookie` includes `saa_locale=en`, (c) reload preserves `EN`, (d) after a fresh OAuth login a `GET /functions/v1/me` shows `locale: 'en'`.

**Acceptance Scenarios**:

1. **Given** the user opens `/login` with no `saa_locale` cookie, **When** the page renders, **Then** the picker displays the default `VN` (Vietnam flag + chevron) and the hero/CTA copy is in Vietnamese.
2. **Given** the picker is closed, **When** the user clicks it, **Then** a dropdown menu opens listing `VN`, `EN`, `JA`; the cursor is a pointer; the trigger is visually highlighted (focus-visible ring) — visual specifics deferred to implement-ui phase.
3. **Given** the user selects `EN`, **When** the selection is committed, **Then** the cookie `saa_locale=en; Path=/; SameSite=Lax; Max-Age=31536000` is written from the browser, all i18n strings re-render in English without a full reload, and the dropdown closes.
4. **Given** the cookie `saa_locale=ja` exists on first visit, **When** the page is server-rendered, **Then** the Server Component reads the cookie and the initial HTML is already Japanese (no flash of VN content).
5. **Given** the user signs in for the first time with `saa_locale=en` set, **When** the BE creates the `app_user` row, **Then** `app_user.locale = 'en'` (assertion is a BE concern but the FE test verifies the post-login UI is English).

---

### User Story 4 — Authenticated user is redirected away from `/login` (Priority: P3)

If a still-signed-in user types `/login` into the address bar, they must never see the Login UI — they should be sent to Homepage SAA.

**Why this priority**: Cosmetic / convenience. Doesn't block MVP but the design test cases (`45278c06`, `f62b0c97`) require it.

**Acceptance Scenarios**:

1. **Given** a valid Supabase session cookie, **When** the `/login` route's Server Component runs `supabase.auth.getUser()`, **Then** it receives a non-null user and calls `redirect('/')`.
2. **Given** no session cookie, **When** the same Server Component runs, **Then** `getUser()` returns null and the Login UI is rendered normally.
3. **Given** the session is expired but the refresh token is valid, **When** the page loads, **Then** the Supabase server client transparently refreshes (Supabase SSR helper) and the user is treated as authenticated → redirect to `/`.

---

### Edge Cases

- **Double-click the Google button**: the second click MUST be a no-op (button is `disabled` after first click + a local `inFlight` ref). No duplicate `signInWithOAuth` call.
- **Browser back during OAuth**: user clicks Google CTA, lands on Google's chooser, then hits back. The Login page is revisited; the button MUST be re-enabled (no stale `inFlight` state) because the navigation was undone.
- **Tab loses focus mid-OAuth**: nothing special — Supabase OAuth completes via the callback URL even if the original tab is backgrounded; on focus regain the Server Component re-evaluates the session.
- **Slow network on click**: if `signInWithOAuth` takes > 2 s to return a URL, a subtle "Đang chuyển hướng…" / "Redirecting…" caption appears under the button (descriptive only — actual delay-threshold may be tuned in implement-ui).
- **Cookie blocked / 3rd-party cookies disabled**: Supabase auth fails to set the session cookie. The callback redirects to `/login?error=auth/cookies-blocked` and a banner instructs the user to enable cookies for the app domain.
- **Empty error banner state**: when `?error=` query is absent, no banner is rendered (the slot is conditionally mounted, not just visually hidden — to keep keyboard tab order clean).
- **Reduced-motion**: the loading indicator MUST honour `prefers-reduced-motion` (no spinning animation; show a static "..." or label change instead).
- **Network drop during OAuth redirect**: the browser shows its own offline page; nothing for the FE to do. On reload `/login` the page is back to its initial state.
- **Two browser tabs open on `/login`**: tab A signs in successfully; tab B is still on `/login`. When tab B is focused, an effect re-runs `getUser()` (via `visibilitychange`) and redirects tab B to `/` as well.

---

## UI/UX Requirements *(from Figma)*

### Screen Components

| Component | Node ID | Description | Interactions |
|-----------|---------|-------------|--------------|
| Logo `A.1` | `I662:14391;186:2166` | SAA 2025 logo at top-left of header | Non-interactive (test case `b9805e65`). No click, no hover effect. |
| Language picker `A.2` | `I662:14391;186:1601` | Dropdown trigger showing flag + locale code + chevron; default `VN` | Click → opens dropdown listing `VN / EN / JA`; hover → highlights with pointer cursor; selecting a locale writes `saa_locale` cookie and re-renders. Keyboard: `Enter`/`Space` opens, `ArrowDown`/`ArrowUp` move highlight, `Enter` commits, `Escape` closes. |
| Key Visual frame `B.1` | `662:14395` (parent group `662:14388` `mms_C_Keyvisual`) | Decorative hero artwork | Non-interactive. |
| Hero content `B.2` | `662:14753` | Title "ROOT FURTHER" + two description lines ("Bắt đầu hành trình của bạn cùng SAA 2025." / "Đăng nhập để khám phá!") | Non-selectable per test case `42b82364`. (FE: render as `<h1>` + `<p>`; copy localised via cookie/header value.) |
| Google login button `B.3` | `662:14425` | Primary CTA "LOGIN With Google" with Google icon | Click → `signInWithOAuth(provider='google', hd='sun-asterisk.com')`. Hover → elevated/shadow effect (visual detail deferred). Disabled + loading indicator while `inFlight=true`. Keyboard: focusable, `Enter`/`Space` activates. |
| Footer `D` | `662:14447` | Fixed-bottom footer label | Non-interactive (test case `33a1dacf`). Remains pinned regardless of scroll. |
| Error banner *(new, not in Figma frame — derived from US2)* | n/a | Conditionally rendered above the CTA when `?error=<code>` is present | Auto-dismisses on next CTA click; an explicit `×` close icon is **out of scope** for v1. |

### Navigation Flow

- **From**: External landing, post-logout, any unauthenticated deep-link redirected through `/login`.
- **To**: Homepage SAA (`/`, frame `i87tDx10uM`) on successful OAuth.
- **Triggers**:
  - Click "LOGIN With Google" → Supabase OAuth redirect → `/auth/callback` → `/`.
  - Server Component on `/login` detects an existing session → `redirect('/')`.
- **Error path**: OAuth callback failure → `redirect('/login?error=<code>')`.

### Visual Requirements

- **Responsive breakpoints**: mobile (≤ 640), tablet (641–1024), desktop (≥ 1025). Logo stays top-left; language picker stays top-right; CTA stays horizontally centered below hero copy at all breakpoints (per test cases `b9805e65`, `8415b629`, `6ae76d15`).
- **Animations**: hover elevation on CTA (behavioural — value deferred), dropdown open/close (instant or subtle fade — honour `prefers-reduced-motion`), button loading indicator (spinner OR animated dots — honour `prefers-reduced-motion`).
- **Accessibility (WCAG 2.1 AA)**:
  - Google CTA has an accessible name "Login with Google" (combine icon `aria-hidden` + text label).
  - Language picker is a `<button>` with `aria-haspopup="listbox"` + `aria-expanded`; dropdown is a `<ul role="listbox">` with `role="option"` items.
  - Error banner uses `role="alert"` so screen readers announce it on appearance.
  - Tab order: Logo (skipped — non-interactive) → Language picker → Google CTA → Footer (skipped). Focus ring is visible on all interactive elements (constitution Principle IV).
  - Contrast ≥ AA on banner text, button text, picker text.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Login route MUST be a Server Component that calls `supabase.auth.getUser()` first; if a user is present, it MUST `redirect('/')` before rendering any UI.
- **FR-002**: The Google CTA MUST be a Client Component (it owns `inFlight` state + click handler). Clicking it MUST call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${origin}/auth/callback\`, queryParams: { hd: 'sun-asterisk.com' } } })` and navigate to the returned `data.url`.
- **FR-003**: While `inFlight === true` the CTA MUST be `disabled` AND show a loading indicator AND ignore further clicks. The state MUST reset on a fresh page mount.
- **FR-004**: The `/auth/callback` route MUST be a Server Component that calls `supabase.auth.exchangeCodeForSession(code)` and (on success) `redirect('/')`; on a thrown error or BE-supplied error code, it MUST `redirect('/login?error=<code>')`.
- **FR-005**: The Login page MUST read `searchParams.error`; when present, render an error banner above the CTA. The banner content is i18n-keyed off the `code` value (`auth/forbidden-domain`, `auth/email-not-verified`, `auth/cookies-blocked`, fallback generic).
- **FR-006**: The language picker MUST default to `vi` when no `saa_locale` cookie is set. Available values: `vi`, `en`, `ja`.
- **FR-007**: Selecting a locale MUST write cookie `saa_locale=<value>; Path=/; SameSite=Lax; Max-Age=31536000` from the browser, then re-render the page in the new locale without a full reload.
- **FR-008**: The language picker MUST keep the cookie name spelled exactly `saa_locale` to match the BE contract (BE FR-003 / US3 AC1).
- **FR-009**: The CTA "LOGIN With Google" MUST be horizontally centered relative to its hero container at every breakpoint (test case `6ae76d15`).
- **FR-010**: The footer MUST be position-fixed at the bottom of the viewport on the Login screen and stay visible across scroll (test case `33a1dacf`).
- **FR-011**: The logo, hero copy, and footer MUST be inert (no click handlers, no `onMouseEnter` cursor change); they MUST NOT be focusable via Tab.
- **FR-012**: If `?error=auth/cookies-blocked` is present, the banner MUST include a "How to enable cookies" link — link target is deferred to implement-ui.

### Technical Requirements

- **TR-001 (Component split)**: `app/(auth)/login/page.tsx` = Server Component (auth gate + read locale cookie + render layout). `components/feature/login/GoogleLoginButton.tsx` = Client Component (uses `useState`, click handler). `components/feature/login/LanguagePicker.tsx` = Client Component (uses `useState` for open/close + cookie write). Each `"use client"` file MUST carry a one-line comment justifying client-ness per constitution Principle II.
- **TR-002 (Supabase client)**: Server Component uses `createServerClient` from `lib/supabase/server.ts` (cookie-bound, reads the session). Client Components use `createBrowserClient` from `lib/supabase/browser.ts`. Neither file may import the service-role key — it is forbidden on the FE (constitution Principle IV).
- **TR-003 (State management)**: `inFlight` for the CTA is local `useState`; no global store. The locale value is derived from the cookie on each render — no React state needed at the page level.
- **TR-004 (URL state)**: error code is encoded as `?error=<code>` (search param), not session storage or local storage. The page reads it via `searchParams` (Server Component prop).
- **TR-005 (i18n)**: localised strings are bundled in the FE (e.g. `lib/i18n/login.{vi,en,ja}.ts`). No API call for translations.
- **TR-006 (Performance)**: the OAuth click handler MUST trigger navigation within 100 ms of the click event (measured at `performance.now()` between `click` and `signInWithOAuth` resolve OR redirect). Loading indicator MUST appear within 200 ms.
- **TR-007 (Security)**: the FE MUST NOT inspect, parse, or store the OAuth `code` directly — Supabase's `exchangeCodeForSession` handles it. No JWT is ever written to `localStorage` (Supabase SSR uses cookies).
- **TR-008 (Accessibility)**: as per Visual Requirements + constitution Principle IV — keyboard-operable, AA contrast, `role="alert"` banner, `aria-haspopup` picker.
- **TR-009 (Error contract)**: error rendering MUST consume the BE shape `{ error: { code, message } }` as published in [../../../../backend/.momorph/constitution.md](../../../../backend/.momorph/constitution.md). The FE renders its own localised `message` keyed by `code`; it MAY fall back to the BE `message` if the code is unknown.

### Key Entities *(client-side only)*

- **`Locale`**: `'vi' | 'en' | 'ja'` — derived from cookie `saa_locale` or default `'vi'`.
- **`LoginErrorCode`**: union of `'auth/forbidden-domain' | 'auth/email-not-verified' | 'auth/cookies-blocked' | 'auth/state-mismatch' | 'auth/invalid-callback' | string` (string = unknown → generic banner).

---

## API Dependencies

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| Supabase Auth `/auth/v1/authorize?provider=google` | GET (redirect) | Initiate Google OAuth | Exists (Supabase built-in; called via `supabase.auth.signInWithOAuth`) |
| Supabase Auth code exchange | (internal) | Trade `?code=` for session cookie | Exists (called via `supabase.auth.exchangeCodeForSession`) |
| `/functions/v1/me` | GET | Read current user (implicit — used by Homepage and the auth gate of US4) | Exists — see BE spec FR-004 |
| `/functions/v1/me/language` | PATCH | Persist post-login locale change | Exists — see BE spec FR-005. **Not called by the Login screen itself**; the post-login flow (header in authenticated layout) owns it. Listed for cross-reference only. |

Cross-reference: [../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md](../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of acceptance scenarios (US1–US4) covered by Playwright E2E tests against the local BE stack (constitution Principle III).
- **SC-002**: Time from "LOGIN With Google" click to button entering disabled+loading state is ≤ 100 ms (measured in Playwright via `performance.now()`).
- **SC-003**: Time from page request to first contentful paint of the Login UI is ≤ 1.5 s on a cold cache, simulated 3G — keyboard-focusable elements are ready by then.
- **SC-004**: 0 occurrences of duplicate `signInWithOAuth` calls on rapid double-click (asserted by Playwright `page.evaluate` over a network spy).
- **SC-005**: `axe-core` Playwright run reports 0 violations on `/login` (WCAG 2.1 AA).
- **SC-006**: 0 service-role-key strings appear in any FE bundle chunk emitted by `pnpm build` (greppable assertion).
- **SC-007**: Cookie `saa_locale` is set within 50 ms of locale selection (asserted via `document.cookie` after a click event).

---

## Out of Scope

- Server-side OAuth callback handling, `hd=sun-asterisk.com` enforcement, `app_user` upsert, JWT issuance — all BE (see [../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md](../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md)).
- RLS policies on `app_user` — BE.
- Refresh-token rotation logic — handled transparently by Supabase SSR helpers; FE does not implement it.
- Logout button — lives in the authenticated header, not on `/login`.
- Email/password form — not in the design.
- Multi-factor authentication UI — Google handles 2FA upstream.
- Sign-up flow — provisioning is implicit on first OAuth success.
- "Forgot password" — no password to forget.
- Localisation of error banner strings beyond `vi` / `en` / `ja` — future iteration.
- Pixel-level styling (colours, font sizes, spacing values, drop-shadow specifics) — deferred to `momorph.implement-ui` which fetches CSS from Figma on demand.

---

## Dependencies

- [x] Constitution document exists (`frontend/.momorph/constitution.md`)
- [x] Screen flow documented (see backend `SCREENFLOW.md`; FE inherits)
- [x] BE Login spec exists at `../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md` (API contracts, error codes)
- [ ] `lib/supabase/browser.ts` + `lib/supabase/server.ts` scaffolded (Phase 3 implement-ui)
- [ ] `lib/i18n/login.{vi,en,ja}.ts` string tables drafted (Phase 3)
- [ ] Supabase project provisioned with Google OAuth provider + `hd=sun-asterisk.com` (manual BE / ops step — required for E2E to pass)

---

## Notes

- **Cookie name**: `saa_locale` — must match BE FR-003 verbatim. Changing it requires a coordinated change in both layers.
- **Why a Server Component for the page shell**: lets us read the cookie and the session synchronously during SSR, avoiding the "flash of VN content" / "flash of unauthenticated UI" problems that a Client Component would have.
- **Why no `/login` redirect inside `middleware.ts`**: handling the auth gate inside the Server Component co-locates the redirect with the page that owns it, and avoids running the Supabase server client on every request to the app — only on `/login`. Middleware-based auth gates are explicitly deferred to Phase 4 if performance demands it.
- **Why we don't read the OAuth `error_description` from Google directly**: the BE normalises errors into the constitution-defined `{ error: { code, message } }` shape; the FE consumes that. Surfacing Google's raw `error_description` would leak provider details and break i18n.
- **MoMorph test cases consumed**: `45278c06` (unauthenticated access), `b9805e65` (logo position), `8415b629` (picker position), `33a1dacf` (footer fixed), `5fbe2a18` + `42b82364` (hero), `6ae76d15` (CTA centered), `20d87e28` + `4426635b` (picker open on click), `5f1cbabd` + `98e20775` (default VN + flag/chevron), `f62b0c97` (authenticated redirect), `60bc5bbb` (Google flow), `c18649fa` (hover elevation), `37eae882` (disabled+loader during auth), `cb42461d` (hover highlight), `e76aa170` (success → redirect). All mapped to ACs above.
