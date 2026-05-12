# Implementation Plan: Hệ thống giải (Frontend)

**Frame ID**: `zFYDgyj_pD`
**Frame Name**: `Hệ thống giải`
**Date**: 2026-05-12
**Spec**: [`specs/zFYDgyj_pD-he-thong-giai/spec.md`](./spec.md)
**Status**: Draft

---

## Summary

Authenticated, read-only catalog page at `/awards` (route folder: `app/awards/page.tsx`) rendering the six SAA 2025 awards in one server fetch. The route shell is a Server Component that auth-gates via `lib/supabase/server.ts` and calls `GET /functions/v1/awards?detail=true&locale=<user.locale>` once. Cards are pure RSC markup; a thin Client Component owns the scroll-spy behaviour using `IntersectionObserver` and `aria-current` updates against the sticky left-rail nav. Currency is always rendered with `Intl.NumberFormat('vi-VN', …, 'VND')` regardless of UI locale (FE-side decision recorded in spec Notes). All BE contracts live in [BE spec](../../../../backend/.momorph/specs/zFYDgyj_pD-he-thong-giai/spec.md).

> Note on route folder: spec mentions URL `/he-thong-giai`; constitution layout pins the route folder at `app/awards/`. The folder stays `app/awards/page.tsx`; if a Vietnamese-slug URL is required, it's a one-line `redirect` or middleware rewrite. This plan ships `/awards`.

---

## Technical Context

- **Language/Framework**: TypeScript (strict) / Next.js 14 App Router
- **Primary Dependencies**: React 18, `@supabase/supabase-js`, `clsx`, `tailwind-merge`
- **Database**: N/A (FE consumes Edge Function only)
- **Testing**: Vitest (unit: currency formatter, slug↔hash mapper) + Playwright (E2E + `@axe-core/playwright`)
- **State Management**: Local `useState` + `useRef` inside the scroll-spy island; no global store (TR-004)
- **API Style**: REST (Supabase Edge Functions) — cookie-bound server fetch

---

## Constitution Compliance Check

- [x] **I. Frontend-Only Scope** — Zero BE work; consumes existing `GET /awards?detail=true`.
- [x] **II. Server Components by Default** — Page + 6 cards + title block + banner are RSC; only `AwardsCatalog` (scroll-spy island) and language-dropdown integration carry `"use client"`.
- [x] **III. Test-Driven Development** — Every AC mapped to Playwright or Vitest (see tasks.md).
- [x] **IV. A11y & Secure Coding** — `<nav aria-label>`, `aria-current="true"`, focus rings, `prefers-reduced-motion`, only `NEXT_PUBLIC_*` env vars, no service-role key.
- [x] **V. Spec-Driven Commits & Pin Discipline** — Single `feat(ui): implement he-thong-giai` commit; deps pinned.

**Violations**: none.

---

## Architecture Decisions

### Route Tree & RSC/Client Split

```
app/
└── awards/
    ├── page.tsx           # RSC — auth gate, server fetch, render
    ├── loading.tsx        # RSC — skeleton for slow auth/me probe
    └── error.tsx          # Client (Next.js boundary requires "use client") — retry button
```

- **`app/awards/page.tsx`** (RSC):
  1. `const supabase = createClient()` from `lib/supabase/server.ts` (cookie-bound).
  2. `const { data: { user } } = await supabase.auth.getUser()` → if null, `redirect('/login?next=/awards')` (FR-001, US2 AC1).
  3. `await getMe()` to resolve `locale`.
  4. `await getAwardsDetail(locale)` → 401 also redirects (US2 AC3); 5xx bubbles to `error.tsx`.
  5. Renders `<HeroKeyvisual />` + `<TitleBlock />` + `<AwardsCatalog awards={data.items} locale={locale} />` + `<KudosCtaBanner />`.
- **`app/awards/error.tsx`** (Client — Next.js requirement): shows "Đã có lỗi, vui lòng tải lại trang" + retry button calling `reset()`.

### Component Decomposition

`components/ui/` (server-safe primitives):

| File | Role | Mode | Props |
|---|---|---|---|
| `components/ui/Container.tsx` | Width-capped wrapper | Server | `children`, `className?` |
| `components/ui/Heading.tsx` | h1/h2 with consistent slot styling | Server | `as`, `id?`, `children` |
| `components/ui/Image.tsx` | Wrapper around `next/image` with `onError` placeholder hook | Server | `src`, `alt`, `loading?` |

