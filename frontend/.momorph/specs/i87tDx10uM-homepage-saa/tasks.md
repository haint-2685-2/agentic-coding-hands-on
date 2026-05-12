# Tasks: Homepage SAA (Frontend)

**Frame**: `i87tDx10uM-homepage-saa`
**Prerequisites**: [`./spec.md`](./spec.md), [`./plan.md`](./plan.md)

---

## Task Format

```
- [ ] T### [P?] [USx?] Description | path/to/file.ts
```

- **[P]**: parallelizable (different files, no ordering dependency).
- **[USx]**: maps to a user story (US1..US6) from `spec.md`.
- Node IDs in parentheses reference Figma nodes from `spec.md` § UI/UX Requirements.

---

## Phase 1: Setup

- [ ] T001 Add Vitest + Playwright config (root `package.json` scripts, `vitest.config.ts`, `playwright.config.ts`) | `frontend/package.json`
- [ ] T002 [P] Add `clsx` + `tailwind-merge` deps + `lib/cn.ts` helper | `frontend/lib/cn.ts`
- [ ] T003 [P] Configure Tailwind theme tokens for typography + colors used by homepage | `frontend/tailwind.config.ts`
- [ ] T004 Pull screen assets (logo, hero KV `2167:9027`, award thumbnails for `2167:9075..2167:9081`, kudos promo `3390:10349`, footer logo `342:1408`, floating widget icon `5022:15169`) into `/public/img/homepage/` | `frontend/public/img/homepage/`

---

## Phase 2: Foundation (blocks all user stories)

- [ ] T010 [P] Implement `lib/api/_client.ts` typed fetch wrapper returning `{ ok, data } | { ok, error }` | `frontend/lib/api/_client.ts`
- [ ] T011 [P] Implement `lib/api/config.ts#getEventConfig()` (Server, `revalidate: 60`) | `frontend/lib/api/config.ts`
- [ ] T012 [P] Implement `lib/api/awards.ts#listAwards(locale)` (Server, `revalidate: 60`) | `frontend/lib/api/awards.ts`
- [ ] T013 [P] Implement `lib/api/me.ts` (`getMe`, `patchLanguage`) | `frontend/lib/api/me.ts`
- [ ] T014 [P] Implement `lib/api/notifications.ts` (`getUnreadCount`, `listNotifications`, `markRead`, `markAllRead`) | `frontend/lib/api/notifications.ts`
- [ ] T015 [P] Implement `lib/i18n/<vi|en>/homepage.ts` copy decks | `frontend/lib/i18n/vi/homepage.ts`, `frontend/lib/i18n/en/homepage.ts`
- [ ] T016 [P] Implement `lib/i18n/getLocale.ts` (reads `saa_locale` cookie via `cookies()`, default `vi`) | `frontend/lib/i18n/getLocale.ts`
- [ ] T017 [P] Implement `lib/a11y/useFocusTrap.ts` | `frontend/lib/a11y/useFocusTrap.ts`
- [ ] T018 [P] Implement `lib/time/formatCountdown.ts` (returns `{ days, hours, minutes }` padded to 2 digits) | `frontend/lib/time/formatCountdown.ts`
- [ ] T019 [P] Implement `lib/time/relativeTime.ts` (with `Intl.RelativeTimeFormat` fallback per Edge case 7) | `frontend/lib/time/relativeTime.ts`
- [ ] T020 [P] Implement `components/ui/Skeleton.tsx`, `Badge.tsx`, `IconButton.tsx`, `Dropdown.tsx`, `Toast.tsx` | `frontend/components/ui/*`
- [ ] T021 Implement root `app/layout.tsx` (calls `getMe()` server-side; mounts Toaster; renders `<Header me={…} />`) | `frontend/app/layout.tsx`
- [ ] T022 Implement `app/error.tsx` + `app/loading.tsx` skeletons | `frontend/app/error.tsx`, `frontend/app/loading.tsx`

**Vitest unit tests for foundation** (TDD before implementation):

- [ ] T030 [P] Vitest `formatCountdown` (leading zeros; freezes at delta ≤ 0; null input → `--`) | `frontend/lib/time/formatCountdown.test.ts`
- [ ] T031 [P] Vitest `relativeTime` (fallback when `Intl.RelativeTimeFormat` missing) | `frontend/lib/time/relativeTime.test.ts`
- [ ] T032 [P] Vitest `_client` (parses error envelope; surfaces 401/403/5xx as typed union) | `frontend/lib/api/_client.test.ts`

