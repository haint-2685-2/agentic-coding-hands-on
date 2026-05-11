# Tasks: Viết Kudo (Server-Side)

**Frame**: `ihQ26W78P2-viet-kudo`
**Prerequisites**: Live Board implementation complete (depends on its kudo/hashtag/image tables).

---

## Phase 1: Migrations

- [ ] T001 Migration `20260513090000_alter_kudo_anonymous.sql` — add `anonymous_display_name text null` (CHECK 1..50) + `mentions uuid[] not null default '{}'` on `kudo`; tighten message CHECK 1..1000 | `supabase/migrations/...`
- [ ] T002 Migration `20260513090001_alter_kudo_image_meta.sql` — add `mime text not null` (CHECK in `image/jpeg`/`image/png`) + `size_bytes int not null` (CHECK 1..5242880) on `kudo_image` | `supabase/migrations/...`
- [ ] T003 Migration `20260513090002_create_fn_create_kudo.sql` — RPC implementing AD-1; REVOKE direct INSERT from `authenticated` role | `supabase/migrations/...`
- [ ] T004 Storage policies `storage/policies/kudos_bucket.sql` — `kudos` bucket private; users can INSERT/SELECT/DELETE under `kudos/<auth.uid()>/*` only | `supabase/storage/policies/kudos_bucket.sql`
- [ ] T005 Verify `supabase db reset && supabase test db` GREEN. Manual: create bucket via Supabase Dashboard or `supabase storage create kudos --public=false`. | (no file)

**Checkpoint**: DB ready; storage bucket configured.

---

## Phase 2: Pure-function utilities (TDD)

- [ ] T006 [P] Write `_shared/mentions.ts` skeleton + `unit/mentions.test.ts` (10 cases — empty, single, multiple, dupes, diacritics, sender/receiver exclusion). **RED → GREEN** | files |
- [ ] T007 [P] Write `_shared/hashtag-normalise.ts` skeleton + `unit/hashtag-normalise.test.ts` (VN tones; lowercase; spaces→`-`; reject all-punct; 32-char cap). **RED → GREEN** | files |
- [ ] T008 [P] Write `_shared/dedup.ts` skeleton (LRU + sha256) + `unit/dedup.test.ts` (insert/hit/expire/eviction). **RED → GREEN** | files |

---

## Phase 3: US2 — Users typeahead

- [ ] T009 [US2] Write `vietkudo_us2_typeahead.test.ts` — AC1 ranked by similarity; AC2 trim whitespace; AC3 empty q → []; AC4 caller excluded; AC5 inactive excluded; AC6 special chars → []. **RED** | `supabase/tests/integration/...`
- [ ] T010 [US2] Write `supabase/functions/users/index.ts` — Zod `?q=string.max(100)`, `?limit=number.int().min(1).max(50).default(10)`; normalise + SQL `ILIKE`; rank by `similarity()` (pg_trgm) | `supabase/functions/users/index.ts`
- [ ] T011 [US2] Enable `pg_trgm` extension in a small migration (or check Live Board already did it) | `supabase/migrations/...` (only if new)

---

## Phase 4: US5 — Image upload pipeline

- [ ] T012 [US5] Write `vietkudo_us5_image_upload.test.ts` — AC1 presign URL; AC2 valid JPG/PNG upload→create OK; AC3 .pdf → 422; AC4 .mp4 → 422; AC5 size > 5MB → 422; AC6 foreign namespace path → 403; AC7 >5 images → 422. **RED** | `supabase/tests/integration/...`
- [ ] T013 [US5] Write `supabase/functions/kudos-upload-url/index.ts` — Zod `{content_type: z.enum(['image/jpeg','image/png'])}`; returns presigned upload URL + path | `supabase/functions/kudos-upload-url/index.ts`
- [ ] T014 [US5] Write `_shared/storage-verify.ts` — `verifyImagePaths(paths: string[], userId: uuid): Promise<{path, mime, size_bytes}[] | throws>`; uses `supabase.storage.from('kudos').list(...)` to read metadata | `supabase/functions/_shared/storage-verify.ts`

