# Implementation Plan: Login (Frontend)

**Frame**: `GzbNeVGJHz-login`
**Frame Name**: `Login`
**Date**: 2026-05-12
**Spec**: `specs/GzbNeVGJHz-login/spec.md`
**Status**: Draft

---

## Summary

Render the public `/login` route with a "ROOT FURTHER" hero, a pre-login locale picker, and a single "LOGIN With Google" CTA that drives Supabase Auth's Google OAuth with `hd=sun-asterisk.com`. The page is a Server Component that runs the auth gate (`getUser()` → `redirect('/')`), reads the `saa_locale` cookie for SSR-correct i18n, and reads `?error=` to surface BE-mapped error banners. Two Client islands handle interactivity: the Google CTA (`inFlight` state + click handler) and the locale picker (dropdown + cookie write). A sibling `/auth/callback` Server Component exchanges the OAuth code and redirects.

---

## Technical Context

**Language/Framework**: TypeScript (strict) / Next.js 14 (App Router only).
**Primary Dependencies**: `react@18`, `next@14`, `@supabase/supabase-js`, `@supabase/ssr` (cookie-bound server client), `tailwindcss`, `clsx`.
**Database**: N/A on the FE — all persistence is in BE Supabase (Postgres + Auth schema).
**Testing**: Vitest (pure helpers under `lib/`) + Playwright (E2E against `supabase start` + `functions serve`). `axe-core/playwright` for a11y.
**State Management**: React `useState` only (constitution Principle II forbids global stores without justification). URL search params (`?error=`) for error surfacing; cookie (`saa_locale`) for locale.
**API Style**: Supabase Auth client SDK (`signInWithOAuth`, `exchangeCodeForSession`, `getUser`). No custom Edge Function is called from the Login screen itself.

---

## Constitution Compliance Check

*GATE: Must pass before implementation can begin*

- [x] **I — Frontend-only scope**: This plan adds no SQL, RLS, or Edge Function. Auth is delegated to Supabase Auth + existing BE callback handler.
- [x] **II — Server Components by default**: `app/(auth)/login/page.tsx`, `app/(auth)/login/layout.tsx`, and `app/auth/callback/route.ts` are RSC / route handlers. Only `GoogleLoginButton.tsx` and `LanguagePicker.tsx` carry `"use client"`, each with the required justification comment.
- [x] **III — TDD**: Playwright E2E covers all US1–US4 ACs against the real local BE. Vitest covers pure helpers (`localeFromCookie`, `errorCodeToMessage`).
- [x] **IV — A11y + secure coding**: focus-ring on picker + CTA; `role="alert"` banner; `aria-haspopup="listbox"` + `aria-expanded`; only `NEXT_PUBLIC_*` keys; service-role key never referenced; BE error shape `{ error: { code, message } }` consumed.
- [x] **V — Spec-driven commits**: one `feat(ui): implement login` commit; deps pinned in `package.json`.

**Violations (if any)**: none.

---

## Architecture Decisions

### Route tree

```text
app/
├── (auth)/
│   └── login/
│       ├── layout.tsx                # RSC — minimal shell (no header chrome). Optional, may fold into page.
│       └── page.tsx                  # RSC — auth gate + read `saa_locale` cookie + read ?error= + render shell
├── auth/
│   └── callback/
│       └── route.ts                  # Route Handler (GET) — exchangeCodeForSession then redirect('/') or redirect('/login?error=<code>')
```

- `app/(auth)/login/page.tsx` is async, accepts `{ searchParams: { error?: string } }`, calls `createServerClient()` → `getUser()` → `redirect('/')` when authed.
- `app/auth/callback/route.ts` is a GET handler — kept as a `route.ts` (not a `page.tsx`) because it never renders UI; it only redirects.

### Component decomposition

| File | Role | RSC/Client | Notes |
|---|---|---|---|
| `app/(auth)/login/page.tsx` | Page shell — reads cookie + searchParams; renders Header, Hero, ErrorBanner, GoogleLoginButton, Footer | RSC | Auth gate via `supabase.auth.getUser()`. |
| `components/feature/login/LoginHeader.tsx` | Header bar — Logo (left) + LanguagePicker (right) | RSC | Holds layout only; logo is non-interactive. |
| `components/feature/login/Logo.tsx` | SAA 2025 logo | RSC | Plain `<img>` or inline SVG; `aria-hidden="false"` with `alt="SAA 2025"`. |
| `components/feature/login/LanguagePicker.tsx` | Locale dropdown trigger + listbox | **Client** | Owns `open` state, `ArrowUp/Down/Enter/Escape` keyboard handler, cookie write. `"use client"` justified by (a) `useState` + (b) keyboard event handlers. |
| `components/feature/login/HeroCopy.tsx` | "ROOT FURTHER" `<h1>` + 2 description `<p>` | RSC | Takes `locale` prop; pulls strings from `lib/i18n/login`. |
| `components/feature/login/GoogleLoginButton.tsx` | Primary CTA | **Client** | Owns `inFlight` state, calls `supabase.auth.signInWithOAuth`. `"use client"` justified by (a) `useState` + (b) `onClick`. |
| `components/feature/login/ErrorBanner.tsx` | Conditional banner above CTA when `searchParams.error` present | RSC | Reads `code` prop; looks up localised message; renders `role="alert"`. |
| `components/feature/login/LoginFooter.tsx` | Fixed-bottom footer label | RSC | Non-interactive. |
| `components/ui/Button.tsx` | Headless primitive | RSC | Used by Google CTA for base styling; CTA composes it. |
| `components/ui/Dropdown.tsx` (optional) | Headless listbox primitive | Client | Only if reused beyond locale picker; otherwise inline in `LanguagePicker`. |

