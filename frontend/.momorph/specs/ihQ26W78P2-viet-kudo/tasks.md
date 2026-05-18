# Tasks: Viết Kudo (Frontend)

**Frame**: `ihQ26W78P2-viet-kudo`
**Prerequisites**: [`plan.md`](./plan.md), [`spec.md`](./spec.md)
**Date**: 2026-05-12

---

## Task Format

```
- [ ] T### [P?] [USx?] Description | path/to/file.ts
```

- `[P]` — parallelizable (different files, no dependencies)
- `[USx]` — user story label
- `|` — file path affected

---

## Phase 1: Setup

- [ ] T001 [P] Pin RHF + zod + `@hookform/resolvers` in package.json | frontend/package.json
- [ ] T002 [P] Pin `@radix-ui/react-dialog` + `@radix-ui/react-popover` in package.json | frontend/package.json
- [ ] T003 [P] Pin `clsx` + `tailwind-merge` for variant composition | frontend/package.json
- [ ] T004 [P] Add Vitest + Testing Library config | frontend/vitest.config.ts
- [ ] T005 [P] Add Playwright config + auth fixture scaffold | frontend/playwright.config.ts, frontend/tests/e2e/_fixtures/auth.ts

---

## Phase 2: Foundation (Blocking)

**⚠️ CRITICAL — no US task may start until this phase completes.**

- [ ] T010 Create shared `fetchJson` API client with Bearer-token injection + BE error-shape passthrough | frontend/lib/api/_client.ts
- [ ] T011 [P] Implement `getMe()` | frontend/lib/api/me.ts
- [ ] T012 [P] Implement `searchUsers(q, signal)` | frontend/lib/api/users.ts
- [ ] T013 [P] Implement `searchHashtags(q, signal)` | frontend/lib/api/hashtags.ts
- [ ] T014 [P] Implement `requestUploadUrl` + `uploadImage` + `createKudo` | frontend/lib/api/kudos.ts
- [ ] T015 [P] Define `KudoFormSchema` (zod mirror of BE FR-001) | frontend/lib/schemas/kudo.ts
- [ ] T016 [P] Add `useDebouncedValue` hook | frontend/lib/hooks/useDebouncedValue.ts
- [ ] T017 [P] Add `useUploadPool` hook (concurrency cap = 3, TR-005) | frontend/lib/hooks/useUploadPool.ts
- [ ] T018 [P] Add `useMentionTrigger` hook (caret + prefix detection) | frontend/lib/hooks/useMentionTrigger.ts
- [ ] T019 [P] Add `applyInlineMark` utility for toolbar (`**`, `*`, `~~`, `1. `, `> `, `[](url)`) | frontend/lib/markdown/applyInlineMark.ts
- [ ] T020 [P] Build UI primitive: `Dialog` (Radix wrapper, focus trap, scroll lock) | frontend/components/ui/Dialog.tsx
- [ ] T021 [P] Build UI primitive: `Combobox` (ARIA 1.2 keyboard model) | frontend/components/ui/Combobox.tsx
- [ ] T022 [P] Build UI primitives: `Chip`, `FieldError`, `Spinner` | frontend/components/ui/Chip.tsx, FieldError.tsx, Spinner.tsx
- [ ] T023 [P] Build UI primitive: `Toolbar` + `ToggleButton` (roving tabindex) | frontend/components/ui/Toolbar.tsx, ToggleButton.tsx
- [ ] T024 [P] Build UI primitive: `Toast` + `ToastProvider` | frontend/components/ui/Toast.tsx
- [ ] T025 Create RSC shell at `app/kudos/new/page.tsx` with `getMe` auth gate → 401 `redirect('/login?next=/kudos/new')` | frontend/app/kudos/new/page.tsx
- [ ] T026 Create intercepted-route shell `app/@modal/(.)kudos/new/page.tsx` (RSC overlay) | frontend/app/@modal/(.)kudos/new/page.tsx
- [ ] T027 Mount `<ToastProvider>` in root layout | frontend/app/layout.tsx

**Checkpoint**: foundation ready; user stories may begin in parallel.

---

## Phase 3: User Story 1 — Open + compose + submit (P1) 🎯 MVP

**Goal**: Authenticated user can open the modal, fill all required fields, submit, and see success toast.

