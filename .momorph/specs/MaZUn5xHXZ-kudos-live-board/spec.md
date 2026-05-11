# Feature Specification: Sun* Kudos — Live Board (Server-Side)

**Frame ID**: `MaZUn5xHXZ`
**Frame Name**: `Sun* Kudos - Live board`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side only — kudos feed, highlight ranking, filters (hashtag + department), spotlight aggregation, like/unlike, sidebar stats, profile lookup. The actual *write* path for a new kudos is specified in the **Viết Kudo** spec (`ihQ26W78P2`); this spec only covers the read/list/aggregate side plus the "like" mutation.

---

## Overview

The Live Board is the heart of Sun* Kudos: a feed of all kudos with multiple lenses. The BE must back four surfaces:

1. **Highlight carousel (top 5)** — curated/ranked kudos.
2. **All Kudos feed** — paginated list, filterable by hashtag and by sender/receiver department.
3. **Spotlight word cloud** — aggregate of recipients with their kudos counts, with a search bar that filters the node list.
4. **Sidebar** — global stats, leaderboards (top senders / top receivers), plus an entry-point to the Secret Box screen.

Plus two mutations:
- **Like / unlike** a kudos card (one heart per user per kudos; sender cannot like their own; special-day rule grants +2 hearts per like).
- **Quick-input** field at the top — when the user types and submits, the *creation* is handled by the Viết Kudo flow (see that spec). This spec only documents the contract that whatever endpoint that flow uses is the same one referenced here.

The page requires authentication (TC `71b3ef43` — signed-out users are redirected to login).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse the Kudos feed (Priority: P1)

A signed-in Sun-er opens `/kudos`. They see a paginated feed of recent kudos with sender, receiver, message, hashtags, image gallery (≤ 5 images), timestamp, and a like button.

**Why this priority**: The feed is the page's reason for existing.

**Independent Test**: Integration test: seed 25 kudos for various users, call `GET /functions/v1/kudos?limit=10` as an authenticated user, assert (a) 10 items returned, (b) ordered by `created_at` DESC, (c) `next_cursor` is present, (d) like-state for the caller is correctly included on each item.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/kudos?limit=10` is called, **Then** the response is `200 { items: Kudo[], next_cursor: string|null }` ordered by `created_at` DESC.
2. **Given** the empty state (no kudos), **When** called, **Then** `{ items: [], next_cursor: null }` is returned — the FE renders the "Hiện tại chưa có Kudos nào." message (TC `926d92a5`).
3. **Given** an unauthenticated request, **When** called, **Then** `401 { error: { code: "auth/required" } }`. (TC `71b3ef43`)
4. **Given** a `limit > 100`, **When** called, **Then** `422 { code: "validation/limit", message: "limit must be ≤ 100" }`.
5. **Given** a malformed `before` cursor, **When** called, **Then** `422 { code: "validation/cursor" }`.
6. Each `Kudo` item MUST contain: `id`, `created_at`, `message`, `hashtags: string[]`, `images: { id, url, position }[]` (≤ 5), `sender: { id, full_name, avatar_url, department_id, department_name }`, `receiver: { id, full_name, avatar_url, department_id, department_name }`, `like_count: int`, `viewer_has_liked: boolean`, `viewer_is_sender: boolean`.

### User Story 2 — Highlight carousel: top 5 (Priority: P1)

A signed-in user sees a carousel of the 5 highest-ranked kudos.

**Why this priority**: Highlighted by the design as the primary visual above the fold; carries the "best moments" narrative.

**Independent Test**: Integration test: seed 20 kudos with varied `like_count`s and dates, call `GET /functions/v1/kudos/highlights`, assert exactly 5 items returned in `rank` order, no duplicates, all eligible for filter (see ranking rule).

**Acceptance Scenarios**:

1. **Given** at least 5 eligible kudos exist, **When** `GET /functions/v1/kudos/highlights` is called, **Then** the response is `200 { items: Kudo[5] }` — same shape as US1 items.
2. **Given** the same filters (`?hashtag=<id>&department=<id>`) used elsewhere on the page, **When** the highlights endpoint is called with them, **Then** the top 5 are computed *within* the filtered subset (TC `0e56cacb`, `159fed13` imply filters apply page-wide — to be confirmed in Phase 2 plan).
3. **Given** fewer than 5 kudos satisfy the filter, **When** called, **Then** the response contains fewer items (no padding); minimum could be `0`.
4. **Ranking rule (v1)**: `total_hearts DESC, created_at DESC` over the last 30 days (configurable in `kudo_highlight_config` — singleton row). The rule MUST be documented in the response (header `X-Ranking-Strategy: hearts_30d`) so the FE can show tooltip "Why is this featured?" later.

### User Story 3 — Filter feed by hashtag and department (Priority: P1)

The user picks a hashtag or department from the two dropdowns; the feed and the highlight carousel both narrow to that selection.

**Why this priority**: Filtering is the user's primary discovery tool.

**Independent Test**: Integration test: seed 10 kudos tagged `#dedicated` and 10 tagged `#inspiring`, then call `GET /functions/v1/kudos?hashtag=dedicated`, assert exactly 10 returned with the hashtag present in each.