`components/feature/awards/`:

| File | Role | Mode | Props |
|---|---|---|---|
| `components/feature/awards/HeroKeyvisual.tsx` | Top banner with campaign artwork | Server | — |
| `components/feature/awards/TitleBlock.tsx` | Supertitle "Sun* annual awards 2025" + heading "Hệ thống giải thưởng SAA 2025" | Server | `locale` |
| `components/feature/awards/AwardsCatalog.tsx` | Two-column layout: sticky `<LeftRailNav>` + cards column; owns `IntersectionObserver` and active-slug state; passes `activeSlug` to `<LeftRailNav>` | Client (refs + IO + state) | `awards: AwardDetail[]`, `locale: Locale` |
| `components/feature/awards/LeftRailNav.tsx` | `<nav>` with 6 anchor `<a href="#slug">`; renders `aria-current` from prop | Client (consumes interactive state) | `items: { slug, title }[]`, `activeSlug: string \| null` |
| `components/feature/awards/AwardCard.tsx` | `<section id="slug" aria-labelledby="slug-title">` with image + title + long desc + quantity + unit + value(s) | Server | `award: AwardDetail`, `locale: Locale` |
| `components/feature/awards/AwardValue.tsx` | Renders single OR dual VND value (Signature 2025 case) using `lib/format/currency.ts` | Server | `valueVnd: number`, `valueVndTeam?: number \| null` |
| `components/feature/awards/KudosCtaBanner.tsx` | Bottom "Sun* Kudos" banner with `<Link href="/kudos">` "Chi tiết" | Server | `locale` |

### State Strategy

- **Active section**: `useState<string | null>(null)` inside `AwardsCatalog`; updated by an `IntersectionObserver` watching each `<section>` ref.
- **URL hash**: `history.replaceState(null, '', '#' + slug)` (FR-006) — never `push`.
- **Locale**: server-resolved from `app_user.locale` via `getMe()`; passed as a prop. Switching language is owned by the global header (Login spec US3) which triggers `PATCH /me/language` then `router.refresh()` — re-runs this RSC with new locale (US4 AC1, route option (a)).
- **Scroll preservation across refresh**: Next.js App Router preserves scroll on `router.refresh()` by default; no extra code needed (US4 AC3).
- **No global store**.

### Data Fetching (`lib/api/`)

| File | Function | BE Endpoint |
|---|---|---|
| `lib/api/me.ts` (shared) | `getMe(supabase)` | `GET /functions/v1/me` |
| `lib/api/awards.ts` | `getAwardsDetail(supabase, locale)` | `GET /functions/v1/awards?detail=true&locale=<vi\|en\|ja>` |
| `lib/format/currency.ts` | `formatVnd(value)` → `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)` | — |
| `lib/i18n/awards.ts` | UI chrome strings (page title supertitle, banner labels) keyed by locale | — |
| `lib/format/slug.ts` | `slugToId(slug)` + `idToSlug` helpers | — |

All BE fetches use `supabase.functions.invoke` OR a `fetchJson` wrapper that pulls cookies via `lib/supabase/server.ts`. The route omits the Next.js fetch cache (`export const dynamic = 'force-dynamic'`) to preserve per-user safety (TR-003).

### Loading / Error / Empty States

- **Loading** (`app/awards/loading.tsx`): RSC skeleton — title placeholder, 6 card skeletons, nav skeleton. Brief because auth-gated SSR resolves before stream.
- **Empty** (defensive): if `data.items.length === 0`, render `<EmptyState message="Hệ thống giải thưởng đang được cập nhật" />`. Should never happen (BE seed guarantees 6 rows).
- **Error** (`app/awards/error.tsx`): "Đã có lỗi, vui lòng tải lại trang" + "Tải lại" button calling `reset()`.
- **Image failure**: each `AwardCard` renders a placeholder tile via `<Image onError>` (US6 AC2); no console error.
- **Auth failure** at SSR: 401 → `redirect('/login?next=/awards')` from the RSC (US2 AC3).

### A11y Notes

