# Tasks: Open Secret Box (Frontend)

**Frame**: `J3-4YFIpMM-open-secret-box`
**Prerequisites**: `spec.md` (required), `plan.md` (required), BE spec at `../../../../backend/.momorph/specs/J3-4YFIpMM-open-secret-box/spec.md`, Login plan/tasks (auth gate + `Button` primitive reused).

---

## Task Format

`- [ ] T### [P?] [USx?] Description | path/to/file.ts`

- **[P]** — independent file, parallel-safe.
- **[USx]** — user story tag from spec (US1..US5).
- File paths relative to `frontend/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Confirm Next.js 14 + Tailwind + TS strict bootstrap still green (carry-over from Login) | (verify) `package.json`, `tsconfig.json`
- [ ] T002 [P] Add `next.config.mjs` `images.remotePatterns` entry for Supabase Storage host (only if using `<Image>`; otherwise no-op + comment) | `next.config.mjs`
- [ ] T003 [P] Add SQL fixture for E2E: seed 2 unopened `secret_box` rows for the test user (used by Playwright; lives in BE test fixtures) | `tests/e2e/fixtures/seed-secret-boxes.sql`
- [ ] T004 Load Secret Box frame assets (closed-box illustration, fallback silhouette, sparkle artwork if static) from MoMorph media into `public/secret-box/` | `public/secret-box/*`

---

## Phase 2: Foundation (Blocking Prerequisites)

- [ ] T005 Confirm `lib/supabase/browser.ts` + `lib/supabase/server.ts` exist and are typed (carry-over from Login) | `lib/supabase/{browser,server}.ts`
- [ ] T006 [P] Add typed wrappers `getMyBoxes` + `openBox` (incl. `Retry-After` parsing) | `lib/api/secretBox.ts`
- [ ] T007 [P] Add domain types: `Badge`, `OpenedHistory`, `OpenBoxResult` (discriminated union) | `lib/api/secretBox.types.ts`
- [ ] T008 [P] Add pure helpers `formatCount(n: number)` (zero-pad < 100, raw ≥ 100 — FR-010) and `mapBoxError(code: string, locale)` and `parseRetryAfter(headers)` | `lib/secretBox/format.ts`, `lib/secretBox/errors.ts`, `lib/secretBox/retry.ts`
- [ ] T009 [P] Add Secret Box i18n string tables (vi/en/ja) — title, instructional, counter label, error messages, fallback badge alt | `lib/i18n/secretBox.{vi,en,ja}.ts`, `lib/i18n/secretBox.ts` (barrel)
- [ ] T010 [P] Vitest unit tests for `formatCount`, `mapBoxError`, `parseRetryAfter` | `tests/unit/secret-box/format.test.ts`, `tests/unit/secret-box/errors.test.ts`, `tests/unit/secret-box/retry.test.ts`
- [ ] T011 [P] Add headless `Dialog` primitive — focus trap, ESC handler, `aria-modal`, backdrop click, returns focus to opener | `components/ui/Dialog.tsx`
- [ ] T012 [P] Vitest test for `Dialog` focus-trap (jsdom) | `tests/unit/ui/Dialog.test.tsx`

**Checkpoint**: foundation green — TS strict + Vitest pass.

---

## Phase 3: User Story 1 — Open one box and reveal a badge (Priority: P1) — MVP

**Goal**: signed-in user clicks the box → loading → reveal → counter decrement → re-enable.
**Independent Test**: Playwright with seeded 2 boxes — see spec US1 Independent Test.

- [ ] T013 [US1] `/secret-box` Server Component: auth gate + initial `getMyBoxes()` + render `<SecretBoxModal initial={...}>` (FR-001) | `app/secret-box/page.tsx`
- [ ] T014 [US1] Server Action `openBoxAction()` wrapping `openBox()`; returns discriminated union incl. `retryAfter` (FR-003, TR-004) | `app/secret-box/actions.ts`
- [ ] T015 [US1] `SecretBoxModal` Client Component shell — `"use client"` justify comment; props `{ initial }`; state `isOpening`, `unopenedCount`, `lastBadge`, `error`, `retryUntil` (Node `1466:7676`) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T016 [P] [US1] `UnopenedCounter` — label "Secretbox chưa mở" + zero-padded value (Node `1466:7689`, FR-010) | `components/feature/secret-box/UnopenedCounter.tsx`
- [ ] T017 [P] [US1] Modal title — static heading "MỞ SECRET BOX THÀNH CÔNG" (Node `1466:7678`) | inline in `SecretBoxModal.tsx` (or `ModalTitle.tsx` if extracted)
- [ ] T018 [P] [US1] Instructional text — "Click vào box để tiếp tục mở", conditionally mounted (Node `1466:7681`, FR-011) | inline in `SecretBoxModal.tsx`
- [ ] T019 [US1] `BoxButton` — `<button>` with `aria-label="Open a secret box (N remaining)"`; click → `openBoxAction()`; double-click guard via `isOpening`; reveals `lastBadge.image_path` after success; `<img onError>` fallback silhouette (Node `1466:7684`, FR-002/003/005/012, TR-007) | `components/feature/secret-box/BoxButton.tsx`
- [ ] T020 [US1] Wire reveal animation transitions (closed → opening → revealed); cross-fade with `prefers-reduced-motion` fallback (TR-006, SC-007) | `components/feature/secret-box/BoxButton.tsx`
- [ ] T021 [US1] `aria-live="polite"` region wrapping reveal area; announces `badge.name` after each open | `components/feature/secret-box/BoxButton.tsx`
- [ ] T022 [P] [US1] Playwright E2E for US1 golden path (seed 2, open both, counter 02 → 01 → 00, asserts exactly one POST per click, loader within 100 ms) | `tests/e2e/secret-box/us1-open-reveal.spec.ts`
- [ ] T023 [P] [US1] Playwright assertion: 0 duplicate `POST /open` on rapid double-click (SC-003) | `tests/e2e/secret-box/us1-double-click.spec.ts`
- [ ] T024 [P] [US1] Playwright assertion: request body is empty / no `badge_code` ever sent (SC-004, TR-007) | `tests/e2e/secret-box/us1-request-shape.spec.ts`

**Checkpoint**: US1 independently testable.

---

## Phase 4: User Story 2 — Anonymous user → Login (Priority: P1)

**Goal**: `/secret-box` without session redirects to `/login?redirectTo=/secret-box`.

- [ ] T025 [US2] Confirm auth gate in `app/secret-box/page.tsx` redirects on no session (FR-001) | `app/secret-box/page.tsx`
- [ ] T026 [US2] Handle `403 auth/account-disabled` from first GET — render banner + disable box (FR-008) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T027 [P] [US2] Playwright E2E: clear cookies, hit `/secret-box`, assert redirect URL contains `redirectTo=/secret-box`; sign in, land back on `/secret-box` | `tests/e2e/secret-box/us2-anon-redirect.spec.ts`
- [ ] T028 [P] [US2] Playwright E2E for `auth/account-disabled` (stub BE response) | `tests/e2e/secret-box/us2-account-disabled.spec.ts`

**Checkpoint**: US2 complete.

---

## Phase 5: User Story 3 — Handle "no boxes left" (Priority: P2)

**Goal**: `409 secret_box/no_boxes`, `429 rate/limited`, and `unopened_count: 0` initial state all degrade gracefully.

- [ ] T029 [US3] `BoxErrorBanner` — `role="alert"`, takes `code` + `message`; auto-dismiss after a few seconds OR manual dismiss (Node n/a, FR-006/007/009) | `components/feature/secret-box/BoxErrorBanner.tsx`
- [ ] T030 [US3] Handle `409 secret_box/no_boxes` in modal — set count to 0, hide instructional, show banner, do NOT auto-close modal (US3 AC2) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T031 [US3] Handle `429 rate/limited` — disable box until `retryUntil`; auto re-enable with `setTimeout` cleanup on unmount (FR-007) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T032 [US3] Handle network / 5xx — generic banner + re-enable box (FR-009) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T033 [P] [US3] Playwright E2E for `409 no_boxes` (open 2 boxes in tab A, then attempt 3rd) | `tests/e2e/secret-box/us3-no-boxes.spec.ts`
- [ ] T034 [P] [US3] Playwright E2E for `429 rate-limited` (stub BE rate-limit response with `Retry-After: 2`) | `tests/e2e/secret-box/us3-rate-limit.spec.ts`
- [ ] T035 [P] [US3] Playwright E2E initial state `unopened_count: 0` (seed user with 0 boxes, assert disabled `aria-disabled="true"`, instructional removed from DOM) | `tests/e2e/secret-box/us3-empty-state.spec.ts`

**Checkpoint**: US3 complete.

---

## Phase 6: User Story 4 — Read counters on mount + after open (Priority: P2)

**Goal**: counter sourced from BE on mount, updated from each open response, resynced on `visibilitychange`.

- [ ] T036 [US4] `visibilitychange` listener in modal — on `visibilityState === 'visible'` and `!isOpening`, refetch via `getMyBoxes` (FR-013) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T037 [US4] Render counter exactly as zero-padded < 100 / raw ≥ 100 (FR-010 — verified by `formatCount` unit tests, integration sanity here) | `components/feature/secret-box/UnopenedCounter.tsx`
- [ ] T038 [P] [US4] Playwright E2E: open 1 box, simulate tab-blur + tab-focus (`page.evaluate(() => document.dispatchEvent(...))`), assert refetch fires and counter resyncs | `tests/e2e/secret-box/us4-visibility-refetch.spec.ts`
- [ ] T039 [P] [US4] Playwright E2E: tamper with `window.__SECRET_BOX_STATE__` / counter via `page.evaluate`, fire `visibilitychange`, assert BE value overwrites tampered value (SC-008) | `tests/e2e/secret-box/us4-tamper-resync.spec.ts`
- [ ] T040 [P] [US4] Playwright E2E: seed user with 100 boxes (BE max), assert counter renders `100` without truncation | `tests/e2e/secret-box/us4-max-count.spec.ts`

**Checkpoint**: US4 complete.

---

## Phase 7: User Story 5 — Close the modal (Priority: P3)

**Goal**: `X` button + `Escape` close the modal; focus trap holds while open.

- [ ] T041 [US5] Close button inside modal — `router.back()` if history, else `router.push('/')` (FR-014) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T042 [US5] Wire `Escape` key → close (already provided by `Dialog` primitive; verify wiring) | `components/feature/secret-box/SecretBoxModal.tsx`
- [ ] T043 [P] [US5] Playwright E2E: click X closes modal and returns to previous route | `tests/e2e/secret-box/us5-close-x.spec.ts`
- [ ] T044 [P] [US5] Playwright E2E: ESC closes modal | `tests/e2e/secret-box/us5-close-escape.spec.ts`
- [ ] T045 [P] [US5] Playwright Tab-loop test — focus never leaves the modal while open (SC-006, FR-015) | `tests/e2e/secret-box/us5-focus-trap.spec.ts`

**Checkpoint**: all 5 user stories complete; AC coverage 100%.

---

## Phase 8: Polish & Cross-Cutting

- [ ] T046 [P] `axe-core/playwright` on `/secret-box` in both `count > 0` and `count === 0` states (SC-005) | `tests/e2e/secret-box/a11y.spec.ts`
- [ ] T047 [P] Reduced-motion variant: reveal completes ≤ 50 ms (SC-007) | `tests/e2e/secret-box/reduced-motion.spec.ts`
- [ ] T048 [P] Image fallback test: invalid `image_path` → silhouette + `aria-label` (FR-012, TC `43badf5d`) | `tests/e2e/secret-box/image-fallback.spec.ts`
- [ ] T049 [P] Image-URL tampering test: assert FE never reads `?image=` query / never synthesises image URLs (TC `2e7bec78`, TR-007) | `tests/e2e/secret-box/image-tamper.spec.ts`
- [ ] T050 [P] Performance budget: click-to-loader ≤ 100 ms, reveal animation ≤ 300 ms (SC-002, TR-006) | `tests/e2e/secret-box/perf.spec.ts`
- [ ] T051 [P] AbortController test: navigate away during open, assert no orphan state on return | `tests/e2e/secret-box/abort.spec.ts`
- [ ] T052 Final pass: `pnpm typecheck && pnpm lint && pnpm build && pnpm e2e` all green; commit `feat(ui): implement open-secret-box` | (n/a)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: no deps; starts immediately.
- **Foundation (Phase 2)**: depends on Setup; BLOCKS all US phases. T006–T012 are independent and parallel.
- **US1 (Phase 3)**: depends on Foundation (esp. T006/T011). T013 → T014 → T015 sequential. T016/T017/T018 parallel after T015. T019/T020/T021 sequential (same file). Tests T022/T023/T024 parallel.
- **US2 (Phase 4)**: depends on T013 (auth gate). Tests parallel.
- **US3 (Phase 5)**: depends on US1 modal scaffold. T030/T031/T032 sequential (same file). Tests parallel.
- **US4 (Phase 6)**: depends on US1. Tests parallel.
- **US5 (Phase 7)**: depends on US1 + `Dialog` primitive (T011). Tests parallel.
- **Polish (Phase 8)**: depends on all USes; all `[P]` parallel.

---

## Notes

- Commit cadence: one `feat(ui): implement open-secret-box` commit per constitution Principle V.
- BE pre-req: `fn_open_secret_box` RPC + seeded badges must exist; verify with `supabase db reset` + `supabase functions serve` before E2E.
- Server Action `openBoxAction` is preferred per constitution; it MUST return parsed `retryAfter` (do not rely on header propagation through Next's action plumbing).
- FE NEVER sends `badge_code` and NEVER reads `?image=`; both are asserted in dedicated Polish tests.
