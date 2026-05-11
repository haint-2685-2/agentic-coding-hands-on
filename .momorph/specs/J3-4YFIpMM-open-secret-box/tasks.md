# Tasks: Open Secret Box (Server-Side)

**Frame**: `J3-4YFIpMM-open-secret-box`
**Prerequisites**: Login implementation complete.

---

## Phase 1: Foundation

- [ ] T001 Migration `20260515090000_create_badge.sql` — table + slug regex + RLS (auth SELECT, admin write) + seed 6 badges with `drop_weight` (30/25/20/10/10/5) | `supabase/migrations/...`
- [ ] T002 Migration `20260515090001_create_secret_box.sql` — table + indexes (partial unopened + opened history) + RLS + `fn_pick_badge(roll int)` + `fn_open_secret_box()` SECURITY DEFINER + `REVOKE/GRANT` ladder | `supabase/migrations/...`
- [ ] T003 [P] pgTAP `badge_rls.test.sql` — auth SELECT OK; admin UPDATE; non-admin UPDATE denied | `supabase/tests/db/...`
- [ ] T004 [P] pgTAP `secret_box_rls.test.sql` — self select/update; no client insert/delete | `supabase/tests/db/...`
- [ ] T005 Verify `supabase db reset && supabase test db`. | (no file)

---

## Phase 2: Shared utility

- [ ] T006 [P] Write `_shared/badge-shape.ts` — `toBadgeJSON(row, locale)` projecting localised name + description + fallback | `supabase/functions/_shared/badge-shape.ts`

---

## Phase 3: US3 — Read counters + history (P2)

- [ ] T007 [US3] Write `secretbox_us3_read.test.ts` — AC1 counters present; AC2 empty state; AC3 caching consistency (GET after POST matches POST response). **RED** | `supabase/tests/integration/...`
- [ ] T008 [US3] Write `supabase/functions/me-secret-boxes/index.ts` GET branch — counters + history (last 20 opened) | `supabase/functions/me-secret-boxes/index.ts`

---

## Phase 4: US1 — Open a box (P1)

- [ ] T009 [US1] Write `secretbox_us1_open.test.ts` — AC1 200 with badge + decrement; AC2 409 no_boxes; AC3 401 unauth; AC4 403 disabled. **RED** | `supabase/tests/integration/...`
- [ ] T010 [US1] Add POST branch to `me-secret-boxes/index.ts` — Zod `z.object({}).strict()` body; call `supabase.rpc('fn_open_secret_box')`; map `P0002` sqlstate → 409 `secret_box/no_boxes` | same file

---

## Phase 5: Concurrency test (US1 AC5)

- [ ] T011 [US1] Write `secretbox_concurrency.test.ts` — open 2 concurrent `POST /open` with 1 unopened box; assert exactly one 200 and one 409. **RED → GREEN via `SKIP LOCKED`** | `supabase/tests/integration/...`

---

## Phase 6: US2 — Distribution test (P1, slow lane)

- [ ] T012 [US2] Write `secretbox_us2_distribution.test.ts` — seed 10_000 unopened boxes; loop open; aggregate badge counts; χ² test against expected (3000/2500/2000/1000/1000/500); pass at p>0.05. Tag `@slow`. | `supabase/tests/integration/...`

---

## Phase 7: Polish

- [ ] T013 [P] Fuzz test: POST `/open` with `{ badge_code: "anything" }` → assert 422 `validation/unknown_keys` (Zod `.strict()`) | inline in `secretbox_us1_open.test.ts`
- [ ] T014 Final suite green (excluding `@slow` for default run). | (no file)

---

## Dependencies & Execution Order

```
T001 → T002 → T003 || T004 → T005
   ↓
T006
   ↓
US3: T007 → T008
   ↓
US1: T009 → T010
   ↓
T011 (concurrency)
US2: T012 (slow lane)
T013 || T014 (polish)
```

---

## Commit Strategy

One commit: `feat: implement open secret box (badge catalog, SKIP LOCKED open RPC, distribution test)`.

---

## Notes

- The grant feature is OUT OF SCOPE; seed via SQL fixture in tests.
- The `@slow` tag convention: skip in `deno test` unless `SLOW=1` env var is set. Configure in `tests/_shared/deno-test-runner.ts` if it doesn't already exist.
- After Secret Box lands, Phase 2 is fully done — sum to ~140 tasks across 6 screens.