**Acceptance Scenarios**:

1. **Given** the user selects hashtag `#dedicated`, **When** `GET /functions/v1/kudos?hashtag=dedicated` is called, **Then** every returned kudos has `dedicated` in `hashtags` (TC `0e56cacb`).
2. **Given** the user selects department `Marketing`, **When** `GET /functions/v1/kudos?department=<dept-uuid>` is called, **Then** every returned kudos has *either* its sender or its receiver in that department (the design test `159fed13` is ambiguous; we pick `receiver.department_id` as the filter target — sender filter would be implemented later as a separate query param if needed). Decision is recorded in Notes.
3. **Given** both filters set, **When** called, **Then** the result is the intersection.
4. **Given** the user clicks a hashtag chip in a kudos card, **When** the FE fires the same `?hashtag=<slug>` query, **Then** the result is filtered identically — same endpoint, no duplicate logic (TC `d01729d4`).
5. **Given** a clearing of the filter (`?hashtag=` empty), **When** called, **Then** results include all kudos.

### User Story 4 — Hashtag and department dropdown sources (Priority: P2)

The two filter dropdowns are populated from BE.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/hashtags?limit=50` is called, **Then** the response is `200 { items: { slug, name, usage_count }[] }` ordered by `usage_count DESC`, default `limit=50`, max `100`. "Live from DB" per TC `0e56cacb`.
2. **Given** an authenticated user, **When** `GET /functions/v1/departments` is called, **Then** the response is `200 { items: { id, name, kudo_count }[] }` — full list (departments are bounded, no pagination needed).

### User Story 5 — Spotlight word cloud (Priority: P2)

The user opens the Spotlight tab; they see all kudos *receivers* with their counts. A total "{N} KUDOS" badge shows the grand total. A search bar (max 100 chars) filters the node list.

**Why this priority**: Visual aggregation; nice-to-have for engagement but not the primary feed.

**Independent Test**: Integration test: seed kudos so user A receives 5, user B receives 3; call `GET /functions/v1/kudos/spotlight`, assert `items` contains A (count 5) and B (count 3), and `total_kudos = 8`.

**Acceptance Scenarios**:

1. **Given** seeded data, **When** `GET /functions/v1/kudos/spotlight` is called, **Then** `200 { items: { user_id, full_name, avatar_url, department_name, count }[], total_kudos: int }` — ordered by `count DESC`, top 500 nodes max (cap to keep payload bounded; design doesn't specify but reasonable for a word cloud).
2. **Given** `?q=<query>` is supplied (length 1..100), **When** called, **Then** only users whose `full_name ILIKE '%q%'` are returned (TC `1ce82447`, `d3877e54`, `9e689933`). 0-length `q` is treated as "no filter".
3. **Given** `q` exceeds 100 characters, **When** called, **Then** `422 { code: "validation/q", message: "q must be ≤ 100 characters" }`.
4. **Given** the empty state, **When** called, **Then** `{ items: [], total_kudos: 0 }` — FE renders the loading / empty UI (TC `d035e3b8`).

### User Story 6 — Like / unlike a kudos (Priority: P1)

Any signed-in user (except the sender) may like a kudos. Liking is idempotent: one like per user per kudos. The count returned to all clients reflects the change after the next read.

**Why this priority**: Core engagement mechanism; carries the special-day bonus rule.

**Independent Test**: Integration test: as user A, `POST /functions/v1/kudos/{kid}/like` (B's kudos); assert `200 { liked: true, like_count: 1, hearts_added: 1 }`. Call again → assert idempotent: `200 { liked: true, like_count: 1, hearts_added: 0 }` (no double-count). DELETE → `200 { liked: false, like_count: 0 }`. Sender attempting to like own → `403 { code: "kudo/cannot_like_own" }`.

**Acceptance Scenarios**:

1. **Given** user A is not the sender of kudos `K`, **When** `POST /functions/v1/kudos/{K}/like` is called, **Then** an `kudo_like` row is created with `user_id=A, kudo_id=K, hearts=1 (or 2 if active special day)`; response is `200 { liked: true, like_count, hearts_added }`. If row already exists → no-op, same response with `hearts_added: 0`. (TC `91e102ba` — one like per user per kudos.)
2. **Given** user A is the sender of kudos `K`, **When** they call the same endpoint, **Then** `403 { error: { code: "kudo/cannot_like_own", message: "You cannot like your own kudos." } }` (TC `63645b03`).
3. **Given** user A previously liked `K`, **When** `DELETE /functions/v1/kudos/{K}/like` is called, **Then** the `kudo_like` row is deleted; response is `200 { liked: false, like_count }`.
4. **Given** the current date falls inside a `special_day` row (admin-configured), **When** a like is created, **Then** `kudo_like.hearts = 2` and the response's `hearts_added` is `2` (TC `31936b72`). Unlike removes both hearts.
5. **Given** an attempt to like a non-existent kudos id, **When** called, **Then** `404 { code: "kudo/not_found" }`.
6. **Given** an unauthenticated request, **When** called, **Then** `401 { code: "auth/required" }`.

### User Story 7 — Sidebar stats & leaderboards (Priority: P2)

The sidebar shows totals (e.g. "388 KUDOS"), top senders, top receivers, and an "Open box" button (which opens the Secret Box dialog — that screen has its own spec).

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/kudos/stats` is called, **Then** the response is `200 { total_kudos, total_senders, total_receivers, total_hearts, top_senders: User5[], top_receivers: User5[] }`. Each `User5` item is `{ id, full_name, avatar_url, department_name, count }`.
2. **Given** no data, **When** called, **Then** counts are `0` and arrays are `[]` — FE renders "Chưa có dữ liệu" (TC `d662780b`).

