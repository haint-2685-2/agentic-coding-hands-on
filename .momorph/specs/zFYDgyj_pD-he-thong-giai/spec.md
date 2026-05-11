# Feature Specification: Hệ thống giải (Server-Side)

**Frame ID**: `zFYDgyj_pD`
**Frame Name**: `Hệ thống giải`
**File Key**: `9ypp4enmFmdK3YAFJLIu6C`
**MoMorph**: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
**Created**: 2026-05-11
**Status**: Draft
**Scope**: Server-side only — extend the `award` entity (defined in Homepage spec) with the detail fields needed for this page (long description, quantity, unit type, monetary value). Expose them on the existing `GET /awards` endpoint plus a `GET /awards/{slug}` detail endpoint. No new mutations. Layout, scroll-spy menu, hover effects, image sizing are FE concerns.

---

## Overview

The "Hệ thống giải" page is a single static detail view of the 6 SAA 2025 award categories. The same 6 awards are already returned in summary form by `GET /awards` (Homepage spec). This page additionally needs:

- A **long description** per award (paragraph-length, vs. the 1-2 line short description on the homepage cards).
- A **quantity** of awards in that category (e.g. Top Talent: 10).
- A **unit type** label (`Đơn vị` / `Tập thể` / `Cá nhân`).
- A **monetary value** in VND. Signature 2025 has *two* values (individual: 5M, team: 8M); all others have one.
- Same locale projection rules (vi / en / ja) as the homepage.

The page is **authenticated-only** (TC ID-1 — unauthenticated → redirect to login). This is the only access-control distinction from Homepage's `/awards`. We therefore split the endpoint: `GET /awards` stays public (homepage cards) and `GET /awards/{slug}` requires auth and returns the full record including financial details.

No write operations from this screen. The 6 awards remain seed-data; admin tooling to mutate them is outside the 6 BE core.

Design reference items: `C.1..C.6` left-rail menu (FE scroll-spy), `D.1..D.6` award detail cards. All static content; the BE only provides the data.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticated user fetches the awards detail (Priority: P1)

**Independent Test**: Integration test: with the 6 seeded awards extended with `long_description_*`, `quantity`, `unit_type`, `value_vnd`, `value_vnd_team`, call `GET /functions/v1/awards/top-talent?locale=vi`, assert `200` and all detail fields are present.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** `GET /functions/v1/awards/{slug}?locale=vi|en|ja` is called, **Then** the response is `200 { id, slug, title, short_description, long_description, hero_image_path, display_order, quantity, unit_type, value_vnd, value_vnd_team }`. `value_vnd_team` is `null` unless the award has a dual value (Signature 2025).
2. **Given** the same call is made with `?locale=en` and the locale's `long_description_en` is null, **When** called, **Then** the BE falls back to `long_description_vi`.
3. **Given** the slug does not match any active award (`is_active=false` or not in seed), **When** called, **Then** `404 { error: { code: "award/not_found" } }`.
4. **Given** an unauthenticated request, **When** called, **Then** `401 { code: "auth/required" }` — different from the public `/awards` list which remains anonymous.

### User Story 2 — Awards list endpoint stays consistent (Priority: P2)

**Acceptance Scenarios**:

1. **Given** the existing `GET /awards` (Homepage spec) is called, **When** the response is built, **Then** it returns *only* the summary fields (`id, slug, title, short_description, hero_image_path, display_order`) — long descriptions and money figures are NOT exposed to unauthenticated callers.
2. **Given** the FE wants the long data for all 6 in one round-trip (e.g. for a non-scroll-spy variant), **When** it calls `GET /functions/v1/awards?detail=true`, **Then** the response includes the detail fields *and* the endpoint requires auth (`401` otherwise). The default `detail=false` keeps the public list public.

### Edge Cases

- **`value_vnd_team` only set when relevant**: enforced by a CHECK at DB level so that all rows with `value_vnd_team is not null` have a corresponding flag (or by convention only Signature 2025 sets it; we keep it permissive).
- **Long description contains line breaks**: stored as `text` with `\n` preserved; FE renders.
- **Currency display**: BE returns an integer `value_vnd` (e.g. `7000000`); FE formats. The BE does NOT return a pre-formatted string.
- **Quantity zero or null**: not allowed in seed; quantity is a small positive integer in `[1, 100]`. Enforced by CHECK.

---

## UI/UX Requirements *(BE-relevant only)*

