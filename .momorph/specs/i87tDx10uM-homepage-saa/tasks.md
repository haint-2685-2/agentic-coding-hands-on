# Tasks: Homepage SAA (Server-Side)

**Frame**: `i87tDx10uM-homepage-saa`
**Prerequisites**: Login implementation complete (foundation `_shared/` files exist).

---

## Phase 1: Setup delta

- [ ] T001 [P] Write `_shared/pagination.ts` — `parseCursor(before?: string)`, `buildNextCursor(items, key='created_at')`, `parseLimit(raw, max=100, default=20)` | `supabase/functions/_shared/pagination.ts`
- [ ] T002 [P] Write `_shared/cache.ts` — `publicCache(maxAge=60): HeadersInit`, `privateNoStore(): HeadersInit` | `supabase/functions/_shared/cache.ts`

---

## Phase 2: Foundation

- [ ] T003 Migration `20260511130000_create_event_config.sql` — singleton table (PK CHECK id=1) + seed `insert (id) values (1)` + RLS (anon SELECT, admin UPDATE) | `supabase/migrations/...`
- [ ] T004 Migration `20260511130001_create_award.sql` — table + CHECK on `slug` + RLS + seed 6 rows with `slug, title_vi, title_en, short_description_vi, short_description_en, display_order, hero_image_path` | `supabase/migrations/...`
- [ ] T005 Migration `20260511130002_create_notification.sql` — table + `(user_id, created_at DESC, id DESC)` index + partial index `(user_id) where read_at is null` + RLS (self select/update only) | `supabase/migrations/...`
- [ ] T006 [P] pgTAP `event_config_rls.test.sql` | `supabase/tests/db/...`
- [ ] T007 [P] pgTAP `award_rls.test.sql` | `supabase/tests/db/...`
- [ ] T008 [P] pgTAP `notification_rls.test.sql` | `supabase/tests/db/...`
- [ ] T009 Verify `supabase db reset && supabase test db` GREEN | (no file)

**Checkpoint**: DB foundation green; 6 awards visible.

---

## Phase 3: US1 — Public countdown endpoint (P1)

- [ ] T010 [US1] Write `homepage_us1_countdown.test.ts` — AC1 future date → `is_started=false`; AC2 past date → true; AC3 null → graceful; AC4 cache header. **RED** | `supabase/tests/integration/...`
- [ ] T011 [US1] Write `supabase/functions/config-event/index.ts` — anon-allowed GET; computes `is_started` server-side; returns with `publicCache(60)` header. | `supabase/functions/config-event/index.ts`

**Checkpoint**: US1 GREEN.

---

## Phase 4: US2 — Public awards catalog (P1)

- [ ] T012 [US2] Write `homepage_us2_awards_catalog.test.ts` — AC1 6 rows in order; AC2 `?locale=en` projects EN fields; AC3 invalid locale → 422; AC4 disabled row omitted; AC5 slug regex enforced (DB-level). **RED** | `supabase/tests/integration/...`
- [ ] T013 [US2] Write `supabase/functions/awards/index.ts` — Zod `?locale=z.enum(['vi','en','ja']).default('vi')`; project locale fields → unified `title`/`short_description`; `publicCache(60)`. | `supabase/functions/awards/index.ts`

**Checkpoint**: US2 GREEN.

---

## Phase 5: US3 — Notification list, unread-count, mark-read (P1)

- [ ] T014 [US3] Write `homepage_us3_unread_badge.test.ts` — AC1 unread count; AC2 list pagination + cursor; AC3 PATCH mark-one read; AC4 POST mark-all-read; AC5 401 unauth; AC6 403 disabled user + cross-user LEAK test (user A cannot see user B's notifications). **RED** | `supabase/tests/integration/...`
- [ ] T015 [US3] Write `supabase/functions/me-notifications/index.ts` — routes `GET ?count=true` → unread-count; `GET` (default) → list; `POST ?action=mark-all-read` → bulk update. Each branch has its own `rate-limit` key from `_shared/rate-limit.ts`. | `supabase/functions/me-notifications/index.ts`
- [ ] T016 [US3] Write `supabase/functions/me-notifications-id/index.ts` — `PATCH` with Zod `{ read: z.literal(true) }`; RLS handles "not yours" returning empty → handler maps to 404 `kudo/not_found`... wait, code is `notification/not_found`. | `supabase/functions/me-notifications-id/index.ts`

**Checkpoint**: US3 GREEN; cross-user leak test confirms RLS works.

---

## Phase 6: US4 — Admin menu visibility (P2)

- [ ] T017 [US4] Write `homepage_us4_admin_menu.test.ts` — admin → `/me.role='admin'`; regular → `role='user'`. **Already covered by Login `/me`; this file is the explicit assertion mapping for design TC ID-5..6.** | `supabase/tests/integration/...`

---

## Phase 7: US5 — Anon vs auth boundary (P3)

- [ ] T018 [US5] Write `homepage_us5_anon_vs_auth.test.ts` — anon to `/me/notifications*` → 401; malformed JWT → 401 `auth/invalid-token` (no DB query). | `supabase/tests/integration/...`

---

## Phase 8: Polish

- [ ] T019 [P] Add `EXPLAIN ANALYZE` comment in `homepage_us3_unread_badge.test.ts` documenting the partial-index usage. (Doc-only, not asserted.) | (no file change)
- [ ] T020 Final suite: `supabase db reset && supabase test db && deno test --allow-net --allow-env --allow-read supabase/tests/`. Login + Homepage all green. | (no file)

---

## Dependencies & Execution Order

```
T001 || T002        (setup)
   ↓
T003 → T004 → T005   (migrations in order — later ones reference app_user / award)
   ↓
T006 || T007 || T008 (pgTAP)
   ↓
T009 (verify)
   ↓
US1: T010 → T011
US2: T012 → T013
US3: T014 → T015 || T016
US4: T017 (instant)
US5: T018 (instant)
T019 || T020 (polish)
```

US1/US2/US3 can be done in parallel after Phase 2 completes if multi-tasking; otherwise sequential P1 → P1 → P1.

---

## Commit Strategy

One commit per screen: `feat: implement homepage SAA (event config, awards, notifications)`.

---

## Notes

- Notification *production* is intentionally absent from this screen — it gets implemented in Viết Kudo and Open Secret Box. The tests here insert test notifications via raw SQL in `beforeAll`.
- `me-notifications-id` is the only function in Phase 2 of this project that uses path parameters; we'll likely revisit when Live Board adds `/kudos/{id}/like` (URL parsing helper might become shared).