### User Story 8 — Quick-input entry-point (Priority: P3 — contract reference)

The pill-shaped input at the top of the feed (TC `b35d40c1`) acts as an entry point that opens the Viết Kudo dialog/screen. This spec does **not** define the write endpoint — see the Viết Kudo spec. We only note that:

1. **Given** the user types in the pill and submits without going to the full dialog, **When** the FE chooses to POST directly, **Then** it MUST call the same endpoint defined in the Viết Kudo spec (`POST /functions/v1/kudos`). No alternate "quick-create" endpoint exists.
2. **Given** an empty message is submitted, **When** the FE blocks before sending, **Then** the BE never receives the request. If somehow it does, the Viết Kudo endpoint MUST also reject with `422` (validated upstream in that spec).

### Edge Cases

- **Profile click for a deactivated user** (TC `2cd77a0c`, `630f42a3`): `GET /functions/v1/users/{id}` returns `200` for active users; `404 { code: "user/not_found" }` for `is_active=false` (do not leak the existence of off-boarded accounts). Profile spec lives outside the 6 BE core; we expose only the minimal lookup needed here.
- **Image gallery overflow**: producers enforce max 5 images on write; reads MUST tolerate 0..N and return them ordered by `position`.
- **Hashtag normalisation**: stored as lowercase ASCII with diacritics stripped (the "dedicated" example in TC `0e56cacb` is already lowercase); produced by the Viết Kudo flow. This spec consumes them as-is.
- **Rate-limit on `POST /like`**: 60 likes/minute per user (anti-abuse). Excess → `429`.
- **Like under the special-day boundary**: the special-day check uses *server* time at the moment of the insert; toggling on/off across midnight does NOT retroactively change `hearts`.
- **Spotlight cap**: capped at 500 nodes per request; if more exist, an `X-Truncated: true` header is set and FE can advertise it.

