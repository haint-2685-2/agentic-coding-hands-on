# Tasks: Sun* Kudos — Live Board (Frontend)

**Frame**: `MaZUn5xHXZ-kudos-live-board`
**Prerequisites**: [`./spec.md`](./spec.md), [`./plan.md`](./plan.md)

---

## Task Format

```
- [ ] T### [P?] [USx?] Description | path/to/file.ts
```

- **[P]**: parallelizable (different files, no ordering dependency).
- **[USx]**: maps to a user story (US1..US8) from `spec.md`.
- Node IDs in parentheses reference Figma nodes from `spec.md` § UI/UX Requirements.
- **Assumes Homepage Phase-2 foundation (typed `_client.ts`, `useFocusTrap`, `Toast`, `Skeleton`, `IconButton`, `Dropdown`) is already merged** — those tasks are not duplicated here.

---

## Phase 1: Setup

- [ ] T001 [P] Add `d3-cloud` + `d3-selection` (or equivalent) as **lazy** deps in `package.json` and confirm they only appear in the Spotlight chunk after `pnpm build` | `frontend/package.json`
- [ ] T002 [P] Pull screen assets (banner `2940:13437`, kudo card thumbnails, sender/receiver avatars, "Mở quà" icon `2940:13497`, carousel arrows `2940:13468`/`2940:13470`, hashtag-chip styles) into `/public/img/kudos/` | `frontend/public/img/kudos/`
- [ ] T003 Extend Tailwind config with feed/carousel/sidebar breakpoint utilities `(< 768 / 768-1280 / ≥ 1280)` | `frontend/tailwind.config.ts`

---

## Phase 2: Foundation (Kudos-specific; assumes Homepage Phase-2 already merged)

- [ ] T010 [P] Implement `lib/api/kudos.ts` — `listKudos`, `listHighlights`, `getSpotlight`, `getKudosStats`, `toggleLike(id, currentLiked)` | `frontend/lib/api/kudos.ts`
- [ ] T011 [P] Implement `lib/api/hashtags.ts#listHashtags()` + `lib/api/departments.ts#listDepartments()` | `frontend/lib/api/hashtags.ts`, `frontend/lib/api/departments.ts`
- [ ] T012 [P] Implement `lib/api/users.ts#getUser(id)` | `frontend/lib/api/users.ts`
- [ ] T013 [P] Implement `lib/hooks/useDebouncedValue.ts` | `frontend/lib/hooks/useDebouncedValue.ts`
- [ ] T014 [P] Implement `lib/hooks/useIntersectionObserver.ts` (sentinel-based) | `frontend/lib/hooks/useIntersectionObserver.ts`
- [ ] T015 [P] Implement `lib/hooks/useVisibilityState.ts` (single subscription) | `frontend/lib/hooks/useVisibilityState.ts`
- [ ] T016 Implement `components/feature/kudos/LikesProvider.tsx` (Context + reducer) | `frontend/components/feature/kudos/LikesProvider.tsx`
- [ ] T017 Implement `app/kudos/layout.tsx` — calls `getMe()`; on null → `redirect('/login?next=/kudos')`; renders `{children}` and `{modal}` parallel slot | `frontend/app/kudos/layout.tsx`
- [ ] T018 [P] Implement `app/kudos/loading.tsx` (skeleton: banner + 5 carousel slides + 5 feed cards + sidebar shimmer) | `frontend/app/kudos/loading.tsx`
- [ ] T019 [P] Implement `app/kudos/error.tsx` | `frontend/app/kudos/error.tsx`
- [ ] T020 [P] Implement `components/ui/Lightbox.tsx` (focus trap, `Esc`, `←/→`) | `frontend/components/ui/Lightbox.tsx`

**Vitest unit tests** (TDD before implementation of T010/T016):

- [ ] T030 [P] Vitest: `lib/api/kudos.ts#toggleLike` selects `POST` when `currentLiked=false`, `DELETE` when true; surfaces `403 kudo/cannot_like_own` | `frontend/lib/api/kudos.test.ts`
- [ ] T031 [P] Vitest: `LikesProvider` reducer — optimistic flip, server reconcile (`hearts_added: 2`), error rollback | `frontend/components/feature/kudos/LikesProvider.test.ts`
- [ ] T032 [P] Vitest: `useDebouncedValue` (500ms heart debounce, 300ms search debounce) | `frontend/lib/hooks/useDebouncedValue.test.ts`

