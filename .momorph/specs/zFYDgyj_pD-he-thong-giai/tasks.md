# Tasks: Hệ thống giải (Server-Side)

**Frame**: `zFYDgyj_pD-he-thong-giai`
**Prerequisites**: Homepage SAA implementation complete (defines `award` base entity).

---

## Phase 1: Migration

- [ ] T001 Migration `20260514090000_alter_award_detail.sql` — `ALTER TABLE award` adding `long_description_vi/_en/_ja`, `quantity`, `unit_type` (CHECK VN enum), `value_vnd`, `value_vnd_team`; then 6 `UPDATE award SET ...` statements with canonical numbers from spec | `supabase/migrations/...`
- [ ] T002 Verify migration: `supabase db reset` and `SELECT slug, quantity, value_vnd, value_vnd_team FROM award ORDER BY display_order;` matches spec table. | (no file)

---

## Phase 2: US1 — Detail endpoint

- [ ] T003 [US1] Write `hethonggiai_us1_detail.test.ts` — AC1 single slug returns full record; AC2 EN fallback to VI when null; AC3 unknown slug → 404; AC4 anon → 401. **RED** | `supabase/tests/integration/...`
- [ ] T004 [US1] Write `supabase/functions/awards-slug/index.ts` — Zod `?slug=` + `?locale=`; auth required via `requireUser`; project locale fields + fallback. | `supabase/functions/awards-slug/index.ts`

---

## Phase 3: US2 — Public summary regression + batch detail

- [ ] T005 [US2] Write `hethonggiai_us2_public_summary_unchanged.test.ts` — anon GET `/awards` returns 6 summary-only fields; assert NO `value_vnd`, `long_description_*`, `quantity`, `unit_type` keys. **RED** (currently passes by happenstance; this codifies it.) | `supabase/tests/integration/...`
- [ ] T006 [US2] Extend `supabase/functions/awards/index.ts` to support `?detail=true` — require auth in that branch; return full fields. | `supabase/functions/awards/index.ts`

---

## Phase 4: Polish

- [ ] T007 Final suite green. | (no file)

---

## Dependencies & Execution Order

```
T001 → T002 → T003 → T004 || T005 → T006 → T007
```

---

## Commit Strategy

One commit: `feat: implement awards detail (long descriptions, prize money, auth-gated)`.

---

## Notes

- Numbers to seed (UPDATE statements in T001):
  - `top-talent`: q=10, unit='Cá nhân', value=7_000_000
  - `top-project`: q=2, unit='Tập thể', value=15_000_000
  - `top-project-leader`: q=3, unit='Cá nhân', value=7_000_000
  - `best-manager`: q=1, unit='Cá nhân', value=10_000_000
  - `signature-2025-creator`: q=1, unit='Cá nhân hoặc Tập thể', value=5_000_000, value_team=8_000_000
  - `mvp`: q=1, unit='Cá nhân', value=15_000_000
- Long descriptions: pull from MoMorph `list_design_items` D.1..D.6 description fields during T001 authoring.
