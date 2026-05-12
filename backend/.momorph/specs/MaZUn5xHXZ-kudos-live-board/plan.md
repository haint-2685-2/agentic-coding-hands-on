# Implementation Plan: Sun* Kudos — Live Board (Server-Side)

**Frame**: `MaZUn5xHXZ-kudos-live-board`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

Complementary to spec; focuses on library versions, file layout, ordering, research findings, integration test strategy.

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I. Server-Side Only Scope | ✅ | |
| II. RLS-First Data Access | ✅ | 8 new tables (`kudo`, `kudo_hashtag`, `hashtag`, `kudo_image`, `kudo_like`, `department`, `special_day`, materialised view `kudo_highlights_mv`), all RLS-enabled. |
| III. TDD | ✅ | 1 integration test per AC; pgTAP per table. |
| IV. Validation & Secure Coding | ✅ | All endpoints Zod-validated; like RPC enforces sender-check atomically. |
| V. Migration & Commit Discipline | ✅ | 6 additive migrations + `pg_cron` setup. |

**Violations**: none.

---

## Technical Context (delta)

| Aspect | Choice |
|---|---|
| `pg_cron` | Enable extension; one schedule per minute refreshes `kudo_highlights_mv` |
| RPC for like | `fn_kudo_like(kudo_id uuid)` returns `(liked boolean, like_count int, hearts_added int)`; runs in single transaction; checks sender ≠ caller; idempotent |
| Materialised view | Refresh with `concurrently` to avoid blocking reads |
| Pagination | Same `(created_at, id)` cursor pattern as Homepage notifications |
| Storage | Live Board only **reads** image paths; signed-URL conversion happens at response time using Supabase service-role client (not exposed paths verbatim) |

### Library additions

```ts
// _shared/deps.ts (additions)
export { decode as decodeJWT } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'; // already in Login
// no new external libs
```

---

## File Tree (delta)

```text
supabase/
├── migrations/
│   ├── 20260512090000_create_department.sql       # ← NEW (seed common Sun* depts)
│   ├── 20260512090001_alter_app_user_dept.sql     # ← NEW (add app_user.department_id FK)
│   ├── 20260512090002_create_hashtag.sql          # ← NEW
│   ├── 20260512090003_create_kudo.sql             # ← NEW (kudo + kudo_hashtag + kudo_image + indexes)
│   ├── 20260512090004_create_kudo_like.sql        # ← NEW (table + fn_kudo_like RPC)
│   ├── 20260512090005_create_special_day.sql      # ← NEW
│   └── 20260512090006_create_kudo_highlights_mv.sql # ← NEW (MV + pg_cron schedule)
├── functions/
│   ├── _shared/
│   │   ├── storage.ts                             # ← NEW (path → signed URL helper)
│   │   └── kudo-shape.ts                          # ← NEW (project DB row → API JSON shape with viewer flags, anonymous masking)
│   ├── kudos/index.ts                             # ← NEW (GET list w/ filters)
│   ├── kudos-highlights/index.ts                  # ← NEW
│   ├── kudos-spotlight/index.ts                   # ← NEW
│   ├── kudos-stats/index.ts                       # ← NEW
│   ├── kudos-like/index.ts                        # ← NEW (POST/DELETE; calls fn_kudo_like)
│   ├── hashtags/index.ts                          # ← NEW (extends Live Board endpoint, supports ?q= for Viết Kudo too)
│   ├── departments/index.ts                       # ← NEW
│   └── users-id/index.ts                          # ← NEW (GET /users/{id})
└── tests/
    ├── integration/
    │   ├── liveboard_us1_feed.test.ts
    │   ├── liveboard_us2_highlights.test.ts
    │   ├── liveboard_us3_filters.test.ts
    │   ├── liveboard_us4_dropdowns.test.ts
    │   ├── liveboard_us5_spotlight.test.ts
    │   ├── liveboard_us6_like.test.ts
    │   ├── liveboard_us7_sidebar.test.ts
    │   └── users_id_lookup.test.ts
    └── db/
        ├── kudo_rls.test.sql
        ├── kudo_like_rls.test.sql
        └── kudo_like_concurrency.test.sql         # ← uses dblink/parallel sessions to verify "no double like"
```