**Checkpoint**: kudos foundation ready.

---

## Phase 3: User Story 1 — Browse the Kudos feed (P1)

**Goal**: render initial feed + infinite scroll + empty state.
**Independent Test**: `spec.md` US1 Independent Test (seed 25 kudos, assert pagination).

- [ ] T100 [TEST-FIRST] [US1] Playwright E2E for US1 acceptance scenarios 1–5 (initial 20 + scroll-append + empty + 401 redirect + anonymous mask) | `frontend/tests/e2e/kudos.feed.spec.ts`
- [ ] T101 [P] [US1] Build `KudoCard.tsx` RSC shell (sender/receiver `B.3.1/B.3.5 / 256:4734`, time `C.3.4 / 256:5229`, message `C.3.5 / 256:5155` with "Xem thêm" clamp at 6 lines) | `frontend/components/feature/kudos/KudoCard.tsx`
- [ ] T102 [P] [US1] Build `ImageGallery.tsx` (up to 5 tiles `C.3.6 / 256:5176`; lightbox click) | `frontend/components/feature/kudos/ImageGallery.tsx`
- [ ] T103 [US1] Build `FeedSection.tsx` (Client; IntersectionObserver sentinel; reducer for `{ items, nextCursor }`; 30s poll loop gated on `visibilityState` + `isUserScrolling`; redirects on 401; backs off on 429) | `frontend/components/feature/kudos/FeedSection.tsx`
- [ ] T104 [P] [US1] Build `EmptyState.tsx` ("Hiện tại chưa có Kudos nào." / "Chưa có dữ liệu") | `frontend/components/feature/kudos/EmptyState.tsx`
- [ ] T105 [US1] Wire `app/kudos/page.tsx` to RSC-fetch first feed page + hashtags + departments + stats in parallel and pass props down | `frontend/app/kudos/page.tsx`
- [ ] T106 [P] [US1] Build `KudosBanner.tsx` (RSC; node `A / 2940:13437`) | `frontend/components/feature/kudos/KudosBanner.tsx`

**Checkpoint**: signed-in user sees first 20 cards in DESC, scrolls to fetch next page, empty state shows when seeded empty.

---

## Phase 4: User Story 2 — Highlight carousel top 5 (P1)

- [ ] T200 [TEST-FIRST] [US2] Playwright E2E for US2 acceptance scenarios 1–5 (5 slides, arrow disable, prev/next, refetch on filter change, hide when 0) | `frontend/tests/e2e/kudos.highlights.spec.ts`
- [ ] T201 [US2] Build `HighlightCarousel.tsx` (Client; slides `B.2.3 / 2940:13463`; arrows `B.2.1`/`B.2.2`; dots `B.5 / 2940:13471`; keyboard `ArrowLeft/Right`; refetch on filter change) | `frontend/components/feature/kudos/HighlightCarousel.tsx`
- [ ] T202 [US2] Build `HighlightSection.tsx` (RSC wrapper with own Suspense boundary per TR-005; reuses `KudoCard.tsx`) | `frontend/components/feature/kudos/HighlightSection.tsx`

---

## Phase 5: User Story 3 — Filter by hashtag and department (P1)

- [ ] T300 [TEST-FIRST] [US3] Playwright E2E for US3 acceptance scenarios 1–6 (dropdown → URL → refetch both endpoints; chip click; shareable URL) | `frontend/tests/e2e/kudos.filters.spec.ts`
- [ ] T301 [P] [US3] Build `HashtagFilter.tsx` (Client; `B.1.1 / 2940:13459`; typeahead; `router.replace({ scroll: false })`) | `frontend/components/feature/kudos/HashtagFilter.tsx`
- [ ] T302 [P] [US3] Build `DepartmentFilter.tsx` (Client; `B.1.2 / 2940:13460`) | `frontend/components/feature/kudos/DepartmentFilter.tsx`
- [ ] T303 [P] [US3] Build `HashtagChip.tsx` (Client; `B.4.3`/`C.3.7`; click → `?hashtag=<slug>`) | `frontend/components/feature/kudos/HashtagChip.tsx`
- [ ] T304 [US3] Wire `FeedSection.tsx` + `HighlightCarousel.tsx` to refetch on `searchParams` change | `frontend/components/feature/kudos/FeedSection.tsx`, `frontend/components/feature/kudos/HighlightCarousel.tsx`
- [ ] T305 [P] [US3] Vitest: URL-sync helper preserves other params on partial change | `frontend/lib/hooks/useFilterParams.test.ts`