---

## UI/UX Requirements *(BE-relevant references only)*

| Component | Node ID (from list_design_items) | BE Impact |
|-----------|----------------------------------|-----------|
| `A.1` Pill input (kudos quick-write) | — | Triggers Viết Kudo flow (separate spec) |
| `B.1.1` Hashtag filter dropdown | — | `GET /hashtags` + `?hashtag=` filter on feed |
| `B.1.2` Phòng ban filter dropdown | — | `GET /departments` + `?department=` filter on feed |
| `B.2` Highlight carousel | — | `GET /kudos/highlights` |
| `B.3..B.4` Kudos card | — | `GET /kudos` (list items) |
| `C.4.1` Heart button | — | `POST/DELETE /kudos/{id}/like` |
| `C.4.2` Copy Link button | — | None — FE clipboard only |
| `B.7.1` Total count badge | — | `kudos/stats.total_kudos` or `spotlight.total_kudos` |
| `B.7.2` Pan/Zoom button | — | None — FE control |
| `B.7.3` Spotlight search bar | — | `GET /kudos/spotlight?q=` |
| `D.1.8` "Mở quà" button | — | Opens Secret Box dialog (separate spec) |
| Sidebar leaderboard | — | `GET /kudos/stats.top_senders/top_receivers` |
| Profile click on avatar/name | — | `GET /users/{id}` |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `GET /functions/v1/kudos?limit=20&before=<iso>&hashtag=<slug>&department=<uuid>` — paginated feed; auth required.
- **FR-002**: `GET /functions/v1/kudos/highlights?hashtag=&department=` — top 5 per ranking strategy `hearts_30d`; auth required.
- **FR-003**: `GET /functions/v1/kudos/spotlight?q=` — aggregated recipient counts, cap 500; auth required.
- **FR-004**: `GET /functions/v1/kudos/stats` — global totals + top-5 leaderboards; auth required.
- **FR-005**: `GET /functions/v1/hashtags?limit=50` — for filter dropdown; auth required.
- **FR-006**: `GET /functions/v1/departments` — for filter dropdown; auth required.
- **FR-007**: `POST /functions/v1/kudos/{id}/like` — toggle-on like; idempotent; sender forbidden; auth required.
- **FR-008**: `DELETE /functions/v1/kudos/{id}/like` — toggle-off; idempotent; auth required.
- **FR-009**: `GET /functions/v1/users/{id}` — minimal profile lookup `{ id, full_name, avatar_url, department_name, is_active }`; auth required; `404` for inactive.
- **FR-010**: All endpoints return `viewer_has_liked` and `viewer_is_sender` flags on `Kudo` items so the FE renders heart state and disables it for own kudos in a single round-trip.
- **FR-011**: Hashtag clicks reuse the same `?hashtag=` filter — there is no separate "tag detail" endpoint at MVP.
- **FR-012**: Filter parameters are passed to BOTH `/kudos` and `/kudos/highlights` to keep the page consistent.

### Technical Requirements