---

## Architecture Decisions

### AD-1 — Like via SQL function, not direct INSERT
**Decision**: `POST /kudos/{id}/like` calls `fn_kudo_like(uuid)` which:
1. SELECT the kudo (FOR SHARE) to get `sender_id`.
2. RAISE if `auth.uid() = sender_id` → maps to `403 kudo/cannot_like_own`.
3. Compute `hearts` from active `special_day` (= 2 if any `now()` falls inside; else 1).
4. INSERT … ON CONFLICT DO NOTHING into `kudo_like`. If row already existed → `hearts_added = 0`.
5. Return new `(liked, like_count, hearts_added)`.

**Why**: a single transaction over insert + check; RLS-only would yield a generic policy denial. Lets us return precise error codes.

### AD-2 — Materialised view + pg_cron for highlights
**Decision**: `kudo_highlights_mv` defined as

```sql
create materialized view kudo_highlights_mv as
select k.*, coalesce(sum(kl.hearts), 0) as total_hearts,
       rank() over (order by coalesce(sum(kl.hearts), 0) desc, k.created_at desc) as rank
from kudo k
left join kudo_like kl on kl.kudo_id = k.id
where k.created_at >= now() - interval '30 days'
group by k.id;

select cron.schedule(
  'refresh-kudo-highlights',
  '* * * * *',  -- every minute
  $$ refresh materialized view concurrently kudo_highlights_mv $$
);
```

**Why**: keeps `/kudos/highlights` p95 fast and predictable. The "30 days" window is hard-coded; if it needs to be configurable later, swap to a SECURITY DEFINER function reading `kudo_highlight_config`.

**Cost**: a unique index on `kudo_highlights_mv (id)` is required by `refresh … concurrently`.

### AD-3 — Filter-aware highlights
**Decision**: `GET /kudos/highlights?hashtag=&department=` filters the MV results at query time (FE-driven filter, server-side application). The MV itself is not partitioned by filter.

**Why**: a partitioned MV per filter combo would explode (hashtags × departments = thousands). Filtering at query time over 30-day MV (~few hundred rows max in this exam) is cheap.

### AD-4 — Signed URLs for `kudo_image.path`
**Decision**: `_shared/storage.ts` exports `signImage(path)` which calls `supabase.storage.from('kudos').createSignedUrl(path, 300)` (5-minute TTL). All kudo response shapes resolve paths to signed URLs at response time.

**Why**: the storage bucket is private (per Viết Kudo spec). Returning raw paths leaks internal layout; signed URLs are short-lived and per-request.

### AD-5 — Anonymous masking centralised
**Decision**: `_shared/kudo-shape.ts` exposes `toKudoJSON(row, viewerId)` which, when `row.is_anonymous=true`, replaces `sender` with `{ id: null, full_name: 'Ẩn danh', avatar_url: null, department_name: null }`.

**Why**: avoids forgetting the mask in any one of the 4 list-shape endpoints (feed, highlights, spotlight, stats). One mask function, one bug surface.

---

## Research Findings

### `FOR UPDATE SKIP LOCKED` for like contention
- The like RPC needs `select … from kudo where id = $1 for share` (not `for update`) to allow concurrent likes on the same kudo without deadlock.
- The `INSERT … ON CONFLICT (kudo_id, user_id) DO NOTHING` is the atomic point — DB constraint guarantees one row.

### `refresh materialized view concurrently`
- Requires a unique index on the MV. We use `create unique index kudo_highlights_mv_id_idx on kudo_highlights_mv (id);`.
- Refresh takes ~50 ms for a few hundred rows on a default Postgres tuning. Fine for a 1-minute cadence.