---

## Phase 6: User Story 4 — Like / unlike (P1)

- [ ] T400 [TEST-FIRST] [US4] Playwright E2E for US4 acceptance scenarios 1–6 (optimistic flip, disabled own-kudos, debounce, hearts_added=2 reconcile, rollback on 403) | `frontend/tests/e2e/kudos.like.spec.ts`
- [ ] T401 [US4] Build `HeartButton.tsx` (Client; `C.4.1 / 256:5175`; `aria-pressed`; consumes `LikesProvider`; 500ms debounce; disabled when `viewer_is_sender`) | `frontend/components/feature/kudos/HeartButton.tsx`
- [ ] T402 [US4] Build `ActionsRow.tsx` (composes Heart + Copy + Detail link; `C.4 / 256:5194`) | `frontend/components/feature/kudos/ActionsRow.tsx`
- [ ] T403 [US4] Mount `LikesProvider` at `app/kudos/page.tsx` boundary so both feed cards and carousel cards share state | `frontend/app/kudos/page.tsx`
- [ ] T404 [P] [US4] Playwright load-test: 10 toggles in 1s yields ≤ 2 network calls (SC-007) | `frontend/tests/e2e/kudos.like.race.spec.ts`

---

## Phase 7: User Story 5 — Copy share link (P2)

- [ ] T500 [TEST-FIRST] [US5] Playwright E2E for US5 acceptance scenarios 1–2 (clipboard write + toast; fallback path) | `frontend/tests/e2e/kudos.copyLink.spec.ts`
- [ ] T501 [US5] Build `CopyLinkButton.tsx` (Client; `C.4.2 / 256:5216`; uses `navigator.clipboard.writeText`; fallback hidden-textarea + `document.execCommand('copy')`; success toast "Link copied — ready to share!") | `frontend/components/feature/kudos/CopyLinkButton.tsx`

---

## Phase 8: User Story 6 — Spotlight word-cloud (P2)

- [ ] T600 [TEST-FIRST] [US6] Playwright E2E for US6 acceptance scenarios 1–7 (initial render + total badge + debounced search + maxlength + pan/zoom toggle + click → detail + loading/empty) | `frontend/tests/e2e/kudos.spotlight.spec.ts`
- [ ] T601 [US6] Build `SpotlightPane.tsx` (Client, **dynamically imported `{ ssr: false }`** from `FeedSection` toggle; `B.7 / 2940:14174`) | `frontend/components/feature/kudos/SpotlightPane.tsx`
- [ ] T602 [P] [US6] Build `SpotlightSearch.tsx` (`B.7.3 / 2940:14833`; `maxLength=100`; 300ms debounce) | `frontend/components/feature/kudos/SpotlightSearch.tsx`
- [ ] T603 [P] [US6] Build `SpotlightCloud.tsx` (canvas/SVG using lazy `d3-cloud`; parallel visually-hidden `<ul>` for SR) | `frontend/components/feature/kudos/SpotlightCloud.tsx`
- [ ] T604 [P] [US6] Build `SpotlightTotalBadge.tsx` (`B.7.1 / 3007:17482`; `aria-live="polite"`) | `frontend/components/feature/kudos/SpotlightTotalBadge.tsx`
- [ ] T605 [P] [US6] Build `PanZoomToggle.tsx` (`B.7.2 / 3007:17479`) | `frontend/components/feature/kudos/PanZoomToggle.tsx`
- [ ] T606 [P] [US6] Vitest: spotlight reducer handles `X-Truncated: true` header → "Hiển thị 500 Sunner đầu" | `frontend/components/feature/kudos/SpotlightPane.test.ts`

---

## Phase 9: User Story 7 — Sidebar stats + leaderboards + Secret Box (P2)

