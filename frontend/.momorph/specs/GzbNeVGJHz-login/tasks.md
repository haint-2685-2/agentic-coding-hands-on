# Tasks: Login (Frontend)

**Frame**: `GzbNeVGJHz-login`
**Prerequisites**: `spec.md` (required), `plan.md` (required), BE spec at `../../../../backend/.momorph/specs/GzbNeVGJHz-login/spec.md`.

---

## Task Format

`- [ ] T### [P?] [USx?] Description | path/to/file.ts`

- **[P]** — independent file, can run in parallel with siblings in the same phase.
- **[USx]** — user story tag from spec (US1..US4).
- File path is relative to `frontend/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm Next.js 14 project bootstrap (Tailwind, TS strict, ESLint, Prettier, `pnpm`) is green per `frontend/CLAUDE.md` | (verify) `package.json`, `tsconfig.json`, `tailwind.config.ts`
- [ ] T002 [P] Document local OAuth pre-req (Supabase Google provider + redirect URL `http://localhost:3000/auth/callback`) in spec Dependencies / dev README | `frontend/README.md` (append section)
- [ ] T003 [P] Add `axe-core/playwright` + Playwright project for `prefers-reduced-motion` emulation | `playwright.config.ts`, `package.json`
- [ ] T004 Load Login frame assets (logo, Google icon, flag glyphs VN/EN/JA) from MoMorph media into `public/login/` per plan.md asset list | `public/login/*`

---

## Phase 2: Foundation (Blocking Prerequisites)

**No user story work begins until this phase is complete.**

- [ ] T005 Confirm `lib/supabase/browser.ts` (`createBrowserClient`) exists and is typed; otherwise scaffold | `lib/supabase/browser.ts`
- [ ] T006 Confirm `lib/supabase/server.ts` (`createServerClient`, cookie-bound) exists and is typed; otherwise scaffold | `lib/supabase/server.ts`
- [ ] T007 [P] Add locale primitives: `Locale` type, `LOCALE_COOKIE_NAME = 'saa_locale'`, `localeFromCookie`, `setLocaleCookie` helpers | `lib/i18n/locale.ts`
- [ ] T008 [P] Add Login i18n string tables (vi/en/ja) — hero, CTA, picker labels, error codes | `lib/i18n/login.vi.ts`, `lib/i18n/login.en.ts`, `lib/i18n/login.ja.ts`, `lib/i18n/login.ts` (barrel)
- [ ] T009 [P] Add pure helper `errorCodeToMessage(code, locale)` covering `auth/forbidden-domain`, `auth/email-not-verified`, `auth/cookies-blocked`, `auth/state-mismatch`, `auth/invalid-callback`, fallback | `lib/i18n/loginErrors.ts`
- [ ] T010 [P] Vitest unit tests for `localeFromCookie` + `errorCodeToMessage` (covers FR-005, FR-006, FR-008) | `tests/unit/login/locale.test.ts`, `tests/unit/login/loginErrors.test.ts`
- [ ] T011 [P] Add headless `Button` primitive (variant, size, loading slot) | `components/ui/Button.tsx`

**Checkpoint**: foundation green — TS strict passes, Vitest passes.

---

## Phase 3: User Story 1 — Google login → Homepage SAA (Priority: P1) — MVP

**Goal**: an unauthenticated visitor clicks "LOGIN With Google" and reaches `/` signed in.
**Independent Test**: Playwright E2E with stubbed Google IdP — see spec US1 Independent Test.

