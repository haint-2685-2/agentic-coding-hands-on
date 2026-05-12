# Tasks: Hệ thống giải (Frontend)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md)
**Date**: 2026-05-12

---

## Task Format

```
- [ ] T### [P?] [USx?] Description | path/to/file.ts
```

- `[P]` — parallelizable (different files, no dependencies)
- `[USx]` — user story label

---

## Phase 1: Setup

- [ ] T001 [P] Ensure `@supabase/supabase-js` pinned in package.json | frontend/package.json
- [ ] T002 [P] Add Vitest config (shared with other screens) | frontend/vitest.config.ts
- [ ] T003 [P] Add Playwright config + auth fixture (shared) | frontend/playwright.config.ts, frontend/tests/e2e/_fixtures/auth.ts
- [ ] T004 [P] Add `@axe-core/playwright` dev dependency for a11y audits | frontend/package.json

---

## Phase 2: Foundation (Blocking)

**⚠️ CRITICAL — no US task may start until this phase completes.**

- [ ] T010 Verify `lib/supabase/server.ts` exports cookie-bound `createClient()` (already scaffolded) | frontend/lib/supabase/server.ts
- [ ] T011 [P] Implement `getMe(supabase)` (shared) | frontend/lib/api/me.ts
- [ ] T012 [P] Implement `getAwardsDetail(supabase, locale)` calling `GET /functions/v1/awards?detail=true&locale=` | frontend/lib/api/awards.ts
- [ ] T013 [P] Implement `formatVnd(value)` using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` | frontend/lib/format/currency.ts
- [ ] T014 [P] Add `slugToHash` + `idToSlug` helpers | frontend/lib/format/slug.ts
- [ ] T015 [P] Add `lib/i18n/awards.ts` UI chrome strings (page title, banner labels) keyed by `vi\|en\|ja` | frontend/lib/i18n/awards.ts
- [ ] T016 [P] Build UI primitives `Container`, `Heading`, `Image` | frontend/components/ui/Container.tsx, Heading.tsx, Image.tsx
- [ ] T017 Create `app/awards/page.tsx` shell: cookie auth probe → `redirect('/login?next=/awards')` on null user (FR-001) | frontend/app/awards/page.tsx
- [ ] T018 [P] Create `app/awards/loading.tsx` skeleton | frontend/app/awards/loading.tsx
- [ ] T019 [P] Create `app/awards/error.tsx` boundary with reset button | frontend/app/awards/error.tsx
- [ ] T020 Set `export const dynamic = 'force-dynamic'` on the route (TR-003) | frontend/app/awards/page.tsx

**Checkpoint**: foundation ready.

---

## Phase 3: User Story 1 — Authenticated browse (P1) 🎯 MVP

**Goal**: Signed-in user sees 6 award cards (title, image, long desc, quantity, unit, prize value) in one fetch.

**Independent test**: Playwright `he-thong-giai.spec.ts > "renders all six awards"`.

### Frontend (US1)

- [ ] T030 [US1] Implement `getMe` + `getAwardsDetail` calls inside `page.tsx`; pass results to `AwardsCatalog` | frontend/app/awards/page.tsx
- [ ] T031 [P] [US1] Build `HeroKeyvisual` (decorative banner, `alt=""`) | frontend/components/feature/awards/HeroKeyvisual.tsx
- [ ] T032 [P] [US1] Build `TitleBlock` with supertitle "Sun* annual awards 2025" + heading "Hệ thống giải thưởng SAA 2025" (TC ID-4) | frontend/components/feature/awards/TitleBlock.tsx
- [ ] T033 [P] [US1] Build `AwardCard` rendering image + h2 title + long desc (`white-space: pre-wrap`) + quantity + unit + `AwardValue` | frontend/components/feature/awards/AwardCard.tsx
- [ ] T034 [P] [US1] Build `AwardValue` covering single & dual-VND case (Signature 2025) using `formatVnd` | frontend/components/feature/awards/AwardValue.tsx
- [ ] T035 [US1] Build `AwardsCatalog` shell rendering left rail + cards column (server-shape; client hook-up in Phase 5) | frontend/components/feature/awards/AwardsCatalog.tsx

### Tests (US1)

- [ ] T036 [P] [US1] Vitest — `formatVnd` snapshot of canonical 7M/10M/15M/5M/8M values | frontend/tests/unit/format-currency.test.ts
- [ ] T037 [US1] Playwright — visit `/awards` signed-in → 200 + 6 sections in `display_order` (AC1, AC2) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T038 [US1] Playwright — assert canonical numbers (Top Talent 10/7M, Top Project 2/15M, Top Project Leader 3/7M, Best Manager 1/10M, Signature 2025 1/5M+8M, MVP 1/15M) per TC ID-6 (AC5) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T039 [US1] Playwright — title block strings match (AC3) | frontend/tests/e2e/he-thong-giai.spec.ts

**Checkpoint**: US1 (MVP) complete.

---

## Phase 4: User Story 2 — Auth gate redirect (P1)

- [ ] T040 [US2] Confirm `page.tsx` redirect runs before any data fetch (FR-001) | frontend/app/awards/page.tsx
- [ ] T041 [US2] On 401 from `getAwardsDetail` (token expired) also `redirect('/login?next=/awards')` (AC3) | frontend/app/awards/page.tsx
- [ ] T042 [P] [US2] Playwright — anon visit → redirected to `/login?next=/awards` (AC1, TC ID-1) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T043 [P] [US2] Playwright — expired-cookie test (delete `sb-*` cookies mid-test) → redirect (AC3) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Phase 5: User Story 3 — Left-rail scroll-spy (P1)

- [ ] T050 [US3] Convert `AwardsCatalog` to Client Component; add refs map for each `<section>` + `IntersectionObserver` driving `activeSlug` state | frontend/components/feature/awards/AwardsCatalog.tsx
- [ ] T051 [US3] Build `LeftRailNav` Client Component rendering 6 anchors with `aria-current` from `activeSlug` (TC ID-11) | frontend/components/feature/awards/LeftRailNav.tsx
- [ ] T052 [US3] On click set `history.replaceState(null, '', '#slug')` (FR-006), no `push` | frontend/components/feature/awards/LeftRailNav.tsx
- [ ] T053 [US3] Honour `prefers-reduced-motion: reduce` — auto-scroll falls back to instant (FR-009, edge case) | frontend/components/feature/awards/AwardsCatalog.tsx
- [ ] T054 [US3] Defensive guard for invalid hash on mount (AC5) | frontend/components/feature/awards/AwardsCatalog.tsx
- [ ] T055 [US3] Degrade gracefully when `IntersectionObserver` is unavailable (anchor-only fallback, edge case) | frontend/components/feature/awards/AwardsCatalog.tsx
- [ ] T056 [P] [US3] Vitest — `slugToHash`/`idToSlug` round-trip + invalid input | frontend/tests/unit/format-slug.test.ts
- [ ] T057 [P] [US3] Playwright — click each menu item → smooth scroll + `aria-current` update (AC1, AC2) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T058 [P] [US3] Playwright — invalid hash deep-link does not crash (AC5, TC ID-13) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T059 [P] [US3] Playwright — keyboard Tab into nav, focus ring visible, Enter activates (AC4) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Phase 6: User Story 5 — Sun* Kudos CTA banner (P2)

- [ ] T060 [US5] Build `KudosCtaBanner` with label, title, description, `<Link href="/kudos">Chi tiết</Link>` (TC ID-12) | frontend/components/feature/awards/KudosCtaBanner.tsx
- [ ] T061 [US5] If `/kudos` route is not yet built, render disabled `<button aria-disabled="true">` (edge case "defensive") | frontend/components/feature/awards/KudosCtaBanner.tsx
- [ ] T062 [P] [US5] Playwright — click "Chi tiết" → navigates to `/kudos` (AC2) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T063 [P] [US5] Playwright — banner content matches (label "Phong trào ghi nhận", title "Sun* Kudos", description, button) (AC1) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Phase 7: User Story 4 — Locale switch (P2)

- [ ] T070 [US4] On global header locale change → `PATCH /me/language` → `router.refresh()` so RSC re-runs with new locale (AC1 path (a)) | frontend/components/layout/HeaderLanguageDropdown.tsx (shared)
- [ ] T071 [US4] Capture/restore `window.scrollY` around refresh (AC3) | frontend/components/layout/HeaderLanguageDropdown.tsx
- [ ] T072 [US4] Currency always renders with `vi-VN` regardless of locale (spec Edge Cases + Notes) | frontend/lib/format/currency.ts
- [ ] T073 [P] [US4] Playwright — switch `vi` → `en`, assert card text in EN + same scroll offset preserved | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T074 [P] [US4] Playwright — missing EN string falls back to VI transparently (AC2) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Phase 8: User Story 6 — Picture-Award images (P3)

- [ ] T080 [US6] Resolve `hero_image_path` via signed URL (server-side) or public path based on env switch | frontend/lib/api/awards.ts
- [ ] T081 [US6] Use `<Image alt="<award.title>" loading="lazy">`; `onError` swaps in placeholder tile (AC1, AC2, AC3) | frontend/components/feature/awards/AwardCard.tsx
- [ ] T082 [P] [US6] Playwright — image visible per card (AC1, TC ID-7) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T083 [P] [US6] Playwright — broken `hero_image_path` shows placeholder tile, zero console errors (AC2) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Phase 9: Polish

- [ ] T090 [P] Edge — empty list defensive render (spec Edge Cases) | frontend/components/feature/awards/AwardsCatalog.tsx
- [ ] T091 [P] Edge — long description respects `\n` via `white-space: pre-wrap` | frontend/components/feature/awards/AwardCard.tsx
- [ ] T092 [P] Edge — `Cache-Control: private` preserved; FE adds no public cache (TR-003) | frontend/app/awards/page.tsx
- [ ] T093 [P] Responsive — left rail becomes horizontal pill bar on `<1024 px`, scrollable on `<768 px` | frontend/components/feature/awards/LeftRailNav.tsx
- [ ] T094 [P] A11y — `@axe-core/playwright` zero serious/critical (SC-003, TR-006) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T095 [P] A11y — keyboard-only walkthrough reaches all 6 menu items + CTA (SC-004) | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T096 [P] Perf — FCP ≤ 1.5 s p75 locally (SC-002) — Playwright trace check | frontend/tests/e2e/he-thong-giai.spec.ts
- [ ] T097 [P] CI grep — no service-role key in bundled chunks (constitution IV) | frontend/scripts/check-no-service-role.sh
- [ ] T098 [P] Snapshot test — canonical VND strings render exactly (SC-006) | frontend/tests/e2e/he-thong-giai.spec.ts

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: parallel.
- **Phase 2 (Foundation)**: T010 blocks T011/T012; T013–T016 parallel; T017 needs T010+T011; T018–T020 parallel after T017.
- **Phase 3 (US1)**: depends on Phase 2; T031–T034 parallel; T035 after them.
- **Phase 4 (US2)**: lightweight, depends on T017.
- **Phase 5 (US3)**: depends on US1 (cards must exist to be observed).
- **Phase 6 (US5)**: independent of US3/US4; can run after Phase 2.
- **Phase 7 (US4)**: depends on header locale dropdown (Login spec US3) being shipped; otherwise mock the `PATCH /me/language` call in tests.
- **Phase 8 (US6)**: depends on US1 (cards) — can run in parallel with US3/US5.
- **Phase 9 (Polish)**: after all desired US complete.

### Parallel Opportunities

- Phase 1: all `[P]`.
- Phase 2: T011–T016 (different files).
- Phase 3: T031–T034 component files are independent.
- All Playwright AC tasks within a phase target the same spec file → serialize on file but independent at runtime.

---

## Implementation Strategy

### MVP First

1. Phase 1 + 2.
2. US1 (Phase 3) → 6 cards render with canonical numbers.
3. US2 (Phase 4) → auth redirect.
4. US3 (Phase 5) → scroll-spy.
5. Validate → deploy.
6. US5 (Phase 6), US4 (Phase 7), US6 (Phase 8) incrementally.

---

## Notes

- Single `feat(ui): implement he-thong-giai` commit at the end per constitution V.
- VND formatting locked to `vi-VN` regardless of UI language (spec Edge Cases + Notes).
- Route ships at `/awards` per constitution layout; spec slug `/he-thong-giai` covered by a one-line redirect if/when product requests.