---

## Phase 5: US1 — Create kudo happy path (P1)

- [ ] T015 [US1] Write `vietkudo_us1_happy_path.test.ts` — AC1 201 with id; AC2 image paths attached; AC3 hashtag reuse + create; AC4 anonymous flag stored; AC5 receiver notification produced; mention notification(s) produced. **RED** | `supabase/tests/integration/...`
- [ ] T016 [US1] Extend `supabase/functions/kudos/index.ts` to handle `POST` (the existing GET handler stays). Steps: (1) Zod parse; (2) `verifyImagePaths`; (3) `extractMentions` + `resolveMentions`; (4) check dedup LRU; (5) `supabase.rpc('fn_create_kudo', {...})`; (6) update dedup LRU. | `supabase/functions/kudos/index.ts`

---

## Phase 6: US3 — Validation negative tests (P1)

- [ ] T017 [US3] Write `vietkudo_us3_validation.test.ts` — AC1-7 required/length/self-receiver/inactive-receiver; AC8 field-order in error response. **Mostly already provoked by US1's negative paths**; this file groups them into one explicit suite. **RED** | `supabase/tests/integration/...`
- [ ] T018 [US3] If T017 reveals gaps in Zod schema, refine `kudos/index.ts` POST | same file

---

## Phase 7: US4 — Mention extraction → notifications (P2)

- [ ] T019 [US4] Write `vietkudo_us4_mentions.test.ts` — AC1 dedupe + notify each; AC2 sender/receiver excluded from mention-notifications; AC3 unresolved silently ignored; AC4 mention failure doesn't block create. | `supabase/tests/integration/...`
- [ ] T020 [US4] (if needed) refine `_shared/mentions.ts` based on integration test outcome | same file

---

## Phase 8: US6 — Hashtag autocomplete extension (P2)

- [ ] T021 [US6] Write `vietkudo_us6_hashtag_autocomplete.test.ts` — `?q=team` prefix; normalisation collision (first-write-wins); invalid slug → 422 | `supabase/tests/integration/...`
- [ ] T022 [US6] Extend `supabase/functions/hashtags/index.ts` to accept `?q=` prefix filter (already noted in Live Board T017; this task closes that loop if not done) | same file

---

## Phase 9: US7 — Rate-limit + dedup (P2)

- [ ] T023 [US7] Write `vietkudo_us7_rate_limit.test.ts` — AC1 11th call/min → 429; AC2 4th call to same receiver/min → 429; AC3 identical payload within 60s → 409 | `supabase/tests/integration/...`
- [ ] T024 [US7] Wire rate-limit + dedup into `kudos/index.ts` POST | same file

---

## Phase 10: Polish

- [ ] T025 [P] Doc the orphan-storage-cleanup follow-up — open a TODO in `docs/followups.md` (or skip since out-of-scope) | (optional)
- [ ] T026 Final suite green. | (no file)

---

## Dependencies & Execution Order

```
T001..T004 → T005 (foundation)
   ↓
T006 || T007 || T008 (unit utilities parallel)
   ↓
US2: T009 → T010 → T011
   ↓
US5: T012 → T013 || T014
   ↓
US1: T015 → T016        (depends on T010, T013, T014, T006, T008)
   ↓
US3: T017 → T018
US4: T019 → T020
US6: T021 → T022
US7: T023 → T024
T025 || T026
```

---

## Commit Strategy

One commit: `feat: implement viet kudo (POST /kudos transactional RPC, upload-url, /users typeahead, mentions, dedup, rate-limit)`.

---

## Notes

- The `fn_create_kudo` is the biggest single piece of SQL in the project — write it slowly, with comments per step. The notification inserts at the end are easy to forget under transaction context.
- Image fixtures: keep them tiny (1x1 px) so the test repo stays small.
- The `pg_trgm` extension may need a separate migration if Live Board didn't enable it — check before T011.
