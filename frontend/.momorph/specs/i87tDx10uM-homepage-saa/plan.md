# Implementation Plan: Homepage SAA (Frontend)

**Frame ID**: `i87tDx10uM`
**Frame Name**: `Homepage SAA`
**Date**: 2026-05-12
**Spec**: [`./spec.md`](./spec.md)
**Status**: Draft

---

## Summary

Render the public `/` landing page (Homepage SAA) as a Next.js 14 RSC that composes seven surfaces — Header, Hero+Countdown, Event info, CTA pair, 6-card Awards grid, Kudos promo, Footer — plus a Floating widget. The RSC fetches `GET /config/event` + `GET /awards` cookie-bound with `revalidate: 60`; auth-aware surfaces (notification bell, avatar menu, language switch) are dynamically-imported client chunks so anonymous visitors do not pay their JS cost. State that lives client-side (countdown tick, notification poll, dropdown open/close, locale write) is scoped to the component that owns it — no global store.

---

## Technical Context

**Language/Framework**: TypeScript (strict) / Next.js 14 App Router
**Primary Dependencies**: `react`, `next`, `@supabase/supabase-js`, `tailwindcss`, `clsx`, `tailwind-merge`
**Database**: N/A (FE-only; Supabase Edge Functions are consumed via HTTP)
**Testing**: Vitest (unit, for helpers in `lib/`) + Playwright (E2E against local BE)
**State Management**: React `useState`/`useReducer` + URL/cookie. No global store.
**API Style**: REST over Supabase Edge Functions (`/functions/v1/*`); auth header injected by `@supabase/supabase-js` client.

---

## Constitution Compliance Check

*GATE: must pass before tasks.md is generated.*

- [x] **Principle I — FE-only scope**: All BE endpoints listed in spec `API Dependencies` already exist in `backend/.momorph/specs/i87tDx10uM-homepage-saa/spec.md`. No migrations / RLS / Edge Functions are introduced here.
- [x] **Principle II — RSC by default**: `app/page.tsx`, `components/feature/homepage/AwardsGrid.tsx`, the Hero, Event Info, CTA pair, Kudos promo, and Footer are Server Components. Only Countdown, NotificationBell, AvatarMenu, LanguageSwitch, and FloatingWidget carry `"use client"` (each with the trigger comment per Principle II).
- [x] **Principle III — TDD**: Each P1 acceptance scenario has a Playwright test before the corresponding component is wired (tasks T0xx flagged as `[TEST-FIRST]`). Pure helpers (`formatCountdown`, `padTwo`) get Vitest unit tests.
- [x] **Principle IV — A11y & security**: Bell + avatar use `aria-haspopup`/`aria-expanded`; countdown uses a single `<time>` with visually-hidden summary; no service-role key is referenced anywhere; only `NEXT_PUBLIC_*` env vars are read in client chunks.
- [x] **Principle V — Spec-driven commits**: One `feat(ui): implement homepage saa` commit; deps pinned in `package.json`.

**Violations**: none.

---

## Architecture Decisions

### Route tree

```
app/
├── layout.tsx                       # RSC — html/body, fonts, reads saa_locale cookie, mounts <Toaster/>
├── page.tsx                         # RSC — Homepage SAA; fetches event+awards server-side
├── error.tsx                        # Client — render-error fallback
├── loading.tsx                      # RSC — skeleton fallback for the route segment
└── globals.css                      # Tailwind entry
```

The `(auth)` segment and dedicated sub-routes (`/awards`, `/kudos`, `/profile`, `/admin`, `/standards`) are intentionally **out of scope** for this plan; only `app/page.tsx` is delivered here.

### Component decomposition

**RSC / client split** is dictated by Constitution Principle II.

