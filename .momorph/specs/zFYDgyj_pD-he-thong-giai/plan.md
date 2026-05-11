# Implementation Plan: Hệ thống giải (Server-Side)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Date**: 2026-05-11
**Spec**: [`spec.md`](./spec.md)

Smallest plan of the project — pure extension of the `award` entity defined in Homepage SAA.

---

## Constitution Compliance Check

| Principle | Pass? | Note |
|---|---|---|
| I-V | ✅ | No new pattern; reuses existing infra. |

**Violations**: none.

---

## Technical Context (delta)

| Aspect | Choice |
|---|---|
| Public vs private split | `/awards` (public, summary) — already implemented in Homepage. `/awards/{slug}` (auth, full) — NEW. `/awards?detail=true` (auth, batch full) — overload of existing handler. |
| Money figures | Stored as `bigint` (cents avoided — just whole VND). Returned as int; FE formats. |

---

## File Tree (delta)

```text
supabase/
├── migrations/
│   └── 20260514090000_alter_award_detail.sql       # ← NEW (add columns + UPDATE seed data)
└── functions/
    ├── awards/index.ts                             # ← EXTEND to handle `?detail=true` (requires auth)
    └── awards-slug/index.ts                        # ← NEW (GET /awards/{slug}, auth required)
└── tests/
    └── integration/
        ├── hethonggiai_us1_detail.test.ts          # ← NEW
        └── hethonggiai_us2_public_summary_unchanged.test.ts  # ← NEW (regression)
```

---

## Architecture Decisions

### AD-1 — Split public summary vs private detail
**Decision**: keep money figures and long descriptions behind auth. Public `/awards` returns only `{ id, slug, title, short_description, hero_image_path, display_order }`. Auth-required `/awards/{slug}` and `/awards?detail=true` return the full record.

**Why**: prize money is sensitive — should not be queryable by anonymous internet traffic. Sun-ers are signed in for the screen anyway.

### AD-2 — `unit_type` stored in Vietnamese
**Decision**: column CHECK constraint enforces `unit_type in ('Đơn vị','Tập thể','Cá nhân')`. FE maps to localised strings.

**Why**: design literally uses these labels. Adding a translation table for 3 strings is overkill.

---

## Research Findings

- The Homepage plan already defines the localised projection function for `award.title_*` / `award.short_description_*`. The same helper extends to `long_description_*` — no new pattern.
- A single `alter table` migration is the cleanest path; `update award set ...` for the 6 rows in the same migration ensures atomicity.

---

## Implementation Strategy

1. Migration (5 minutes).
2. Test for `/awards/{slug}` (1 file).
3. Implement `awards-slug/`.
4. Extend `awards/index.ts` for `?detail=true`.
5. Regression test for the public endpoint (ensure money figures don't leak).

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Money figures accidentally returned to anon clients | Low | High | Regression test in `hethonggiai_us2_public_summary_unchanged.test.ts` enumerates expected fields. |
| `unit_type` enum mismatch across locales | Low | Low | CHECK constraint enforces VN literals; FE maps. |

---

## Integration Testing Strategy (delta)

| Test file | AC mapping |
|---|---|
| `hethonggiai_us1_detail.test.ts` | US1 AC1-4 (locale projection, fallback, 404, 401 unauth) |
| `hethonggiai_us2_public_summary_unchanged.test.ts` | US2 AC1-2 (public response shape, leak check) |

---

## Notes

- Smallest plan in the project; expected ~30 minutes of implementation time.
- Numbers per `spec.md` Key Entities table match design TC ID-6 exactly — verify in the migration UPDATE.
