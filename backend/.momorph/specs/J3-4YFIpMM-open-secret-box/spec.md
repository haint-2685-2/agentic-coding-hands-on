# Feature Specification: Open Secret Box (Server-Side)

**Frame ID**: `J3-4YFIpMM`
**Frame Name**: `Open secret box - chưa mở`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side only — the entitlement counter, the atomic "open a box → assign a random badge" RPC, and the badge catalog. Modal layout, click animation, badge artwork rendering are FE. Source of new box grants (who decides "user X gets N more boxes") is **out of scope** of this spec — that grant is performed by some other future feature (a like-streak bonus, an admin grant, a daily login reward, etc.); this spec only defines the row shape and the `granted` state.

---

## Overview

Each Sun-er has a pool of "secret boxes" — opaque containers that, when opened, yield exactly one randomly-selected badge per the drop table:

| Badge code | Probability |
|------------|-------------|
| `stay-gold` | 30% |
| `flow-to-horizon` | 25% |
| `touch-of-light` | 20% |
| `beyond-the-boundary` | 10% |
| `revival` | 10% |
| `root-further` | 5% |

The modal shows:
- A title (`MỞ SECRET BOX THÀNH CÔNG`) — static.
- The badge just won (or empty/placeholder if no opens yet — but the design only shows the success state).
- An instructional line "Click vào box để tiếp tục mở" — hidden when unopened-count = 0.
- A counter `Secretbox chưa mở: NN`.
- A close `X` button.

The **click** on the box image is the BE action: it triggers `POST /functions/v1/me/secret-boxes/open`, which:

1. Verifies the caller has ≥ 1 unopened box.
2. Picks one server-side using crypto-secure randomness against the drop table.
3. Marks an unopened `secret_box` row as opened (sets `opened_at`, `badge_code`) atomically.
4. Returns the badge details for the modal to display.

The randomness MUST happen on the server (TC `5cc072ad`, `2e7bec78` explicitly call out client-side manipulation as a security boundary). The endpoint is rate-limited.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open a box and receive a random badge (Priority: P1)

A signed-in user with ≥ 1 unopened box clicks the box; the server assigns one badge and decrements the counter.

**Independent Test**: Integration test: as user A, seed 1 unopened `secret_box`. Call `POST /functions/v1/me/secret-boxes/open`. Assert (a) `200 { badge: { code, name, description, image_path }, unopened_count: 0 }`, (b) the `secret_box` row now has `opened_at` and `badge_code` set, (c) calling again → `409 { code: "secret_box/no_boxes" }`.

**Acceptance Scenarios**:

1. **Given** an authenticated user with `unopened_count ≥ 1`, **When** `POST /functions/v1/me/secret-boxes/open` is called, **Then** exactly one unopened `secret_box` row of theirs is marked opened with the picked badge and `opened_at = now()`. Response: `200 { badge, unopened_count }`.
2. **Given** `unopened_count = 0`, **When** the same call is made, **Then** `409 { error: { code: "secret_box/no_boxes", message: "No unopened secret boxes." } }` and no row is changed.
3. **Given** an unauthenticated request, **When** called, **Then** `401`.
4. **Given** a disabled user (`is_active=false`), **When** called, **Then** `403 { code: "auth/account-disabled" }`.
5. **Given** two concurrent `POST /open` calls from the same user, **When** they execute, **Then** only one increment of "opened" happens — the second either picks a *different* unopened row (if there were ≥ 2) or returns `409 secret_box/no_boxes`. The RPC selects with `FOR UPDATE SKIP LOCKED` to enforce.
6. **Given** the user re-opens the modal later (`GET /functions/v1/me/secret-boxes`), **Then** the response contains the up-to-date `unopened_count` and (optionally) the list of badges already won — see US3.

### User Story 2 — Drop probability honoured (Priority: P1)

Over many opens, the empirical distribution of assigned badges matches the configured drop table.

**Independent Test**: Statistical integration test: seed a user with 10,000 unopened boxes, open them all in a loop, count badges. Assert each badge's frequency is within ±2% of its configured probability (with a 99% confidence interval). Test is tagged `slow` and runs nightly.

**Acceptance Scenarios**:

1. **Given** the badge drop table is `{ stay-gold: 30, flow-to-horizon: 25, touch-of-light: 20, beyond-the-boundary: 10, revival: 10, root-further: 5 }`, **When** 10,000 opens are simulated, **Then** the resulting counts pass the χ² goodness-of-fit test at p > 0.05.
2. **Given** the drop table changes (admin updates `badge.drop_weight`), **When** new opens happen, **Then** the new distribution applies. Existing opened rows are not retroactively re-rolled.
3. The picker MUST use `pgcrypto.gen_random_bytes()` (or `random()` seeded with a per-call source) inside a SQL function — never a sequence or client-supplied value.
4. The picker MUST be deterministic given a sample value, so the implementation is testable: a helper function `fn_pick_badge(roll int4)` takes a "roll value" in `[1, sum(drop_weight)]` and returns the corresponding badge code. A wrapper `fn_open_secret_box(user_id)` generates the roll and calls the picker.

### User Story 3 — Read counters and history (Priority: P2)

The sidebar (Live Board) shows the count of unopened boxes for the current user. The modal also relies on the value when first rendered (TC `ce44f5ed`).

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/me/secret-boxes` is called, **Then** the response is `200 { unopened_count: int, opened_count: int, opened: { badge_code, badge_name, opened_at }[] }` ordered by `opened_at DESC`, default last 20 entries — paginate later if needed.
2. **Given** the call is made before any box has been granted to the user, **When** called, **Then** `unopened_count: 0, opened_count: 0, opened: []`.
3. **Given** the FE has just received a `POST /open` response, **When** it caches `unopened_count` locally, **Then** the same value will match a fresh `GET` on next render — the BE is authoritative; no stale state.

### Edge Cases

- **Race against grant**: a new box is granted to the user while they have an open `POST /open` in flight. The RPC's `FOR UPDATE SKIP LOCKED` query may or may not pick up the new row depending on timing — both outcomes are valid. The user's perceived consistency is restored on next `GET`.
- **Badge image missing**: if `badge.image_path` is null or the storage object is unavailable at render time, FE shows a fallback (TC `43badf5d`). BE returns whatever path is configured; image fetch is FE.
- **Client tampering with `unopened_count`**: the count returned to the client is purely informational; only the BE's own row count matters. Re-reading via `GET /me/secret-boxes` returns the true state (TC `5cc072ad`).
- **Drop weights all zero or table empty**: BE responds `500 { code: "internal/badge_table_misconfigured" }` (admin error, not a user-facing edge case).

---

## UI/UX Requirements *(BE-relevant only)*

| Component | BE Impact |
|-----------|-----------|
| `C` Box image (click target) | Triggers `POST /me/secret-boxes/open` |
| `D` Counter `Secretbox chưa mở: NN` | Reads `GET /me/secret-boxes.unopened_count`, refreshes after open |
| `A` Title (static text) | None — FE i18n string |
| `B` Instructional text | None — FE conditional render based on `unopened_count > 0` |
| Modal close `X` | None — FE close |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /functions/v1/me/secret-boxes/open` (auth required) — opens exactly one unopened box atomically; returns the picked badge.
- **FR-002**: `GET /functions/v1/me/secret-boxes` (auth required) — returns counters and the recent opened-history.
- **FR-003**: The picker uses crypto-secure randomness and the `badge.drop_weight` column; relative weights, not absolute percentages, so the sum need not be 100.
- **FR-004**: Pre-existing box rows are NOT mutated when an admin changes drop weights — only future picks use the new table.
- **FR-005**: Opening is rate-limited to 10 boxes/min per user. Excess → `429`. (Defends against an automation that opens many boxes in a tight loop to abuse a particular badge's appearance.)
- **FR-006**: Each `secret_box` row is owned by exactly one user. The `granted_by` and `granted_reason` columns are reserved for the future grant feature; this spec only requires the columns to exist with sensible NOT NULL defaults.

### Technical Requirements

- **TR-001 (Security)**: RNG is server-side; the API never accepts a "roll" or "badge code" from the client.
- **TR-002 (Atomicity)**: the open RPC picks an unopened row with `select … for update skip locked limit 1`, performs the update, and returns the new state — all in one DB call.
- **TR-003 (Performance)**: p95 ≤ 150 ms for the open RPC; p95 ≤ 100 ms for the read.
- **TR-004 (Observability)**: log `{ ts, fn: "open_secret_box", user_id, badge_code, status, latency_ms }` — no PII.
- **TR-005 (Migration)**: 2 migrations: `<ts>_create_badge.sql` (table + seed 6 rows + drop weights) and `<ts>_create_secret_box.sql` (table + indexes + RPC).

### Key Entities

- **`badge`**
  - `code text primary key` CHECK `code ~ '^[a-z0-9-]+$'`
  - `name_vi text not null`, `name_en text not null`, `name_ja text null`
  - `description_vi text not null`, `description_en text not null`, `description_ja text null`
  - `image_path text not null`
  - `drop_weight int not null check (drop_weight >= 0)` (0 = disabled but kept for history)
  - `created_at`, `updated_at`
  - RLS: anyone authenticated SELECT (no public list); admin UPDATE.

  **Seed**:

  | code | drop_weight |
  |------|-------------|
  | stay-gold | 30 |
  | flow-to-horizon | 25 |
  | touch-of-light | 20 |
  | beyond-the-boundary | 10 |
  | revival | 10 |
  | root-further | 5 |

- **`secret_box`**
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null references app_user(id) on delete cascade`
  - `granted_at timestamptz not null default now()`
  - `granted_by uuid null references app_user(id)` — admin id if manually granted; null otherwise.
  - `granted_reason text not null default ''` — free-form note (e.g. `daily-login`, `like-streak-7`, `admin-grant`); not validated as enum so future features can extend.
  - `opened_at timestamptz null`
  - `badge_code text null references badge(code)` — set when opened.
  - CHECK `(opened_at is null) = (badge_code is null)` — both null or both set.
  - Indexes: `(user_id) where opened_at is null` (the picker query), `(user_id, opened_at desc) where opened_at is not null` (history read).
  - RLS: `select` and `update` where `auth.uid() = user_id`. The picker RPC runs as `security definer` to bypass write RLS while still validating `auth.uid()`.
  - No client `insert`/`delete` — all grants come from server-side code (admin tool or future feature).

- **`fn_open_secret_box()`** (Postgres function)
  - Returns `(badge_code text, unopened_count int)`.
  - Implementation outline:
    1. Lock 1 unopened box of `auth.uid()` via `for update skip locked limit 1`.
    2. If none → raise exception with sqlstate `P0002` → Edge Function maps to `409 secret_box/no_boxes`.
    3. Compute total weight `select sum(drop_weight) from badge where drop_weight > 0`.
    4. Generate roll: `(get_byte(gen_random_bytes(4), 0) << 24 | …) mod total + 1` (or simpler `(random() * total)::int + 1` since `random()` in SQL is acceptable here — we want unpredictability, not cryptographic guarantees for game rewards).
    5. Pick the badge using `fn_pick_badge(roll)`.
    6. UPDATE the locked row with `opened_at = now()` and the picked code.
    7. Return new state.

---

## API Dependencies

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/me/secret-boxes` | GET | required | Counters + recent history |
| `/functions/v1/me/secret-boxes/open` | POST | required | Open one box (RPC) |

---

## Success Criteria *(mandatory)*

- **SC-001**: 0 boxes opened by an unauthenticated caller (HTTP `401` always).
- **SC-002**: 0 double-opens — concurrency test in US1 AC5 passes.
- **SC-003**: Distribution test (US2 AC1) passes within tolerance.
- **SC-004**: 0 client-supplied badge codes are accepted — fuzz test that sends `{ badge_code: "..." }` in the request body and asserts the BE ignores it (Zod schema with `strict()` rejects unknown keys → `422 validation/unknown_keys`).

---

## Out of Scope

- The mechanism that **grants** secret boxes (daily login, like streak, admin bonus, etc.). This is the next feature; here we only define the entity and the opening contract. Phase 3 may include a tiny `npx supabase db seed` or test-only utility to insert grant rows for development.
- Badge display on the user's profile (separate Profile feature).
- Animated "box opening" effect (FE).
- Trading / gifting boxes between users (not designed).
- Anti-abuse beyond rate-limit (e.g. CAPTCHA on Nth open) — defer.

---

## Dependencies

- [x] Constitution.
- [x] Login spec defines `app_user.is_active`.
- [ ] Migrations: `badge` (with seed), `secret_box`, `fn_open_secret_box`.
- [ ] Badge artwork (`image_path` values) — supplied by FE/design; BE stores the path string.

---

## Notes

- **`random()` vs `gen_random_bytes()`**: the test cases speak of "random badge probabilities", not cryptographic randomness. PostgreSQL's `random()` is good enough for a kudos lottery; using `gen_random_bytes()` adds complexity without security benefit because the user can't influence either source. Decision: use `random()` for simplicity but isolate via `fn_pick_badge(roll int)` so a future swap is trivial.
- **Why `for update skip locked` not `for update`**: with `skip locked`, two concurrent opens for the same user pick different rows if available, instead of one waiting for the other. This eliminates a serial bottleneck if many boxes are queued.
- **Why `granted_by` and `granted_reason` are pre-baked**: the grant feature is the immediate next thing; adding these columns later requires a backfill. Cheaper to include them now with defaults.
- **Empty list display**: when `unopened_count = 0`, the FE hides the "Click vào box để tiếp tục mở" line (TC `d9d6e01a`). BE returns `0` and FE renders accordingly — no special endpoint needed.