- [ ] T012 [US1] Scaffold `/login` Server Component shell with auth gate (`getUser()` → `redirect('/')`) and `searchParams` typing | `app/(auth)/login/page.tsx`
- [ ] T013 [US1] Scaffold optional `(auth)` layout (no header chrome) | `app/(auth)/login/layout.tsx`
- [ ] T014 [P] [US1] `Logo` RSC (Node `I662:14391;186:2166`) | `components/feature/login/Logo.tsx`
- [ ] T015 [P] [US1] `HeroCopy` RSC — `<h1>` ROOT FURTHER + 2 description `<p>` localised (Node `662:14753`) | `components/feature/login/HeroCopy.tsx`
- [ ] T016 [P] [US1] `LoginFooter` RSC, position-fixed bottom (Node `662:14447`, FR-010) | `components/feature/login/LoginFooter.tsx`
- [ ] T017 [US1] `GoogleLoginButton` Client Component — `"use client"` justify comment, `inFlight` state, calls `signInWithOAuth({ provider: 'google', options: { redirectTo: \`${origin}/auth/callback\`, queryParams: { hd: 'sun-asterisk.com' } } })`, handles double-click guard, honours `prefers-reduced-motion` (Node `662:14425`, FR-002/003, TR-006) | `components/feature/login/GoogleLoginButton.tsx`
- [ ] T018 [US1] `/auth/callback` Route Handler — `exchangeCodeForSession(code)` then `redirect('/')` on success | `app/auth/callback/route.ts`
- [ ] T019 [US1] Wire page composition: render Header (placeholder for picker), HeroCopy, GoogleLoginButton, Footer | `app/(auth)/login/page.tsx`
- [ ] T020 [P] [US1] Playwright E2E for US1 golden path (stubbed Google IdP, asserts disabled+loader within 100 ms, `/me` returns 200 after callback) | `tests/e2e/login/us1-google-flow.spec.ts`
- [ ] T021 [P] [US1] Playwright assertion: 0 duplicate `signInWithOAuth` on rapid double-click (SC-004) | `tests/e2e/login/us1-double-click.spec.ts`

**Checkpoint**: US1 independently testable.

---

## Phase 4: User Story 2 — Surface auth errors (Priority: P1)

**Goal**: BE-rejected callbacks (forbidden domain, unverified email, cookies blocked) render a localised banner above the CTA.
**Independent Test**: Playwright with stubbed `@gmail.com` identity.

- [ ] T022 [US2] Extend `/auth/callback` to map BE error responses to `redirect('/login?error=<code>')` (FR-004) | `app/auth/callback/route.ts`
- [ ] T023 [P] [US2] `ErrorBanner` RSC — reads `code` prop, looks up localised message, renders `role="alert"`, conditional DOM mount (FR-005, FR-011) | `components/feature/login/ErrorBanner.tsx`
- [ ] T024 [US2] Wire `<ErrorBanner>` into page when `searchParams.error` is present | `app/(auth)/login/page.tsx`
- [ ] T025 [US2] Add "How to enable cookies" link slot inside banner when `code === 'auth/cookies-blocked'` (FR-012) | `components/feature/login/ErrorBanner.tsx`
- [ ] T026 [US2] Reset `inFlight` on remount + ensure banner is cleared on next CTA click (URL query removed) | `components/feature/login/GoogleLoginButton.tsx`
- [ ] T027 [P] [US2] Playwright E2E for `auth/forbidden-domain` (stubbed gmail) | `tests/e2e/login/us2-forbidden-domain.spec.ts`
- [ ] T028 [P] [US2] Playwright E2E for `auth/email-not-verified` + unknown code generic fallback | `tests/e2e/login/us2-error-codes.spec.ts`

**Checkpoint**: US2 complete; error banners localised per `errorCodeToMessage`.

---

## Phase 5: User Story 3 — Pre-login locale picker (Priority: P2)

**Goal**: locale change before sign-in writes `saa_locale` cookie and re-renders strings without full reload; BE persists locale on first OAuth.