- **TR-001 (Security)**: every endpoint verifies JWT; all writes are RLS-scoped to `auth.uid()`. The like/unlike Edge Function uses an `RPC` (Postgres function) so the sender-check happens atomically with the insert/delete inside one transaction.
- **TR-002 (Performance)**:
  - `GET /kudos` p95 ≤ 300 ms (list of 20 with joins) — requires composite index on `kudo(created_at desc)` and indexes on `kudo_hashtag(hashtag_slug)`, `kudo(receiver_department_id, created_at desc)`.
  - `GET /kudos/highlights` p95 ≤ 200 ms — implemented as a materialised view refreshed every 60 s.
  - `GET /kudos/spotlight` p95 ≤ 400 ms — group-by on `kudo.receiver_id`, cap 500.
  - `POST /like` p95 ≤ 120 ms.
- **TR-003 (Rate-limits)**: `/kudos` 60/min/user; `/like` 60/min/user; `/spotlight` 30/min/user; `/stats` 30/min/user.
- **TR-004 (Caching)**: `/hashtags`, `/departments` may be cached privately for 60s per user (no shared cache because of locale considerations); `/kudos/highlights` may be cached server-side via the materialised view.
- **TR-005 (Schema integrity)**: `kudo_like (kudo_id, user_id)` primary key prevents duplicates at DB layer regardless of app bugs.

### Key Entities

- **`kudo`**
  - `id uuid primary key default gen_random_uuid()`
  - `sender_id uuid not null references app_user(id)`
  - `receiver_id uuid not null references app_user(id)`
  - `message text not null` CHECK `char_length(message) between 1 and 1000` (length cap from typical kudos product; refine in Viết Kudo spec)
  - `is_anonymous boolean not null default false` (foreshadowing the "Ẩn danh" frame `p9vFVBE_tc`)
  - `created_at timestamptz not null default now()`
  - Indexes: `(created_at desc)`, `(receiver_id, created_at desc)`, `(sender_id, created_at desc)`
  - RLS: `select` for any authenticated user; `insert` only by the sender (`auth.uid() = sender_id`); `update`/`delete` only by sender within 5 minutes of creation (decision recorded in Viết Kudo spec — referenced here).

- **`kudo_hashtag`**
  - `kudo_id uuid not null references kudo(id) on delete cascade`
  - `hashtag_slug text not null references hashtag(slug)`
  - PK `(kudo_id, hashtag_slug)`
  - Index `(hashtag_slug)`

- **`hashtag`**
  - `slug text primary key` CHECK `slug ~ '^[a-z0-9-]{1,32}$'`
  - `name text not null` (display form, e.g. `IDOL GIỚI TRẺ`)
  - `usage_count int not null default 0` (denormalised, maintained by trigger on `kudo_hashtag` insert/delete)
  - `created_at`

- **`kudo_image`**
  - `id uuid pk`, `kudo_id uuid fk on delete cascade`, `path text not null`, `position int not null` CHECK `position between 0 and 4`
  - Unique `(kudo_id, position)`

- **`kudo_like`**
  - `kudo_id uuid references kudo(id) on delete cascade`
  - `user_id uuid references app_user(id) on delete cascade`
  - `hearts int not null check (hearts in (1,2))`
  - `created_at`
  - PK `(kudo_id, user_id)`
  - RLS: `select` for any authenticated; `insert`/`delete` only `auth.uid() = user_id`; the sender-check (cannot like own) is enforced by an RPC, not by RLS, to allow the function to return a precise error code rather than a generic policy-deny.

- **`department`**
  - `id uuid pk`, `name text unique not null`, `created_at`
  - Seeded in migration.

- **`app_user.department_id`** (FK to `department`)
  - Added by an `alter table` migration; populated on first login or by an admin sync.

- **`special_day`**
  - `id uuid pk`, `starts_at timestamptz`, `ends_at timestamptz` (CHECK `ends_at > starts_at`), `hearts_per_like int not null default 2 check (hearts_per_like in (1,2))`, `note text`
  - RLS: `select` any authenticated; `insert/update/delete` admin only.

- **`kudo_highlights_mv`** (materialised view)
  - Columns: same as `kudo` plus `total_hearts`, `rank`.
  - Refreshed by `refresh materialized view concurrently` on a 60s cron (Supabase pg_cron).