**Grouping rationale**: `components/ui/` holds primitives reusable across the app; `components/feature/login/` holds Login-specific composition. Splitting `GoogleLoginButton` + `LanguagePicker` into their own client files keeps the page-level RSC small and the client bundle minimal (constitution II).

### State strategy

- **`inFlight`** (Google CTA): local `useState` inside `GoogleLoginButton`. Resets on remount (covers the back-button edge case in US1 edge cases).
- **`locale`**: read from cookie `saa_locale` on the server during SSR; passed to children as a prop. After picker selection the Client Component writes the cookie via `document.cookie` then calls `router.refresh()` to re-render the RSC tree in the new locale — no full reload (per US3 AC3). No global state.
- **`error code`**: lives in the URL (`?error=`). Read in the RSC via `searchParams`. Cleared by the CTA on the next click (which navigates away to Google).
- **Locale picker open/close**: local `useState`.

### Data fetching

- **Auth gate** (`app/(auth)/login/page.tsx`): `createServerClient()` from `lib/supabase/server.ts`, then `await supabase.auth.getUser()`. If `data.user`, `redirect('/')`.
- **OAuth initiation** (`GoogleLoginButton.tsx`): `createBrowserClient()` from `lib/supabase/browser.ts`, then `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${origin}/auth/callback\`, queryParams: { hd: 'sun-asterisk.com' } } })`, then `window.location.assign(data.url)`.
- **OAuth callback** (`app/auth/callback/route.ts`): `createServerClient()` → `supabase.auth.exchangeCodeForSession(code)` → on success `redirect('/')`; on failure or BE-supplied error param `redirect('/login?error=<code>')`.
- **No custom Edge Function calls** in the Login screen itself. `/functions/v1/me` is listed in spec API table only for cross-reference (it is consumed by `/` post-login).

**Typed wrappers** are not added to `lib/api/` for Login because the only BE interaction is via Supabase's own SDK helpers. The wrapper directory will be created in subsequent screens.

### Loading / error / empty states

| Surface | Strategy |
|---|---|
| CTA in flight | Button `disabled` + inline loading indicator (spinner OR animated dots — honours `prefers-reduced-motion` with a static "..."). Caption "Redirecting…" appears under the button after a soft delay (~2 s). |
| `?error=` present | RSC mounts `<ErrorBanner code={code}>` above CTA with `role="alert"`. Localised message; unknown codes → generic fallback. Banner is removed from DOM (not just hidden) when `?error=` is absent — keeps tab order clean. |
| Empty / first-visit | Default `vi` locale; no banner; CTA enabled. |
| `auth/cookies-blocked` | Banner includes a "How to enable cookies" link (target deferred to implement-ui). |
| Auth-gate redirect | No UI rendered — Server Component `redirect('/')` short-circuits before render. |

### A11y notes

- Tab order: `LanguagePicker` → `GoogleLoginButton`. Logo, hero, footer are non-focusable.
- `LanguagePicker`: `<button aria-haspopup="listbox" aria-expanded={open}>` → opens `<ul role="listbox">` of `<li role="option" aria-selected>`. `ArrowUp/Down` move highlight; `Enter`/`Space` open + commit; `Escape` closes and returns focus to trigger.
- `GoogleLoginButton`: combined accessible name "Login with Google" (icon `aria-hidden`, text label visible).
- `ErrorBanner`: `role="alert"` so SRs announce immediately on render.
- Focus ring visible on all interactive elements (Tailwind `focus-visible:` utilities; no `outline: none` without replacement).
- Contrast: verified against the WCAG AA constants of the design tokens (implement-ui will measure with axe).
- `prefers-reduced-motion`: spinner replaced with static glyph; dropdown opens without transition.

---

## Risks / open questions

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Supabase OAuth callback URL not pre-registered in the Google Cloud Console for the local origin (`http://localhost:3000/auth/callback`) | Med | High | Documented in spec Dependencies; manual ops step. E2E will fail until done — flagged in task T002. |
| `router.refresh()` does not re-render strings if i18n strings are bundled at module scope | Low | Med | i18n tables are imported per-render in RSC; `locale` prop is the only key. |
| `prefers-reduced-motion` Playwright coverage gap | Med | Low | Add explicit Playwright project / emulation in the test plan. |
| Cookie name typo (`saa_locale` ↔ `saalocale`) breaks BE FR-003 | Low | High | Constant `LOCALE_COOKIE_NAME = 'saa_locale'` exported from `lib/i18n/locale.ts`; both layers cite it. |

**Open questions**: none blocking. Pixel values (banner colour, spinner style) deferred to `momorph.implement-ui` as designed.

---

## Next Steps

1. Run `/momorph.tasks` (already producing `tasks.md` in this batch).
2. Implement per task order; commit as `feat(ui): implement login`.
3. Run full quality gate: `pnpm typecheck && pnpm lint && pnpm build && pnpm e2e`.
