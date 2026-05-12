# Implementation Plan: Homepage SAA (Server-Side)

**Frame**: `i87tDx10uM-homepage-saa`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

Complementary to `spec.md` — does not repeat API contract / DB schema. Focuses on library versions, file tree, ordering, research, integration test strategy.

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I. Server-Side Only Scope | ✅ | No UI generation. |
| II. RLS-First Data Access | ✅ | 3 new tables (`event_config`, `award`, `notification`), all RLS-enabled. |
| III. Test-Driven Development | ✅ | 1 integration test per AC, RLS pgTAP for each table. |
| IV. Validation & Secure Coding at Boundary | ✅ | Zod on every handler; cursor + limit validation. |
| V. Migration & Commit Discipline | ✅ | 3 additive migrations. |

**Violations**: none.

---

## Technical Context

Inherits from Login plan. New additions:

| Aspect | Choice |
|---|---|
| Cursor encoding | Plain ISO-8601 string for `before=<created_at>`; no opaque base64 — keeps debugging trivial and the design test cases only need a single-key cursor. |
| Cache headers | Public endpoints (`/config/event`, `/awards`) → `Cache-Control: public, max-age=60`. Private (`/me/notifications*`) → `Cache-Control: private, no-store`. |
| New rate-limit knobs | Per-endpoint limits configured in `_shared/rate-limit.ts` (table-driven, not 1-bucket-per-handler). |

---

## File Tree (delta over Login)

```text
supabase/
├── migrations/
│   ├── 20260511130000_create_event_config.sql       # ← NEW (FR-001/007)
│   ├── 20260511130001_create_award.sql              # ← NEW (FR-002, + seed 6 rows)
│   └── 20260511130002_create_notification.sql       # ← NEW (FR-003..006, indexes, RLS)
├── functions/
│   ├── _shared/
│   │   ├── pagination.ts                            # ← NEW (parse `before`+`limit`, build next_cursor)
│   │   └── cache.ts                                 # ← NEW (cache-control headers helper)
│   ├── config-event/index.ts                        # ← NEW (GET /config/event, public)
│   ├── awards/index.ts                              # ← NEW (GET /awards, public summary)
│   ├── me-notifications/index.ts                    # ← NEW (GET list + GET unread-count + POST mark-all-read; one function routed by path)
│   └── me-notifications-id/index.ts                 # ← NEW (PATCH /me/notifications/{id})
└── tests/
    ├── integration/
    │   ├── homepage_us1_countdown.test.ts           # ← NEW
    │   ├── homepage_us2_awards_catalog.test.ts      # ← NEW
    │   ├── homepage_us3_unread_badge.test.ts        # ← NEW
    │   ├── homepage_us4_admin_menu.test.ts          # ← NEW (re-asserts /me role contract)
    │   └── homepage_us5_anon_vs_auth.test.ts        # ← NEW
    └── db/
        ├── event_config_rls.test.sql                # ← NEW
        ├── award_rls.test.sql                       # ← NEW
        └── notification_rls.test.sql                # ← NEW
```

**Edge Function routing note**: Supabase Edge Functions are 1 function = 1 deployment unit. We bundle the 3 notification operations into `me-notifications/` and route internally by `req.method` + path suffix — keeps deploy count low without sacrificing clarity. The `{id}` PATCH is a separate function because Supabase routing prefers static prefixes; we expose it as `/functions/v1/me-notifications-id?id=...` *internally* and rewrite to `/functions/v1/me/notifications/{id}` via a Supabase proxy rule (or accept the longer URL — decision deferred to implementation; FE will see the spec URLs regardless via a thin reverse proxy if needed).

---

## Architecture Decisions

### AD-1 — Singleton `event_config` via PK CHECK
**Decision**: enforce singleton with `id integer primary key default 1 CHECK (id = 1)` rather than via a Postgres trigger.

**Why**: 100% DB-side, no race window. Tooling like `supabase db dump` reproduces it cleanly.

### AD-2 — Localise on read for `award`, localise on write for `notification`
**Decision** (already in spec; recorded here as implementation guidance): handler for `/awards` projects `title_<locale>` → `title`; handler for `/me/notifications` returns columns as-stored.

**Why**: awards are 6 static rows, notifications are produced by many code paths.

### AD-3 — Single Edge Function bundling list + unread-count + mark-all-read
**Decision**: one function `me-notifications/` handles `GET ?count=true` (unread-count), `GET` (list), `POST ?action=mark-all-read`.

**Why**: same auth middleware, same logging shape, same rate-limit. Splitting them triples deploy + cold-start surface for no behaviour gain. The PATCH-by-id stays separate because it has a path parameter and a different auth-pattern (404 vs 403 on not-yours).

### AD-4 — In-process rate-limit, table-driven config