| File | Layer | Role | Props |
|------|-------|------|-------|
| `app/page.tsx` | RSC | Fetches event config + awards, composes children, reads `saa_locale` cookie | — |
| `app/layout.tsx` | RSC | Root layout, `<Header/>` mount, Toaster | `children` |
| `components/feature/homepage/Header.tsx` | RSC | Logo + nav strip; mounts dynamic auth chunks | `me: Me \| null` |
| `components/feature/homepage/NotificationBell.tsx` | Client (state + poll) | Bell + badge + panel; polls unread count | `initialCount: number` |
| `components/feature/homepage/NotificationPanel.tsx` | Client (state) | Panel list, cursor pagination | `open, onClose` |
| `components/feature/homepage/AvatarMenu.tsx` | Client (state) | Dropdown trigger; admin-aware items | `me: Me` |
| `components/feature/homepage/LanguageSwitch.tsx` | Client (event + cookie write) | VN/EN dropdown; writes cookie + PATCH | `current: 'vi' \| 'en'`, `authed: boolean` |
| `components/feature/homepage/Hero.tsx` | RSC | "Root Further" copy + Countdown wrapper | `eventConfig: EventConfig` |
| `components/feature/homepage/Countdown.tsx` | Client (setInterval) | Three Days/Hours/Minutes tiles + Coming soon | `eventStartAt: string \| null`, `isStarted: boolean` |
| `components/feature/homepage/EventInfo.tsx` | RSC | Date/venue/broadcast static block | `info` |
| `components/feature/homepage/CtaPair.tsx` | RSC | About Awards / About Kudos buttons | — |
| `components/feature/homepage/AwardsGrid.tsx` | RSC | 6-card responsive grid | `awards: Award[]` |
| `components/feature/homepage/AwardCard.tsx` | RSC | Single card link to `/awards#<slug>` | `award: Award` |
| `components/feature/homepage/KudosPromo.tsx` | RSC | Narrative card → `/kudos` | — |
| `components/feature/homepage/Footer.tsx` | RSC | Footer nav + copyright | — |
| `components/feature/homepage/FloatingWidget.tsx` | Client (state + focus trap) | Bottom-right FAB + popover | — |
| `components/ui/Skeleton.tsx` | RSC | Generic shimmer | `variant` |
| `components/ui/Badge.tsx` | RSC | Numeric pill | `count, max` |
| `components/ui/IconButton.tsx` | RSC | Round 40×40 button base | `aria-label, children` |
| `components/ui/Dropdown.tsx` | Client (state + focus trap) | Headless dropdown primitive | `trigger, items` |
| `components/ui/Toast.tsx` | Client | role="status" / role="alert" | `kind, message` |

Grouping: `components/ui/*` are reusable primitives (also consumed by `/kudos`); `components/feature/homepage/*` are tied to this screen.

### State strategy

- **Countdown**: `useState` for the ticking values inside `Countdown.tsx`. `setInterval` keyed on a `useEffect` cleaned up on unmount; recomputes from `Date.now()` (wall-clock) on every tick to avoid drift after tab-hide (Edge case 1, FR-002, AC US1.5).
- **Notification bell**: local `useState` for `{ unreadCount, panelOpen, items, nextCursor }`. Poll loop is a `useEffect` keyed on `document.visibilityState` + `panelOpen` (TR-006) — runs every 60s, paused while panel is open OR tab is hidden, single immediate refresh on focus regain.
- **Avatar menu / Language switch / Floating widget**: pure local `useState` for open/close.
- **Locale**: written to cookie `saa_locale` from the client; for authed users an additional `PATCH /me/language` call is fired. The RSC reads the cookie via `cookies()` to render the localized copy.
- **URL search params**: not used on this screen (TR-003). Hash navigation (`/awards#<slug>`) is handled by `<a href="…">` only.
- **Optimistic updates**: mark-one-read flips `notification.read_at` in local store and decrements badge; failure rolls back via a captured snapshot and surfaces a toast (FR-009, TR-007).

### Data fetching

Typed wrappers under `lib/api/`:

| Wrapper | BE endpoint | Caller |
|---------|-------------|--------|
| `lib/api/config.ts#getEventConfig()` | `GET /functions/v1/config/event` | `app/page.tsx` (server, `revalidate: 60`) |
| `lib/api/awards.ts#listAwards(locale)` | `GET /functions/v1/awards?locale=…` | `app/page.tsx` (server, `revalidate: 60`) |
| `lib/api/me.ts#getMe()` | `GET /functions/v1/me` | `app/layout.tsx` (server, no-store) |
| `lib/api/notifications.ts#getUnreadCount()` | `GET /functions/v1/me/notifications/unread-count` | `NotificationBell.tsx` (client poll) |
| `lib/api/notifications.ts#listNotifications(cursor?)` | `GET /functions/v1/me/notifications?limit=20&before=…` | `NotificationPanel.tsx` (client) |
| `lib/api/notifications.ts#markRead(id)` | `PATCH /functions/v1/me/notifications/{id}` | `NotificationPanel.tsx` (client, optimistic) |
| `lib/api/notifications.ts#markAllRead()` | `POST /functions/v1/me/notifications/mark-all-read` | `NotificationPanel.tsx` (client) |
| `lib/api/me.ts#patchLanguage(locale)` | `PATCH /functions/v1/me/language` | `LanguageSwitch.tsx` (client) |

All wrappers return a typed union `{ ok: true, data } | { ok: false, error: ApiError }` (TR-005). Auth header is injected by the Supabase client; cookie session is shared between server/client via `@supabase/ssr`.

### Loading / error / empty states

| Surface | Loading | Error | Empty |
|---------|---------|-------|-------|
| Countdown | three `--` tiles + "Coming soon" | three `--` tiles, hero still renders, telemetry logged | `event_start_at: null` → `-- -- --` (Edge case 6) |
| Awards grid | 6 skeleton cards (Suspense fallback) | inline `<p>Không tải được awards. Thử lại.</p>` + retry button | "Sắp công bố" (Edge case 4) |
| Notification bell | bell with no badge until first count | hide badge on 401, signal auth refresh (US3 AC6) | no badge when `unread_count === 0` |
| Notification panel | row-level shimmer | `<p>Có lỗi xảy ra</p>` + retry | "Bạn chưa có thông báo" |
| Avatar menu | n/a (server-rendered shell) | `/me` 403 → "Tài khoản bị tạm khoá" banner + signOut | n/a |
| Floating widget | n/a | n/a | n/a |

### A11y notes

- Tab order: logo → nav → bell → lang → avatar → main → footer (FR-013, TR-009).
- `NotificationBell`: `aria-label="Thông báo"`, `aria-haspopup="dialog"`, badge `aria-live="polite"`.
- `AvatarMenu`: `aria-haspopup="menu"`, `aria-expanded`, `Esc` closes and returns focus.
- `AwardCard`: a single `<a>` wraps image+title; the secondary "Chi tiết" visible link uses `aria-hidden="true"` to avoid double announcement.
- `Countdown` tiles wrapped in one `<time datetime="…">` with a visually-hidden summary ("Còn 12 ngày 04 giờ 17 phút").
- Focus ring visible on every interactive element; hit area ≥ 40×40.
- `useFocusTrap` (in `lib/a11y/`) shared with notification panel + avatar menu + floating widget.

---

## Risks & Open Questions

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `setInterval` drift on hidden tabs | High | Medium | Recompute from `Date.now()` each tick; refresh once on `visibilitychange` |
| `revalidate: 60` cache vs BE `max-age=60` mismatch | Low | Low | Same window on both sides; document in `lib/api/config.ts` |
| Anonymous bundle size regression from forgotten client imports | Medium | High | `next/dynamic` for bell/avatar/lang; CI check on `pnpm build` analyze output (SC-003) |
| 401 mid-session causing bell flicker | Medium | Medium | On 401 unmount bell once + signal auth layer; do not retry (US3 AC6) |
| Hash navigation race on `/awards` | Low | Low | Out of scope here; relies on `/awards` page hydration logic |

**Open questions**: none blocking — all unknowns are deferred to the dedicated `/awards`, `/profile`, `/admin`, `/standards` specs.

---

## Notes

- Localized copy decks live in `lib/i18n/<vi|en>/homepage.ts` and are imported by the RSC; selection driven by the `saa_locale` cookie (default `vi`).
- `ja` is not exposed in `LanguageSwitch` dropdown but is preserved on read (spec Notes).
- Anonymous bundle: bell/avatar/lang are `next/dynamic({ ssr: false })`-loaded inside `Header.tsx` only when `me !== null`.
- See [`./spec.md`](./spec.md) for FR/TR IDs and acceptance scenarios; this plan does not duplicate them.