- [ ] T029 [US3] `LanguagePicker` Client Component — `"use client"` justify comment, `aria-haspopup="listbox" aria-expanded`, keyboard handlers (Arrow/Enter/Escape), cookie write, `router.refresh()` after selection (Node `I662:14391;186:1601`, FR-006/007/008) | `components/feature/login/LanguagePicker.tsx`
- [ ] T030 [US3] `LoginHeader` RSC composing `Logo` + `LanguagePicker` (Node parent `662:14388`) | `components/feature/login/LoginHeader.tsx`
- [ ] T031 [US3] Read `saa_locale` cookie in `app/(auth)/login/page.tsx` and pass `locale` prop down to `HeroCopy` + `ErrorBanner` + `GoogleLoginButton` | `app/(auth)/login/page.tsx`
- [ ] T032 [P] [US3] Playwright E2E: switch VN → EN, assert cookie + re-render + reload preservation + post-login `/me.locale === 'en'` | `tests/e2e/login/us3-locale-picker.spec.ts`
- [ ] T033 [P] [US3] Playwright E2E keyboard nav: Tab to picker, Enter opens, ArrowDown highlights, Enter commits, Escape closes | `tests/e2e/login/us3-picker-keyboard.spec.ts`

**Checkpoint**: US3 complete; cookie contract aligned with BE FR-003.

---

## Phase 6: User Story 4 — Authenticated user redirected away (Priority: P3)

**Goal**: visiting `/login` with a valid session redirects to `/` without rendering Login UI.

- [ ] T034 [US4] Verify auth gate in `page.tsx` calls `getUser()` and `redirect('/')` before any JSX (FR-001) | `app/(auth)/login/page.tsx`
- [ ] T035 [P] [US4] Playwright E2E: sign in once, then navigate to `/login` — assert redirect to `/` without flash of Login UI | `tests/e2e/login/us4-authed-redirect.spec.ts`
- [ ] T036 [P] [US4] Playwright E2E: expired access token + valid refresh token → Supabase SSR refresh → redirect to `/` (US4 AC3) | `tests/e2e/login/us4-refresh.spec.ts`

**Checkpoint**: all 4 user stories complete; AC coverage 100%.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T037 [P] Run `axe-core/playwright` against `/login` (no-error + with-error states) — assert 0 violations (SC-005) | `tests/e2e/login/a11y.spec.ts`
- [ ] T038 [P] Assert no service-role key string in `pnpm build` output (greppable, SC-006) | `tests/unit/login/bundle-secrets.test.ts`
- [ ] T039 [P] Assert reduced-motion variant: spinner replaced with static glyph + instant picker open | `tests/e2e/login/reduced-motion.spec.ts`
- [ ] T040 [P] Two-tab session sync: tab A signs in, tab B regains focus → redirects (edge case in spec) | `tests/e2e/login/multi-tab.spec.ts`
- [ ] T041 Performance budget assertion: click-to-loader ≤ 100 ms, FCP ≤ 1.5 s on simulated 3G (SC-002, SC-003) | `tests/e2e/login/perf.spec.ts`
- [ ] T042 Final pass: `pnpm typecheck && pnpm lint && pnpm build && pnpm e2e` all green; commit `feat(ui): implement login` | (n/a)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: no deps; starts immediately.
- **Foundation (Phase 2)**: depends on Setup; BLOCKS all US phases. Tasks T007/T008/T009/T010/T011 are independent and run in parallel.
- **US1 (Phase 3)**: depends on Foundation. T014/T015/T016 run in parallel; T017 depends on T011; T019 depends on T012+T017; tests T020/T021 run in parallel once code lands.
- **US2 (Phase 4)**: depends on US1 (extends page + callback). T023/T027/T028 parallel.
- **US3 (Phase 5)**: independent of US2; can run in parallel with US2 if staffed. T032/T033 parallel.
- **US4 (Phase 6)**: depends on Foundation only; effectively verification of T012. Tests parallel.
- **Polish (Phase 7)**: depends on all USes; all `[P]` tasks parallel.

---

## Notes

- Commit cadence: one `feat(ui): implement login` commit at the end per constitution Principle V; intermediate WIP allowed locally.
- BE pre-req: Supabase Google provider + `hd=sun-asterisk.com` must be configured in `backend/supabase/config.toml` and Google Console before any E2E will pass.
- Cookie name `saa_locale` is load-bearing — mirrors BE FR-003 verbatim.
