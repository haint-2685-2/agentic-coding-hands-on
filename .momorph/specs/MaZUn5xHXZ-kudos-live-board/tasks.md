# Tasks: Sun* Kudos — Live Board (Server-Side)

**Frame**: `MaZUn5xHXZ-kudos-live-board`
**Prerequisites**: Login + Homepage SAA implementation complete.

---

## Phase 1: Foundation (Migrations)

- [ ] T001 Migration `20260512090000_create_department.sql` — table + seed common Sun* depts (Marketing, R&D, HR, Finance, Operations) + RLS (anon SELECT, admin write) | `supabase/migrations/...`
- [ ] T002 Migration `20260512090001_alter_app_user_dept.sql` — add `department_id` FK on `app_user`; update `fn_provision_app_user` to accept it from Google profile `hd_org_unit` (or default null) | `supabase/migrations/...`
- [ ] T003 Migration `20260512090002_create_hashtag.sql` — table + slug regex CHECK + `usage_count` column with TRIGGER incrementing/decrementing on `kudo_hashtag` insert/delete | `supabase/migrations/...`
- [ ] T004 Migration `20260512090003_create_kudo.sql` — `kudo`, `kudo_hashtag`, `kudo_image` tables + all indexes from spec + RLS (select-all-auth, sender-only insert) | `supabase/migrations/...`
- [ ] T005 Migration `20260512090004_create_kudo_like.sql` — table + composite PK + `fn_kudo_like(uuid)` SECURITY DEFINER RPC (per plan AD-1) | `supabase/migrations/...`
- [ ] T006 Migration `20260512090005_create_special_day.sql` — table + RLS (anon SELECT, admin write) | `supabase/migrations/...`
- [ ] T007 Migration `20260512090006_create_kudo_highlights_mv.sql` — MV + unique index on `id` + `cron.schedule(...)` (per plan AD-2). Include a guard `do $$ if not exists(select 1 from pg_extension where extname='pg_cron') then raise notice '...' end $$;` so the migration is tolerant. | `supabase/migrations/...`
- [ ] T008 [P] pgTAP `kudo_rls.test.sql` — sender-only insert; all-auth select; no client delete | `supabase/tests/db/...`
- [ ] T009 [P] pgTAP `kudo_like_rls.test.sql` — self-only insert/delete; cannot like own (via RPC, not RLS) | `supabase/tests/db/...`
- [ ] T010 pgTAP `kudo_like_concurrency.test.sql` — 2 dblink sessions racing same `INSERT`; assert exactly one row | `supabase/tests/db/...`
- [ ] T011 Verify `supabase db reset && supabase test db` GREEN. | (no file)

**Checkpoint**: DB foundation green; pg_cron schedule registered.

---

## Phase 2: Shared utilities

- [ ] T012 [P] Write `_shared/storage.ts` — `signImage(path: string): Promise<string>` using service-role client; 5-min TTL | `supabase/functions/_shared/storage.ts`
- [ ] T013 [P] Write `_shared/kudo-shape.ts` — `toKudoJSON(row, viewerId)`; handles anonymous mask (AD-5), `viewer_has_liked`, `viewer_is_sender`, resolves image paths via T012 | `supabase/functions/_shared/kudo-shape.ts`

---

## Phase 3: US1 — Feed (P1)

- [ ] T014 [US1] Write `liveboard_us1_feed.test.ts` — AC1 paginated list; AC2 empty state; AC3 unauth → 401; AC4 limit>100 → 422; AC5 bad cursor → 422; AC6 shape has all fields + viewer flags. **RED** | `supabase/tests/integration/...`
- [ ] T015 [US1] Write `supabase/functions/kudos/index.ts` — Zod query schema; build PostgREST query w/ joins; project via `toKudoJSON`. | `supabase/functions/kudos/index.ts`

**Checkpoint**: US1 GREEN.

---

## Phase 4: US4 — Dropdown sources (P2)

- [ ] T016 [US4] Write `liveboard_us4_dropdowns.test.ts` — `/hashtags` returns sorted by usage_count; `/departments` full list. | `supabase/tests/integration/...`
- [ ] T017 [US4] Write `supabase/functions/hashtags/index.ts` — accepts `?q=` (prefix filter; also used by Viết Kudo autocomplete) and `?limit=` | `supabase/functions/hashtags/index.ts`
- [ ] T018 [US4] Write `supabase/functions/departments/index.ts` | `supabase/functions/departments/index.ts`

---

## Phase 5: US3 — Filters (P1)