---

## API Dependencies

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/kudos` | GET | required | Paginated feed (with filters) |
| `/functions/v1/kudos/highlights` | GET | required | Top 5 carousel |
| `/functions/v1/kudos/spotlight` | GET | required | Word-cloud data + search |
| `/functions/v1/kudos/stats` | GET | required | Sidebar totals + leaderboards |
| `/functions/v1/kudos/{id}/like` | POST | required | Like (idempotent) |
| `/functions/v1/kudos/{id}/like` | DELETE | required | Unlike (idempotent) |
| `/functions/v1/hashtags` | GET | required | Filter dropdown source |
| `/functions/v1/departments` | GET | required | Filter dropdown source |
| `/functions/v1/users/{id}` | GET | required | Profile lookup on avatar click |
| `/functions/v1/kudos` (POST) | POST | required | **Defined in Viết Kudo spec** — referenced only |

---

## Success Criteria *(mandatory)*

- **SC-001**: 100% of BE-relevant ACs map to ≥ 1 automated test.
- **SC-002**: p95 latency targets in TR-002 met under a synthetic load of 1k req/min mixed (`/kudos:60%`, `/highlights:10%`, `/spotlight:10%`, `/stats:10%`, `/like:10%`).
- **SC-003**: Zero duplicate likes possible — verified by a contention test that fires 50 concurrent `POST /like` for the same `(user, kudos)` pair and asserts exactly one `kudo_like` row exists.
- **SC-004**: Sender cannot like own kudos — verified directly and via the integration test in US6.

---

## Out of Scope

- The kudos **write** path (handled in Viết Kudo spec).
- Spam / moderation rules (handled by Admin - Review content screens, future spec).
- Image upload / processing — see Viết Kudo spec.
- Realtime push of new kudos to the feed (FE polls every 30s for MVP; Supabase Realtime is a candidate upgrade).
- The Secret Box dialog — separate spec (`J3-4YFIpMM`).
- The Profile detail page (`bEpdheM0yU` / `hSH7L8doXB` — out of the current 6 BE core, only the minimal `/users/{id}` lookup is exposed here).
- Copy-link clipboard behaviour (FE only).
- Pan / zoom on Spotlight (FE only).

---

## Dependencies

- [x] Constitution document exists.
- [x] Login spec defines `app_user` and `role`.
- [x] Homepage SAA spec defines `notification` (this spec will produce `kudo.received` notifications on insert — written in Viết Kudo spec).
- [ ] Migrations: `department` + seed, `hashtag`, `kudo`, `kudo_hashtag`, `kudo_image`, `kudo_like`, `special_day`, `kudo_highlights_mv` + cron — Phase 3.
- [ ] `pg_cron` extension enabled (Supabase Pro feature) — required for the highlights MV refresh. Fallback: refresh-on-read with TTL cached in the Edge Function.

---

## Notes

- **Department filter ambiguity** (TC `159fed13`): the test case says "filter Kudos list by department" but doesn't say whose department. We pick `receiver.department_id` because the headline narrative of the page is "who is being thanked"; sender-department filtering is a candidate follow-up via `?sender_department=`.
- **Highlight materialised view vs ad-hoc query**: with 1k+ kudos a `top-5 by total_hearts` query becomes expensive; an MV gives us a stable p95. The 60s refresh interval matches the design's polling cadence and keeps "live" feeling without burning CPU.
- **Why a separate RPC for like instead of straight RLS-guarded insert**: RLS would deny "sender liking own kudos" only via policy `using` — that surfaces as `403 forbidden_by_policy` from PostgREST, which is too coarse. A SQL function lets us return a precise `kudo/cannot_like_own` code and audit-log the attempt if needed.
- **`is_anonymous`** is included on `kudo` because the design has an "Ẩn danh" frame; when `true`, the response masks `sender` to `{ id: null, full_name: "Ẩn danh", avatar_url: null, department_name: null }`. The Viết Kudo spec will own the rules for setting this flag.