- `<nav aria-label="Danh mục giải thưởng">` wraps the 6 anchors; active item has `aria-current="true"`.
- Each card: `<section id="<slug>" aria-labelledby="<slug>-title">` with `<h2 id="<slug>-title">` (TR-006).
- Image alt = award title; decorative hero `alt=""`.
- Tab order: skip-link → header → left-rail items → cards → CTA → footer.
- Smooth-scroll respects `prefers-reduced-motion` via CSS `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }` + JS guard (`'scroll-behavior' in document.documentElement.style ? smooth : auto`).
- `IntersectionObserver` polyfill is *not* shipped; absence degrades to anchor-only nav with no active-state updates on manual scroll (US3 AC5 + spec Edge Cases).
- Body text + money values meet contrast ≥ 4.5:1.
- `prefers-reduced-motion` + invalid hash both handled defensively (no JS errors).

### Risks / Open Questions

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Sticky nav top offset depends on header height | Med | Low | Use a CSS variable `--header-offset` set on `<body>` by the header layout; `IntersectionObserver` uses `rootMargin: 'calc(-1 * var(--header-offset) - 16px) 0px -60% 0px'`. |
| `router.refresh()` after locale `PATCH` does not preserve scroll on some browsers | Low | Low | Read `window.scrollY` before `PATCH`, restore in a `useEffect` keyed by `locale` if mismatch. |
| `hero_image_path` resolution (signed URL vs public) not yet decided BE-side | Med | Low | Wrap in `resolveAwardImage(path, supabase)` helper; supports both via env switch `NEXT_PUBLIC_STORAGE_PUBLIC=true`. |
| Spec slug "/he-thong-giai" vs constitution route `/awards` | Low | Low | Ship `/awards`; document the redirect target in this plan. |
| Locale `en`/`ja` strings missing on Award rows | Low | Low | BE handles VI fallback (US4 AC2). FE renders as-is. |

**Open**: do we hard-code the 6 slug→title map for nav, or derive from API response? Decision: derive from `awards[]` order by `display_order` (already canonical), keep slugs from server. No FE-side ordering.

---

## Project Structure

```
frontend/
├── app/
│   └── awards/
│       ├── page.tsx                       # RSC: auth gate + fetch + render
│       ├── loading.tsx                    # RSC: skeleton
│       └── error.tsx                      # Client: error boundary
├── components/
│   ├── ui/
│   │   ├── Container.tsx
│   │   ├── Heading.tsx
│   │   └── Image.tsx
│   └── feature/awards/
│       ├── HeroKeyvisual.tsx
│       ├── TitleBlock.tsx
│       ├── AwardsCatalog.tsx              # "use client"
│       ├── LeftRailNav.tsx                # "use client"
│       ├── AwardCard.tsx
│       ├── AwardValue.tsx
│       └── KudosCtaBanner.tsx
├── lib/
│   ├── api/
│   │   ├── me.ts
│   │   └── awards.ts
│   ├── format/
│   │   ├── currency.ts
│   │   └── slug.ts
│   └── i18n/awards.ts
└── tests/
    ├── unit/
    │   ├── format-currency.test.ts
    │   └── format-slug.test.ts
    └── e2e/
        └── he-thong-giai.spec.ts
```

---

## Integration Testing Strategy

- **UI ↔ Logic**: scroll-spy click → smooth-scroll + `aria-current` update; locale switch → re-render.
- **App ↔ External API**: real `GET /awards?detail=true` against `supabase functions serve` with fresh seed (`supabase db reset`).
- **App ↔ Data Layer**: indirect through Edge Function; FE does not touch Postgres directly.
- **Mocking**: none — BE always real per constitution III.

---

## Dependencies & Prerequisites

- [x] FE constitution.
- [x] Spec approved.
- [x] BE Hệ thống giải seed (BE TR-003 + UPDATE) applied locally.
- [ ] `lib/supabase/server.ts` cookie-bound client (scaffolded).
- [ ] `lib/api/me.ts` (shared with Login screen — verify existence).
- [ ] Global header language dropdown shipped (Login spec US3) — required for US4 manual test.

---

## Next Steps

1. Run `/momorph.tasks` → `tasks.md`.
2. Implement Setup + Foundation.
3. Implement US-by-priority (P1: US1/US2/US3 → P2: US4/US5 → P3: US6).

---

## Notes

- VND formatting stays `vi-VN` regardless of UI locale — spec Notes locks this in.
- No `react-markdown` — `long_description` rendered with `white-space: pre-wrap`.
- BE batch endpoint `?detail=true` returns all 6 in one call; we never iterate `/awards/{slug}`.
- `dynamic = 'force-dynamic'` (TR-003) keeps per-user cache safety.