- [ ] T700 [TEST-FIRST] [US7] Playwright E2E for US7 acceptance scenarios 1–4 (stats render, leaderboard click → profile, Mở quà → intercepted modal, empty placeholder) | `frontend/tests/e2e/kudos.sidebar.spec.ts`
- [ ] T701 [P] [US7] Build `SidebarStats.tsx` (RSC shell; `D.1 / 2940:13489`; numbers `D.1.2..D.1.7`) | `frontend/components/feature/kudos/SidebarStats.tsx`
- [ ] T702 [P] [US7] Build `Leaderboard.tsx` (RSC; rows `D.3.2..D.3.6 / 2940:13516..2940:13520`; click → `/users/<id>`) | `frontend/components/feature/kudos/Leaderboard.tsx`
- [ ] T703 [P] [US7] Build `SecretBoxTrigger.tsx` (Client; `D.1.8 / 2940:13497`; `router.push('/kudos/secret-box')`) | `frontend/components/feature/kudos/SecretBoxTrigger.tsx`
- [ ] T704 [US7] Implement parallel modal slot `app/@modal/secret-box/page.tsx` (intercepted-route stub; real body owned by `J3-4YFIpMM`) | `frontend/app/@modal/secret-box/page.tsx`
- [ ] T705 [US7] Mount `{modal}` slot in `app/layout.tsx` so Secret Box overlays without re-mounting `/kudos` | `frontend/app/layout.tsx`
- [ ] T706 [P] [US7] Subscribe `SidebarStats` to `kudo:created` window event for refresh (FR-015) | `frontend/components/feature/kudos/SidebarStats.tsx`

---

## Phase 10: User Story 8 — Quick-input pill opens Viết Kudo (P3, UI wiring only)

- [ ] T800 [TEST-FIRST] [US8] Playwright E2E (click/Enter/Space opens dialog stub; return focus to pill on close; success event refreshes feed + highlights) | `frontend/tests/e2e/kudos.quickInput.spec.ts`
- [ ] T801 [US8] Build `QuickInputPill.tsx` (Client; `A.1 / 2940:13449`; real `<button aria-haspopup="dialog">`; dispatches `kudo:open-new-dialog`) | `frontend/components/feature/kudos/QuickInputPill.tsx`
- [ ] T802 [US8] Wire `FeedSection` + `HighlightCarousel` to refetch on `kudo:created` window event | `frontend/components/feature/kudos/FeedSection.tsx`

---

## Phase 11: Polish

- [ ] T900 [P] Bundle audit: word-cloud lib must be in a separate chunk, not in the `/kudos` initial chunk (SC-002) | `frontend/scripts/check-bundle.mjs`
- [ ] T901 [P] Lighthouse a11y ≥ 92 on `/kudos` (SC-005) | `frontend/.github/workflows/lighthouse.yml`
- [ ] T902 [P] Manual keyboard pass: Tab + Arrow keys complete the feed traversal | `frontend/.momorph/specs/MaZUn5xHXZ-kudos-live-board/qa.md`
- [ ] T903 [P] Profile hover-preview tooltip with 300ms delay + AbortController (Edge case) | `frontend/components/feature/kudos/ProfileHoverCard.tsx`
- [ ] T904 [P] Rate-limit toast + ×2 backoff on 429 across feed poll and spotlight (FR-020) | `frontend/components/feature/kudos/FeedSection.tsx`, `frontend/components/feature/kudos/SpotlightPane.tsx`
- [ ] T905 Commit `feat(ui): implement kudos live board` (single commit per Constitution V) | n/a

---

## Dependencies & execution order

- Phase 1 → Phase 2 → Phases 3..10 (parallelizable per Constitution III gate).
- `LikesProvider` (T016) blocks Phase 6 (US4).
- Phase 9 modal slot (T704/T705) blocks the Secret Box E2E from `J3-4YFIpMM` spec.
- Phase 11 runs last; T905 blocked until every `[TEST-FIRST]` test is green.

### Parallel opportunities

- All Phase-2 `[P]` foundation tasks (T010..T020) — independent files.
- US1..US7 component tasks marked `[P]` can start in parallel after their Playwright spec lands red.
- Phase 11 audits (T900..T904) run concurrently in CI.