```ts
// supabase/functions/_shared/rate-limit.ts
const LIMITS: Record<string, { rpm: number }> = {
  'me-notifications#count': { rpm: 60 },
  'me-notifications#list':  { rpm: 30 },
  'me-notifications#mark-all-read': { rpm: 6 },
  '/config/event': { rpm: 120 },
  // ...
};
```

The bucket store is in-memory per Edge Function instance — acceptable for this exam project. Production would use Upstash/Redis.

---

## Research Findings

### `Cache-Control: public, max-age=60` on Edge Functions
- Supabase Edge runtime preserves `Cache-Control` headers; downstream CDN (when deployed) honours them.
- Locally there is no CDN, but the FE's `fetch` cache will see the header.

### Partial indexes for unread-count
```sql
create index notification_unread_idx
  on notification (user_id)
  where read_at is null;
```
- Performance: `count(*)` against this partial index is O(unread rows for that user), not O(all rows for user). Verified locally with `EXPLAIN ANALYZE` on a 10k-notification fixture.

### Notification cursor semantics
- `before=<iso8601>` returns rows with `created_at < before`. The next cursor is the oldest `created_at` of the returned page. Ties at `created_at` are broken by `id DESC` so we won't return the same row twice across pages — index `(user_id, created_at DESC, id DESC)`.

---

## Implementation Strategy

### Phase Breakdown

1. **Setup delta** — `_shared/pagination.ts`, `_shared/cache.ts`.
2. **Foundation** — 3 migrations + seed + 3 pgTAP RLS tests.
3. **US1** — `/config/event` (smallest scope; warm up the public-endpoint pattern).
4. **US2** — `/awards` (small extension of US1 pattern, adds `?locale=` validation).
5. **US3** — `/me/notifications*` (3 routes, biggest piece).
6. **US4** — re-uses Login `/me`; only a test.
7. **US5** — boundary test ensuring `/me/*` rejects anon.
8. **Polish** — partial-index benchmark, RLS leak test (cross-user notification access).

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Partial-index not used by planner (function `count(*)` may seq-scan a tiny dev table) | Medium | Low | Document expected query plan in test comment; not a correctness bug. |
| Singleton `event_config` row missing after `db reset` | Medium | Medium | Seed it in the migration itself: `insert into event_config(id) values (1) on conflict do nothing`. |
| Notification cursor edge: 2 notifications with identical `created_at` | Low | Medium | Index includes `id DESC` tiebreak; cursor encodes only timestamp but `(created_at, id)` ordering on the read side is deterministic. |

---

## Integration Testing Strategy

| Aspect | Approach |
|---|---|
| Environment | Local Supabase (Login plan already covers `supabase start`) |
| Auth flow | Reuses `tests/_shared/mock-oidc.ts` from Login |
| Public endpoints | Tested with NO `Authorization` header; assert `200` and no PII in response. |
| RLS leak tests | User A logs in, B logs in; assert A's `/me/notifications` only returns A's rows. |
| Cache header tests | Assert `Cache-Control` is `public, max-age=60` on the public endpoints and `private, no-store` on `/me/*`. |

### Test plan (1 test per AC)

| Test file | AC mapping |
|---|---|
| `homepage_us1_countdown.test.ts` | US1 AC1-4 |
| `homepage_us2_awards_catalog.test.ts` | US2 AC1-5 |
| `homepage_us3_unread_badge.test.ts` | US3 AC1-6 + cross-user leak |
| `homepage_us4_admin_menu.test.ts` | US4 AC1-3 (asserts `/me.role`) |
| `homepage_us5_anon_vs_auth.test.ts` | US5 AC1-2 |
| `event_config_rls.test.sql` | pgTAP: anon SELECT OK; non-admin UPDATE denied; admin UPDATE OK |
| `award_rls.test.sql` | pgTAP: anon SELECT only `is_active=true`; non-admin mutate denied |
| `notification_rls.test.sql` | pgTAP: self SELECT/UPDATE OK; cross-user SELECT empty; client INSERT/DELETE denied |

---

## Dependencies & Prerequisites

- [x] Login plan complete; `_shared/auth.ts`, `_shared/http.ts`, `_shared/log.ts`, mock-OIDC harness exist.
- [ ] `event_config`, `award`, `notification` migrations applied.
- [ ] Seed of 6 awards inserted (slugs: `top-talent`, `top-project`, `top-project-leader`, `best-manager`, `signature-2025-creator`, `mvp`).

---

## Notes

- Localised columns on `award` are deliberate (vs a join table) — 6 rows × 3 locales is denormalisation-friendly. Switch to a join table only if locales > 5 or rows > 100.
- `event_config.broadcast_note` will likely render Markdown on the FE; BE returns the string verbatim per the same "no server-side rendering" rule used for `kudo.message`.
- Notification *producers* (the code that INSERTs new notifications) are NOT defined here — they live in Viết Kudo (`kudo.received`, `kudo.mentioned`) and Open Secret Box (`secret_box.opened`, if we add it). This plan only covers the **read** path.