- [ ] T019 [US3] Write `liveboard_us3_filters.test.ts` — AC1 hashtag filter; AC2 department filter on receiver; AC3 intersection; AC4 hashtag chip click reuses same endpoint. **RED** | `supabase/tests/integration/...`
- [ ] T020 [US3] Extend `kudos/index.ts` to accept `?hashtag=` and `?department=` and chain WHERE clauses. | `supabase/functions/kudos/index.ts`

---

## Phase 6: US2 — Highlights (P1)

- [ ] T021 [US2] Write `liveboard_us2_highlights.test.ts` — AC1 top-5; AC2 filters apply; AC3 fewer-than-5 OK; AC4 `X-Ranking-Strategy` header. **RED** | `supabase/tests/integration/...`
- [ ] T022 [US2] Write `supabase/functions/kudos-highlights/index.ts` — SELECT from MV with optional filters; set `X-Ranking-Strategy: hearts_30d` header. | `supabase/functions/kudos-highlights/index.ts`

---

## Phase 7: US6 — Like / Unlike (P1)

- [ ] T023 [US6] Write `liveboard_us6_like.test.ts` — AC1 like; AC2 cannot like own; AC3 unlike; AC4 special-day +2 hearts; AC5 404 for non-existent; AC6 401 unauth. **RED** | `supabase/tests/integration/...`
- [ ] T024 [US6] Write `supabase/functions/kudos-like/index.ts` — POST → `supabase.rpc('fn_kudo_like', { kudo_id })`; DELETE → direct PostgREST delete from `kudo_like`. Map RPC error codes to HTTP. | `supabase/functions/kudos-like/index.ts`

---

## Phase 8: US5 — Spotlight (P2)

- [ ] T025 [US5] Write `liveboard_us5_spotlight.test.ts` — AC1 aggregated counts + total; AC2 `?q=` search; AC3 length validation; AC4 empty. | `supabase/tests/integration/...`
- [ ] T026 [US5] Write `supabase/functions/kudos-spotlight/index.ts` — GROUP BY on `kudo.receiver_id`; cap 500 rows; `X-Truncated` header. | `supabase/functions/kudos-spotlight/index.ts`

---

## Phase 9: US7 — Stats (P2)

- [ ] T027 [US7] Write `liveboard_us7_sidebar.test.ts` — totals + top-5 leaderboards; empty state | `supabase/tests/integration/...`
- [ ] T028 [US7] Write `supabase/functions/kudos-stats/index.ts` — aggregate queries + 2 leaderboard queries | `supabase/functions/kudos-stats/index.ts`

---

## Phase 10: Profile lookup

- [ ] T029 [P] Write `users_id_lookup.test.ts` — active user → 200; inactive → 404 (no leak); not found → 404 | `supabase/tests/integration/...`
- [ ] T030 [P] Write `supabase/functions/users-id/index.ts` — Zod `?id=uuid`; SELECT minimal fields; 404 if inactive | `supabase/functions/users-id/index.ts`

---

## Phase 11: Polish

- [ ] T031 [P] Add synthetic load test: 1k requests across endpoints, capture p95. Record in plan.md Notes. | (no file)
- [ ] T032 RLS cross-user leak test: user A's `/kudos` returns B's anonymous kudos correctly masked (sender=Ẩn danh). | inline in `liveboard_us1_feed.test.ts`
- [ ] T033 Final suite green. | (no file)

---

## Dependencies & Execution Order

```
T001..T007 (migrations strictly sequential)
   ↓
T008 || T009 || T010 (pgTAP parallel)
   ↓
T011 (verify)
   ↓
T012 || T013 (shared utils)
   ↓
US1: T014 → T015
   ↓ (US1 shape unblocks all read endpoints)
US4: T016 → T017 || T018  (filter sources)
US3: T019 → T020
US2: T021 → T022
US6: T023 → T024
US5: T025 → T026
US7: T027 → T028
T029 || T030 (profile)
T031 || T032 → T033 (polish)
```

---

## Commit Strategy

One commit per screen: `feat: implement kudos live board (feed, highlights MV, filters, like RPC, spotlight, stats)`.

---

## Notes

- `pg_cron` may not be enabled by default on the Supabase image we get locally. Step T007 includes a guard. If the schedule fails to register, the fallback is described in plan AD-2 / Risk row 1 — implement `_shared/highlights-cache.ts` and call `select * from kudo_highlights_mv` via `refresh materialized view kudo_highlights_mv` on a TTL.
- The like RPC is the most "fancy" SQL in the project. Take time to read its commit; reviewers will catch concurrency bugs faster than tests will.
- Anonymous masking unit test (T013-related): write a unit test for `toKudoJSON` asserting `is_anonymous=true` always produces masked sender, regardless of viewerId.