**Checkpoint**: Foundation ready; user stories can now be parallelized.

---

## Phase 3: User Story 1 — Visitor sees the live countdown (P1)

**Goal**: render `/` with a working 3-tile countdown driven by `GET /config/event`.
**Independent Test**: Playwright per `spec.md` US1 Independent Test (seed event row, assert tiles + label).

### Frontend (US1)

- [ ] T100 [TEST-FIRST] [US1] Playwright E2E for US1 acceptance scenarios 1–5 | `frontend/tests/e2e/homepage.countdown.spec.ts`
- [ ] T101 [P] [US1] Build `components/feature/homepage/Hero.tsx` (RSC; static "Root Further" copy from Node `5001:14827`) | `frontend/components/feature/homepage/Hero.tsx`
- [ ] T102 [US1] Build `components/feature/homepage/Countdown.tsx` (Client; tiles for Days `2167:9038` / Hours `2167:9043` / Minutes `2167:9048`; Coming soon label `2167:9036`; `<time>` wrapper + visually-hidden summary) | `frontend/components/feature/homepage/Countdown.tsx`
- [ ] T103 [US1] Wire `app/page.tsx` to call `getEventConfig()` and pass to `<Hero/>` | `frontend/app/page.tsx`
- [ ] T104 [P] [US1] Add Suspense boundary + skeleton fallback around Countdown | `frontend/app/page.tsx`

**Checkpoint**: countdown ticks + freezes correctly, page renders for both anonymous and authed.

---

## Phase 4: User Story 2 — Visitor browses 6 award cards (P1)

**Goal**: 6-card responsive grid; each card deep-links to `/awards#<slug>`.
**Independent Test**: Playwright per `spec.md` US2 Independent Test.

### Frontend (US2)

- [ ] T200 [TEST-FIRST] [US2] Playwright E2E for US2 acceptance scenarios 1–5 (grid layout, deep-link, empty, error) | `frontend/tests/e2e/homepage.awards.spec.ts`
- [ ] T201 [P] [US2] Build `AwardCard.tsx` (RSC; single `<a href="/awards#<slug>"`; secondary "Chi tiết" link uses `aria-hidden`; Nodes `2167:9075..2167:9081`) | `frontend/components/feature/homepage/AwardCard.tsx`
- [ ] T202 [US2] Build `AwardsGrid.tsx` (RSC; responsive 3/2/2 grid Node `5005:14974`; empty state "Sắp công bố") | `frontend/components/feature/homepage/AwardsGrid.tsx`
- [ ] T203 [US2] Wire `app/page.tsx` to call `listAwards(locale)` and render `<AwardsGrid/>` inside Suspense | `frontend/app/page.tsx`

**Checkpoint**: grid renders 6 cards in `display_order`, deep-links resolve.

---

## Phase 5: User Story 3 — Authed user sees notification badge + panel (P1)

**Goal**: bell with badge, panel list, mark-read flow.
**Independent Test**: Playwright per `spec.md` US3 Independent Test.

### Frontend (US3)

- [ ] T300 [TEST-FIRST] [US3] Playwright E2E for US3 acceptance scenarios 1–6 (signed-in seeded user; badge → panel → mark-read → mark-all → 401) | `frontend/tests/e2e/homepage.notifications.spec.ts`
- [ ] T301 [P] [US3] Build `NotificationBell.tsx` (Client; Node `186:2101`; `aria-haspopup="dialog"`; poll lifecycle keyed on `visibilityState` + `panelOpen`) | `frontend/components/feature/homepage/NotificationBell.tsx`
- [ ] T302 [US3] Build `NotificationPanel.tsx` (Client; cursor pagination via `next_cursor`; optimistic mark-read store with rollback) | `frontend/components/feature/homepage/NotificationPanel.tsx`
- [ ] T303 [US3] `next/dynamic({ ssr: false })` import of NotificationBell inside `Header.tsx`, mounted only when `me !== null` (anonymous bundle stays slim per SC-003) | `frontend/components/feature/homepage/Header.tsx`
- [ ] T304 [P] [US3] Vitest unit test for the optimistic mark-read reducer | `frontend/components/feature/homepage/notifications.reducer.test.ts`

**Checkpoint**: signed-in users see badge counts; rollback works on failure.

---

## Phase 6: User Story 4 — Avatar menu admin-aware (P2)

