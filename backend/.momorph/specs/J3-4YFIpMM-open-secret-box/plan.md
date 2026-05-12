# Implementation Plan: Open Secret Box (Server-Side)

**Frame**: `J3-4YFIpMM-open-secret-box`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I. Server-Side Only Scope | ✅ | |
| II. RLS-First | ✅ | `secret_box` self-only; `badge` auth-only SELECT. Inserts via service role only. |
| III. TDD | ✅ | |
| IV. Validation & Secure Coding | ✅ | RNG server-side; Zod `strict()` rejects unknown keys (US AC SC-004). |
| V. Migration & Commit Discipline | ✅ | 2 additive migrations. |

**Violations**: none.

---

## Technical Context (delta)

| Aspect | Choice |
|---|---|
| RNG | Postgres `random()` (sufficient — see plan AD-1) wrapped in `fn_pick_badge(roll int)` for testability |
| Concurrency | `FOR UPDATE SKIP LOCKED` on the unopened-box pick |
| Granting | OUT OF SCOPE — only seeded for dev/test |
| Distribution test | A "slow" nightly integration test with 10k opens; χ² goodness-of-fit at p > 0.05 |

---

## File Tree (delta)

```text
supabase/
├── migrations/
│   ├── 20260515090000_create_badge.sql              # ← NEW (table + seed 6 badges)
│   └── 20260515090001_create_secret_box.sql         # ← NEW (table + fn_pick_badge + fn_open_secret_box + indexes)
└── functions/
    ├── me-secret-boxes/index.ts                     # ← NEW (GET counters + history; POST /open via path suffix)
    └── _shared/badge-shape.ts                       # ← NEW (project DB row → API shape with localised name/description)
└── tests/
    ├── integration/
    │   ├── secretbox_us1_open.test.ts
    │   ├── secretbox_us3_read.test.ts
    │   ├── secretbox_concurrency.test.ts            # SKIP-LOCKED race verification
    │   └── secretbox_us2_distribution.test.ts       # tagged @slow; 10k opens
    └── db/
        ├── badge_rls.test.sql
        └── secret_box_rls.test.sql
```

---

## Architecture Decisions

### AD-1 — `random()` is fine, isolate via `fn_pick_badge`
**Decision**: use PostgreSQL `random()` (Mersenne Twister) wrapped in `fn_pick_badge(roll int)`. The caller `fn_open_secret_box()` generates `(random() * total_weight)::int + 1` and passes it.

**Why**: the client never sees the roll; an attacker cannot influence it. `gen_random_bytes` adds complexity without security benefit in a lottery context.

### AD-2 — `FOR UPDATE SKIP LOCKED` for parallelism
**Decision**: the picker query uses `SELECT id FROM secret_box WHERE user_id = auth.uid() AND opened_at IS NULL FOR UPDATE SKIP LOCKED LIMIT 1`.

**Why**: two concurrent opens by the same user (rapid double-click) pick *different* unopened rows instead of one waiting on the other. If only one unopened row exists and both lock it, one gets it; the other sees `no row found` and returns `409 secret_box/no_boxes` — also acceptable.

### AD-3 — Bundle GET counters + GET history + POST open in one Edge Function
**Decision**: `me-secret-boxes/index.ts` routes by method + optional `?action=open`.

**Why**: same auth pattern, same logging; deploy count stays small.

### AD-4 — Zod `strict()` on POST body
**Decision**: even though POST body is empty, parse with `z.object({}).strict()` so any client-supplied `badge_code` is rejected with `422 validation/unknown_keys`.

**Why**: directly satisfies SC-004 fuzz test in spec.

---

## Research Findings

### Distribution test
- 10k opens with the configured weights (30, 25, 20, 10, 10, 5; total 100).
- Expected counts per badge: 3000, 2500, 2000, 1000, 1000, 500.
- χ² statistic threshold for 5 df at p=0.05 is 11.07.
- Tagged `@slow` so it doesn't run in the default CI lane.

### `pgcrypto` vs `random()`
- `pgcrypto.gen_random_bytes()` is cryptographically secure but slower (~10x).
- For a lottery whose roll the client cannot influence, the security gain is zero. We pick `random()`.

### `SECURITY DEFINER` functions
- `fn_open_secret_box()` runs as definer (= owner = `postgres` role) so it can bypass write RLS while validating `auth.uid()`.
- Standard hardening: `revoke all on function fn_open_secret_box from public; grant execute to authenticated;`.

---

## Implementation Strategy

### Phase Breakdown

1. **Foundation** — 2 migrations + pgTAP.
2. **US3 — Read counters** (small; warm up).
3. **US1 — Open box** (the centrepiece; concurrency test).
4. **US2 — Distribution test** (slow lane; correctness over many opens).
5. **Polish** — fuzz test for unknown keys (SC-004).

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| `SKIP LOCKED` not chosen because of locking semantics in Supabase wrappers | Low | Medium | Test directly in `secretbox_concurrency.test.ts` with two dblink sessions. |
| Distribution test flaky | Medium | Low | Tag `@slow`; allow ±2% tolerance + 99% CI. |
| Forgot to grant execute to `authenticated` | Medium | High (PostgREST 401 by default) | Smoke test invokes it via the Edge Function (which uses the user JWT) — surfaces grant issues immediately. |

---

## Integration Testing Strategy (delta)

| Test file | AC mapping |
|---|---|
| `secretbox_us1_open.test.ts` | US1 AC1-4 (assign badge + decrement + auth) |
| `secretbox_us3_read.test.ts` | US3 AC1-3 (counters + history) |
| `secretbox_concurrency.test.ts` | US1 AC5 (skip-locked) |
| `secretbox_us2_distribution.test.ts` | US2 AC1 (χ²) — tagged `@slow` |
| `badge_rls.test.sql` | auth SELECT; admin UPDATE |
| `secret_box_rls.test.sql` | self select/update only; no client insert/delete |

---

## Dependencies & Prerequisites

- [x] Login implementation complete (`app_user`).
- [ ] Migrations applied.
- [ ] A small dev-only utility or seed to insert 4-5 `secret_box` rows for the integration tests (use a SQL fixture in `tests/_shared/fixtures.ts`).

---

## Notes

- Smallest "interesting" plan after Hệ thống giải — about 4-5 hours of implementation time.
- The granting feature ("user gets N boxes for X reason") is intentionally OUT OF SCOPE. We seed boxes in tests via raw SQL.
- The distribution test is the only "@slow" test in the whole project — runs nightly, not in the dev loop.