**Independent test**: Playwright `kudo-compose.spec.ts > "submits a valid kudo"`.

### Frontend (US1)

- [ ] T030 [US1] Implement `KudoComposeDialog` shell + RHF form provider + abort controller | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T031 [US1] Implement `ComposerFooter` (Hủy / Gửi, disabled-state derivation, spinner) | frontend/components/feature/kudo/ComposerFooter.tsx
- [ ] T032 [US1] Wire `?kudo=new` open-state via `useSearchParams` + `router.replace` on close | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T033 [US1] Implement submit handler — call `createKudo`, map error → inline/toast, success toast "Đã gửi Kudo" | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T034 [US1] Handle 401 at modal open via parent RSC auth gate (no client redirect needed; covered by T025/T026) | frontend/app/kudos/new/page.tsx

### Tests (US1)

- [ ] T035 [P] [US1] Vitest — `KudoFormSchema` valid + invalid payloads | frontend/tests/unit/kudo-schema.test.ts
- [ ] T036 [US1] Playwright — open from Homepage trigger, fill receiver + message + 1 hashtag, submit, assert toast + POST body (AC2) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T037 [US1] Playwright — disabled `Gửi` until valid (AC3) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T038 [US1] Playwright — anon URL `/kudos/new` → redirected to `/login?next=/kudos/new` (AC4) | frontend/tests/e2e/kudo-compose.spec.ts

**Checkpoint**: US1 complete; MVP-ready.

---

## Phase 4: User Story 2 — Receiver typeahead (P1)

- [ ] T040 [US2] Implement `ReceiverField` Combobox using `lib/api/users.searchUsers` + 250 ms debounce | frontend/components/feature/kudo/ReceiverField.tsx
- [ ] T041 [US2] Implement query-trim before request (AC4) | frontend/components/feature/kudo/ReceiverField.tsx
- [ ] T042 [US2] Render empty-state row "Không tìm thấy thành viên" (AC3) | frontend/components/ui/Combobox.tsx
- [ ] T043 [P] [US2] Playwright — type "Nguyễn", keyboard select, assert chip + form state (AC1, AC2, AC5) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T044 [P] [US2] Playwright — whitespace/no-match → empty state, Gửi stays disabled (AC3, AC4) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 5: User Story 3 — Required-field validation (P1)

- [ ] T050 [US3] Hook RHF `errors` into `FieldError` + `aria-describedby` for receiver/message/hashtag | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T051 [US3] On invalid submit move focus to first invalid field (DOM order) | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T052 [US3] Map BE `422 { error: { code, fields } }` → inline at `fields[0]`; unknown code → generic toast | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T053 [P] [US3] Vitest — RHF + Zod returns required errors matching BE shape | frontend/tests/unit/kudo-schema.test.ts
- [ ] T054 [P] [US3] Playwright — empty submit attempts surface 3 inline errors + focus jumps to receiver (AC1–AC4) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T055 [P] [US3] Playwright — BE 422 with `fields:['message']` renders message under textarea (AC5) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 6: User Story 4 — Hashtag chips (P1)

- [ ] T060 [US4] Implement `HashtagField` chip row + `+ Hashtag` trigger | frontend/components/feature/kudo/HashtagField.tsx
- [ ] T061 [US4] Implement `HashtagPicker` popover Combobox sourced by `searchHashtags` | frontend/components/feature/kudo/HashtagPicker.tsx
- [ ] T062 [US4] Enforce 1..5 cap; hide `+ Hashtag` at 5; show inline note "Tối đa 5 hashtag" | frontend/components/feature/kudo/HashtagField.tsx
- [ ] T063 [US4] Remove chip via `x`; re-show `+ Hashtag` when count drops below 5 | frontend/components/feature/kudo/HashtagField.tsx
- [ ] T064 [P] [US4] Playwright — add 5 chips → `+` hidden; remove one → `+` reappears (AC3, AC4) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T065 [P] [US4] Playwright — BE `validation/hashtag_slug` renders inline + removes offender (AC5) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 7: User Story 5 — Image attachments (P1)