- [ ] T400 [TEST-FIRST] [US4] Playwright E2E (role=admin sees Admin Dashboard; role=user does not; signOut clears session) | `frontend/tests/e2e/homepage.avatar.spec.ts`
- [ ] T401 [P] [US4] Build `AvatarMenu.tsx` (Client; Node `186:1597`; `aria-haspopup="menu"`; admin-conditional item NOT rendered in DOM for non-admins) | `frontend/components/feature/homepage/AvatarMenu.tsx`
- [ ] T402 [US4] `next/dynamic` mount inside `Header.tsx` when `me !== null` | `frontend/components/feature/homepage/Header.tsx`

---

## Phase 7: User Story 5 — Language switch pre/post-login (P2)

- [ ] T500 [TEST-FIRST] [US5] Playwright E2E (anonymous sets cookie + reload; authed additionally hits `PATCH /me/language`; `ja` not exposed) | `frontend/tests/e2e/homepage.language.spec.ts`
- [ ] T501 [P] [US5] Build `LanguageSwitch.tsx` (Client; Node `186:1696`; writes `saa_locale` cookie; if authed → `patchLanguage()` + toast on error) | `frontend/components/feature/homepage/LanguageSwitch.tsx`
- [ ] T502 [US5] `next/dynamic` mount in `Header.tsx` | `frontend/components/feature/homepage/Header.tsx`
- [ ] T503 [P] [US5] Vitest unit test for the cookie-write helper | `frontend/lib/i18n/setLocale.test.ts`

---

## Phase 8: User Story 6 — Floating widget (P3)

- [ ] T600 [TEST-FIRST] [US6] Playwright E2E (open on click, close on Esc / outside click; focus returns to trigger) | `frontend/tests/e2e/homepage.floatingWidget.spec.ts`
- [ ] T601 [P] [US6] Build `FloatingWidget.tsx` (Client; Node `5022:15169`; uses `useFocusTrap` from T017) | `frontend/components/feature/homepage/FloatingWidget.tsx`

---

## Phase 9: Header + Footer composition

- [ ] T700 [P] Build `Header.tsx` (RSC shell; Nodes `2167:9091`, `178:1033`, `186:1579`, `186:1587`, `186:1593`; mounts dynamic auth chunks) | `frontend/components/feature/homepage/Header.tsx`
- [ ] T701 [P] Build `Footer.tsx` (RSC; Nodes `5001:14800`, `342:1408..1412`, `1161:9487`) | `frontend/components/feature/homepage/Footer.tsx`
- [ ] T702 [P] Build `CtaPair.tsx` (RSC; Nodes `2167:9063`, `2167:9064`) | `frontend/components/feature/homepage/CtaPair.tsx`
- [ ] T703 [P] Build `EventInfo.tsx` (RSC; Node `2167:9053`) | `frontend/components/feature/homepage/EventInfo.tsx`
- [ ] T704 [P] Build `KudosPromo.tsx` (RSC; Node `3390:10349`) | `frontend/components/feature/homepage/KudosPromo.tsx`

---

## Phase 10: Polish

- [ ] T800 [P] Add Lighthouse CI assertion ≥ 95 a11y on `/` (SC-004) | `frontend/.github/workflows/lighthouse.yml`
- [ ] T801 [P] Bundle-size check: anonymous `/` ≤ 200 KB gzip (SC-003) | `frontend/scripts/check-bundle.mjs`
- [ ] T802 [P] Manual keyboard pass checklist documented | `frontend/.momorph/specs/i87tDx10uM-homepage-saa/qa.md`
- [ ] T803 Polish: hover states, smooth-scroll on hash, focus rings audited | `frontend/components/feature/homepage/*`
- [ ] T804 Commit `feat(ui): implement homepage saa` (single commit per Constitution V) | n/a

---

## Dependencies & execution order

- Phase 1 → Phase 2 → all user stories (3..8 parallelizable per Constitution III gate).
- Phase 9 components can begin alongside Phase 3 (`Header` shell depends only on `getMe()` from T013).
- Phase 10 runs last; T804 blocked until every `[TEST-FIRST]` test is green.

### Parallel opportunities

- All `[P]` Foundation tasks (T010..T020) — independent files.
- All `[P]` US1..US6 component tasks can start in parallel **after their Playwright spec lands red** (Constitution III).
- All `[P]` polish checks (T800..T802) run concurrently in CI.