| Component | BE Impact |
|-----------|-----------|
| `D.1..D.6` Award detail cards | Consume `GET /awards/{slug}` (or `GET /awards?detail=true` for batch) |
| `C.1..C.6` Left-rail menu | None — FE scroll-spy reads slugs already from the list |
| `D.1.1` Picture-Award | None — FE renders `hero_image_path` |
| `D1` Sun* Kudos CTA at bottom | None — static FE link |

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `GET /functions/v1/awards/{slug}?locale=vi|en|ja` (auth required) returns the full award record.
- **FR-002**: `GET /functions/v1/awards?detail=true&locale=` (auth required) returns the array form of the same record for all active awards in `display_order` ASC.
- **FR-003**: `GET /functions/v1/awards` (public, default `detail=false`) continues to return summary only.
- **FR-004**: An invalid `?locale` value returns `422 { code: "validation/locale" }` consistent with Homepage spec.
- **FR-005**: `award.long_description_*` is up to 4000 characters per locale (CHECK constraint). Plain text only — no HTML/Markdown rendering on the server.

### Technical Requirements

- **TR-001**: Detail endpoint caching — `Cache-Control: private, max-age=300` (5 minutes). The data is stable; a fresh login session is fine to cache.
- **TR-002 (Security)**: confirm the auth gate works — an integration test sends the same request with and without a token; without → `401`, with → `200`.
- **TR-003 (Migration)**: a single `alter table award add column` migration adds: `long_description_vi text not null default ''` (later updated by a seed UPDATE), `long_description_en text not null default ''`, `long_description_ja text null`, `quantity smallint not null default 1` (CHECK 1..100), `unit_type text not null default 'Cá nhân'` (CHECK in `('Đơn vị','Tập thể','Cá nhân')` — note this is a Vietnamese enum; for EN/JA rendering the FE maps), `value_vnd bigint not null default 0` (CHECK ≥ 0), `value_vnd_team bigint null` (CHECK > 0 when not null).

### Key Entities

Extends `award` (defined in Homepage spec) with the columns above. Seed UPDATE in a follow-up migration fills the 6 rows:

| Slug | Quantity | Unit | Value VND | Value VND (team) |
|------|----------|------|-----------|------------------|
| `top-talent` | 10 | Cá nhân | 7,000,000 | — |
| `top-project` | 2 | Tập thể | 15,000,000 | — |
| `top-project-leader` | 3 | Cá nhân | 7,000,000 | — |
| `best-manager` | 1 | Cá nhân | 10,000,000 | — |
| `signature-2025-creator` | 1 | Cá nhân hoặc Tập thể | 5,000,000 | 8,000,000 |
| `mvp` | 1 | Cá nhân | 15,000,000 | — |

Per TC ID-6 — these are the canonical numbers from the design.

---

## API Dependencies

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/awards/{slug}` | GET | required | Single award detail |
| `/functions/v1/awards?detail=true` | GET | required | Batch detail variant |
| `/functions/v1/awards` (public, summary only) | GET | public | Defined in Homepage spec |

---

## Success Criteria *(mandatory)*

- **SC-001**: All 6 awards' detail values match TC ID-6 (canonical numbers) — verified by an integration test that hits the endpoint for each slug and asserts the exact values.
- **SC-002**: Public `/awards` continues to NOT leak money figures — verified by a contract test that asserts the public response omits `value_vnd`, `value_vnd_team`, `long_description_*`, `quantity`, `unit_type`.

---

## Out of Scope

- Admin endpoints to mutate awards (out of the 6 BE core; manual DB UPDATE in seed migrations is sufficient).
- Awards results / nominees / winners (separate future feature).
- The "Chi tiết" CTA on Sun* Kudos banner (no BE).
- Scroll-spy / left-rail menu (FE).

---

## Dependencies

- [x] Constitution.
- [x] Homepage SAA spec defines `award` base entity.
- [ ] Migration: `alter table award add column ...` + `update award set ...` for the 6 rows.

---

## Notes

- **Why split summary vs detail rather than one endpoint with role-gating**: keeps the public homepage queryable from CDN without auth, and keeps prize money behind the auth wall (sensitive — should not be public).
- **Why `unit_type` is a Vietnamese enum**: the design literally writes `Đơn vị` / `Tập thể` / `Cá nhân` and FE displays them verbatim in the VN locale. EN/JA FE bundles map to local strings. Keeping the column in VN keeps the DB simple and avoids a translation table.
- **Signature 2025 dual-value**: a single boolean flag column would also work; we keep `value_vnd_team` as a nullable column to avoid a magic-number convention.