### Spotlight aggregation
- Query: `select receiver_id, max(full_name) as full_name, count(*) as count from kudo group by receiver_id order by count desc limit 500;`
- With index on `(receiver_id)`, this scans a few thousand rows in single-digit ms.

### `pg_cron` on Supabase
- Available on Pro and self-hosted; on Free tier the user has to run a cron from outside.
- For mock project, we **assume Pro or local** — local Supabase ships with `pg_cron` enabled in recent versions.

---

## Implementation Strategy

### Phase Breakdown

1. **Foundation** — 6 migrations + `pg_cron` enable.
2. **`_shared/` delta** — `storage.ts`, `kudo-shape.ts`.
3. **US1 — Feed** (largest single piece; defines the response shape for all read endpoints).
4. **US4 — Dropdowns** (small, unblocks US3 filters and Viết Kudo).
5. **US3 — Filters** (extension of US1).
6. **US2 — Highlights** (depends on US1 shape; MV is straightforward).
7. **US6 — Like** (RPC + integration + concurrency test).
8. **US5 — Spotlight**.
9. **US7 — Stats**.
10. **US8 — Quick-input contract** (no code; just a doc-link assertion).
11. **Polish** — performance run with synthetic load, RLS leak tests.

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| `pg_cron` not available locally | Medium | Medium | Fallback: trigger refresh on read with TTL cached at `_shared/highlights-cache.ts`. |
| MV refresh slower than 1 minute as data grows | Low (exam scale) | Low | Schedule is configurable; bump to 5 min if needed. |
| Anonymous masking missed in one shape | Medium | High | Single mask function (AD-5); a unit test asserts every endpoint passes through it. |
| Signed URL TTL too short for image-heavy feed | Low | Low | 5-minute TTL; FE caches images; renewable via next fetch. |

---

## Integration Testing Strategy (delta)

| Aspect | Approach |
|---|---|
| Test data | Seed 30 kudos covering all 6 user stories' edge cases in `beforeAll` of a shared `liveboard_fixtures.ts`. |
| Concurrency | `kudo_like_concurrency.test.sql` opens 2 sessions via `dblink`, fires same `INSERT` → asserts one succeeds, one is a no-op. |
| Anonymous masking | Each integration test runs *one assertion per endpoint* that an anonymous kudo never returns sender info. |
| Storage | Tests upload a 1x1 PNG to local Supabase Storage in `beforeAll`; verify `kudo_image` rows reference it; verify signed URLs are issued. |

### Test plan (1 test file per US)

| Test file | AC mapping |
|---|---|
| `liveboard_us1_feed.test.ts` | US1 AC1-6 |
| `liveboard_us2_highlights.test.ts` | US2 AC1-4 |
| `liveboard_us3_filters.test.ts` | US3 AC1-5 |
| `liveboard_us4_dropdowns.test.ts` | US4 AC1-2 |
| `liveboard_us5_spotlight.test.ts` | US5 AC1-4 |
| `liveboard_us6_like.test.ts` | US6 AC1-6 + special-day +2 hearts |
| `liveboard_us7_sidebar.test.ts` | US7 AC1-2 |
| `users_id_lookup.test.ts` | profile click edge cases (inactive=404) |

---

## Dependencies & Prerequisites

- [x] Login + Homepage implementation complete.
- [ ] Migrations applied; `pg_cron` extension enabled; MV present.
- [ ] Local Supabase Storage bucket `kudos` created (private).

---

## Notes

- This is the biggest single screen by surface area; expect 1-2 days of focused work in Phase 3.
- The `fn_kudo_like` RPC is the only place where business logic (sender-check, special-day bonus) lives in SQL. Everything else (filters, projections, anonymous mask) lives in TS for readability.
- The "MV vs ad-hoc query" decision is the one most likely to need revisiting if `pg_cron` is missing locally. Fallback documented in Risk row 1.