- [ ] T070 [US5] Implement `ImageField` + `ImageThumbnail` with progress + `x` remove | frontend/components/feature/kudo/ImageField.tsx, ImageThumbnail.tsx
- [ ] T071 [US5] Client-side filter: MIME ∈ {jpeg, png} && size ≤ 5 MB; reject → toast per file (AC1) | frontend/components/feature/kudo/ImageField.tsx
- [ ] T072 [US5] Drive uploads through `useUploadPool` (concurrency = 3); on PUT success push path to `image_paths[]` (AC2) | frontend/components/feature/kudo/ImageField.tsx
- [ ] T073 [US5] Hide `+ Image` at 5; reappear on remove (AC3, AC4) | frontend/components/feature/kudo/ImageField.tsx
- [ ] T074 [US5] On upload failure remove the in-flight tile + toast "Tải ảnh thất bại, vui lòng thử lại" (AC5) | frontend/components/feature/kudo/ImageField.tsx
- [ ] T075 [P] [US5] Vitest — `useUploadPool` enforces cap of 3 + propagates abort | frontend/tests/unit/useUploadPool.test.ts
- [ ] T076 [P] [US5] Playwright — 3 valid jpgs accepted; pdf rejected with toast (AC1, AC2) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T077 [P] [US5] Playwright — upload PUT 5xx → toast + tile removed (AC5) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 8: User Story 9 — Cancel / Escape (P1)

- [ ] T080 [US9] `Hủy` handler resets form + aborts in-flight uploads (AbortController) | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T081 [US9] `Escape` triggers Hủy with `confirm()` if form dirty (AC2) | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T082 [US9] On close: `router.back()` if intercepted, else `router.push('/')` + clear `?kudo` param | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T083 [P] [US9] Playwright — Hủy aborts upload + closes; focus returns to opener (AC1, AC3) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T084 [P] [US9] Playwright — Escape with dirty form prompts confirm (AC2) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 9: User Story 6 — `@mention` autocomplete (P2)

- [ ] T090 [US6] Implement `MentionPopover` anchored at caret using mirror-div coords | frontend/components/feature/kudo/MentionPopover.tsx
- [ ] T091 [US6] `useMentionTrigger` detects `@<prefix>` (≥1 char) and exposes start/end offsets | frontend/lib/hooks/useMentionTrigger.ts
- [ ] T092 [US6] On selection insert `@<full_name> ` replacing `@<prefix>`; close popover | frontend/components/feature/kudo/MessageEditor.tsx
- [ ] T093 [P] [US6] Playwright — type `Cảm ơn @Nguy` → popover; ArrowDown + Enter inserts name (AC1, AC3) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T094 [P] [US6] Playwright — unresolved `@xyz_unknown` submit succeeds (AC4) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 10: User Story 7 — Anonymous toggle (P2)

- [ ] T100 [US7] Implement `AnonymousField` checkbox + conditional display-name input | frontend/components/feature/kudo/AnonymousField.tsx
- [ ] T101 [US7] On uncheck clear `anonymousDisplayName` from form state (AC3) | frontend/components/feature/kudo/AnonymousField.tsx
- [ ] T102 [US7] Enforce `maxLength=50` + character counter (AC4) | frontend/components/feature/kudo/AnonymousField.tsx
- [ ] T103 [P] [US7] Playwright — toggle reveals/hides field; submit body carries `is_anonymous` + optional display name | frontend/tests/e2e/kudo-compose.spec.ts

---

## Phase 11: User Story 8 — Rich-text editor (P3)

> **Superseded 2026-05-18** — original textarea-based markdown approach was
> dropped in favour of a contentEditable WYSIWYG that produces sanitized HTML.
> Toolbar and editor merged into `MessageEditor.tsx`; `RichTextToolbar.tsx`
> and `MessageTextarea.tsx` were deleted in the same commit. Tests below are
> obsolete; see notes inline.

- [x] T110 [US8] ~~`RichTextToolbar` (B/I/S/list/link/quote)~~ — replaced by toolbar inlined in `MessageEditor.tsx` (commands use `document.execCommand` against contentEditable instead of Markdown markers on a textarea).
- [x] T111 [US8] ~~Inline link prompt → `[selection](url)`~~ — replaced by `window.prompt` for URL → `document.execCommand('createLink', false, url)`.
- [ ] T112 [P] [US8] ~~Vitest `applyInlineMark`~~ — obsolete (no `applyInlineMark` helper exists). Replace with sanitizer round-trip test for `lib/kudos/sanitize-html.ts`.
- [ ] T113 [P] [US8] ~~Playwright toolbar mutates textarea~~ — obsolete. Replace with Playwright check that B button on selection yields a `<strong>` in `innerHTML` and round-trips through the sanitizer.

### Added 2026-05-18 (was missing from original plan)

- [x] T114 [US9] **Danh hiệu** required field `TitleInput.tsx` (1–80 chars, hint copy from Figma) | frontend/components/feature/kudo-compose/TitleInput.tsx
- [x] T115 [US9] BE migration `20260518100000_add_kudo_title.sql` + recreate `kudo_highlights_v` to expose `title` | backend/supabase/migrations/
- [x] T116 [US9] Wire `title` through validator → `createKudo` payload → BE Zod schema | frontend/lib/validation/kudo.ts
- [x] T117 [US9] Render `title` as `<h3>` centered above message in `KudoCard` | frontend/components/feature/kudos-live/KudoCard.tsx
- [x] T118 [US10] Sanitize-on-read in `KudoCard` (defense in depth vs admin/seed inserts) | frontend/components/feature/kudos-live/KudoCard.tsx
- [x] T119 [US10] Image lightbox modal (Esc / arrows / backdrop close) | frontend/components/feature/kudos-live/KudoCard.tsx
- [x] T11A [US11] Success toast `KudoCreatedToast` via CustomEvent (top-right, 5s, manual close) | frontend/components/feature/kudos-live/KudoCreatedToast.tsx

---

## Phase 12: Polish

- [ ] T120 [P] Edge — char counter for message (live region) + drop 1001st keystroke | frontend/components/feature/kudo/MessageEditor.tsx
- [ ] T121 [P] Edge — `429 rate/limited` toast + disabled-button countdown using `Retry-After` | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T122 [P] Edge — `409 kudo/duplicate` toast keeps modal open + data intact | frontend/components/feature/kudo/KudoComposeDialog.tsx
- [ ] T123 [P] Edge — `422 kudo/self_receiver` + `404 user/not_found` map to receiver field | frontend/components/feature/kudo/ReceiverField.tsx
- [ ] T124 [P] A11y — `@axe-core/playwright` zero serious/critical on open modal (SC-003) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T125 [P] CI grep step — assert no service-role key in bundled chunks (SC-005) | frontend/scripts/check-no-service-role.sh
- [ ] T126 Performance — submit happy-path p95 ≤ 800 ms locally (SC-002) | frontend/tests/e2e/kudo-compose.spec.ts
- [ ] T127 Keyboard-only walkthrough script (SC-004) | frontend/tests/e2e/kudo-compose.spec.ts

---

## Dependencies & Execution Order

- **Phase 1 (Setup)**: independent — all `[P]`.
- **Phase 2 (Foundation)**: blocks all later phases. Within Phase 2, T010 blocks T011–T014; UI primitives T020–T024 are parallel; T025–T026 require T011 (auth probe).
- **Phases 3–11**: each US is parallelizable after Phase 2, but P1 stories (US1/US2/US3/US4/US5/US9) should land before P2 (US6/US7) and P3 (US8).
- **Phase 12 (Polish)**: after all desired US complete.

### Parallel Opportunities

- All `[P]` Setup tasks run together.
- Within Foundation: T011–T024 (different files) run in parallel after T010.
- All Vitest tasks (`tests/unit/*`) run in parallel.
- US Playwright tasks share `kudo-compose.spec.ts` so they serialize on file-write but ACs are independent at runtime.

---

## Implementation Strategy

### MVP First (recommended)

1. Phase 1 + 2.
2. US1 (Phase 3) — submit happy path.
3. US2/US3/US4/US5/US9 (Phases 4–8) — full P1 surface.
4. Validate → deploy.
5. US6/US7 (P2), then US8 (P3) incrementally.

---

## Notes

- Each phase completes with a Conventional-Commit `feat(ui): viet-kudo — <phase summary>` commit. Final screen lands as one squashed `feat(ui): implement viet-kudo` commit per constitution V.
- Mark tasks complete `[x]` as they ship.
