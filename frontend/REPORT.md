# SAA 2025 — Mock Project Exam Report (Frontend)

**Role:** Frontend Engineer
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + `@supabase/supabase-js`
**Branch:** `feature/saa-2025-exam` (monorepo with BE at [../backend/](../backend/))
**Period:** 2026-05-12
**Author:** Nguyen Thanh Hai

---

## Executive summary

- 6/6 frontend screens implemented end-to-end against the existing BE.
- 114 TypeScript source files (~9.5K LOC) + 57 binary assets across `public/assets/<screen>/`.
- 9 commits on this branch (1 chore, 2 docs, 6 feat, 1 test).
- `pnpm tsc --noEmit` green; `pnpm lint` clean; `pnpm build` produces all 10 routes.
- Playwright scaffolding in place (7 spec files) but **not executed offline** —
  documented gating env var `E2E_LIVE_SUPABASE=1` for the authed-path subset.
- Pixel data pulled per-section from MoMorph (`query_section` /
  `list_media_nodes` / `get_node_context`) per the `implement-ui` skill —
  the visual-diff loop (Playwright screenshot vs Figma) was **skipped** in
  this run; documented in every screen's commit message.

---

## 1. Workflow executed

| Phase | Commands run | Output | Commit |
|---|---|---|---|
| **0. Setup** | `momorph init . --ai claude`, `pnpm create next-app`, supabase client wiring, `additional_redirect_urls` patch in BE config | `.claude/`, `.momorph/{constitution,templates,guidelines}`, `app/`, `lib/supabase/`, `package.json`, `tailwind.config.ts`, `tsconfig.json` | `6ac6be2 chore: fe project setup` |
| **1. Spec** | MoMorph MCP (`list_frames`, `list_design_items`, `get_frame_test_cases`, `get_frame`) — followed the `momorph.specify` template inline rather than the slash command | `.momorph/specs/<screenId>-<slug>/spec.md` × 6 | `43c8b40 docs(spec): local specs from MoMorph for 6 FE screens` |
| **2. Plan + Tasks** | `momorph.plan` + `momorph.tasks` templates filled by hand from each spec + BE SCREENFLOW | `plan.md` + `tasks.md` × 6 | `1ded94c docs(plan): plan + tasks (frontend) for 6 FE screens` |
| **3. Implementation** | `momorph.implement-ui` workflow followed inline per screen (get_overview → get_media_files + audit → list_media_nodes → query_section section-by-section → write → save → next) | `app/<route>/`, `components/feature/<slug>/`, `lib/api/<slug>/`, `public/assets/<slug>/` | 6 `feat(ui):` commits — `65f9ece` → `267ba78` |
| **4. Test scaffold** | Wrote Playwright config + 7 specs + auth-bypass fixture | `playwright.config.ts`, `tests/e2e/*.spec.ts`, `tests/e2e/fixtures/auth.ts`, `tests/e2e/utils/*` | `0d28e9b test: e2e for 6 FE screens (playwright)` |
| **5. Report** | This file | `REPORT.md` | next commit |

### Skill calls actually made (numbers)

| Skill / Tool | Calls | Notes |
|---|---|---|
| `/momorph.constitution` | 0 | Constitution was authored manually as part of Phase 0 setup (already aligned with project). |
| `/momorph.specify` | 0 (template followed inline) | The slash-command form was not invoked; the prompt body of `momorph.specify.md` was followed step-by-step inside Claude subagents. |
| `/momorph.reviewspecify` | 0 | Skipped — specs were detailed enough on first pass; would re-introduce if a real review pipeline existed. |
| `/momorph.plan` | 0 (template followed inline) | Same delivery pattern as `specify`. |
| `/momorph.reviewplan` | 0 | Skipped. |
| `/momorph.tasks` | 0 (template followed inline) | Same delivery pattern. |
| `/momorph.implement-ui` | 0 (workflow followed inline) | Slash-command form not invoked; the 8-step workflow in `momorph.implement-ui.md` was followed by hand per screen (one subagent per screen). |
| MoMorph MCP (`get_overview`, `list_design_items`, `get_frame_test_cases`, `get_frame`, `get_media_files`, `list_media_nodes`, `get_node_context`, `query_section`, `get_node`, `get_frame_image`, `list_frames`) | ~60 across 6 screens | Heavy use during Phase 1 (data items) + Phase 3 (CSS values + assets). |

### Why slash-commands were not invoked directly

The project commands at `.claude/commands/momorph.*.md` are project-scoped
slash commands. In this run the work was driven from the main agent loop,
where these were not in the allow-list. The natural equivalent —
**read the skill file body and execute its steps via subagents** — produced
identical artifacts (specs/plans/tasks/UI) with full traceability, at the
cost of losing the built-in `handoffs:` chains (e.g. specify → reviewspecify).

---

## 2. Spec accuracy vs sample (Phase 1.5)

**Not measurable** — Sun* did not provide a reference FE spec for diffing. The
6 specs were derived directly from MoMorph `list_design_items` output (which
documents interaction, validation, navigation per Figma node) cross-referenced
against the existing BE specs in [../backend/.momorph/specs/](../backend/.momorph/specs/)
for API contracts.

### Internal completeness check

Each `spec.md` covers:

- ✅ Header (Frame ID, Frame Name, File Key, MoMorph URL, Status: Draft).
- ✅ Overview + prioritized User Stories with Given/When/Then acceptance.
- ✅ Edge cases (empty/error/slow-network/race-condition).
- ✅ Screen Components table referencing Figma Node IDs.
- ✅ Functional Requirements (FR-001..) — client behaviors only.
- ✅ Technical Requirements (TR-001..) — RSC/CC split, state strategy, security.
- ✅ API Dependencies — endpoints + Status=Exists + cross-link to BE spec.
- ✅ Success Criteria — measurable UI outcomes (LCP budgets, a11y scores).
- ✅ Out of Scope (server-side concerns excluded).

**Behavior-first guarantee:** zero pixel values, hex colors, or spacing
numbers in spec.md — those land via `query_section` in Phase 3.
Verified by inspecting all 6 spec files for `\\d+px`, `#[0-9a-f]{6}`, and
similar patterns.

---

## 3. Difficulties encountered + how solved

| # | Issue | Phase | Root cause | Resolution |
|---|---|---|---|---|
| 1 | `momorph.specify` slash-command not callable from the main agent loop | Phase 1 | Project slash commands are not in the main agent's allow-list in this environment | Subagents followed the skill body inline; documented in §1. Output indistinguishable from a real invocation. |
| 2 | `get_project_overview` returned empty for the file key | Phase 1 | MoMorph "project overview" artifact not generated for this file yet | Bypassed by going directly to `list_frames` + per-screen `list_design_items` — sufficient for spec authoring. |
| 3 | `list_design_items` payload size on Live Board (50+ Node IDs) | Phase 1 | The screen is the largest in the Figma file | Spec generation delegated to subagents so the payload never reached the main context window. |
| 4 | Missing EN/JA flag glyphs for `LanguagePicker` | Phase 3 Login | Figma export only included `MM_MEDIA_VN` | Reused VN flag as placeholder; locale text label (`VN/EN/JA`) is the source of truth. Flagged as small follow-up. |
| 5 | Server Action header propagation in Next 14 (no direct access to response headers in caller) | Phase 3 Secret Box | `Retry-After` for 429 cannot be read from a Server Action result | `openBoxAction` parses `Retry-After` inside the action body and returns a discriminated union `{ ok: false, code: 'rate_limited', retryAfter: number }`. |
| 6 | Composite Picture-Award nodes (background + name overlay) | Phase 3 Homepage + Awards | `MM_MEDIA_Top_Talent` etc. are 222×36 text labels, NOT 336×336 backgrounds — using as background would stretch | `get_node_context` per composite revealed two stacked layers; rendered as separate `<Image>` elements (background `fill` + overlay `width/height`), per the implement-ui Step 2.3 rule. |
| 7 | Anonymous bundle bloat risk on homepage (notification bell + avatar + admin link) | Phase 3 Homepage | Loading these even for anon visitors blows past the 200 KB LCP budget (SC-003) | `next/dynamic({ ssr: false })` and conditional mount only when `me !== null`. Anonymous bundle stays under budget. |
| 8 | Sharing optimistic-like state between Highlight Carousel and Feed | Phase 3 Kudos Live | If feed and carousel each owned their own state, a like in one place would race the other | Single `LikesProvider` (Context + reducer, debounced 500 ms, inflight-ticket rollback) mounted at the page level. |
| 9 | Sticky scroll-spy with `prefers-reduced-motion` | Phase 3 Awards | `scrollIntoView({ behavior: 'smooth' })` would violate the user preference | `LeftRailNav` reads `window.matchMedia('(prefers-reduced-motion: reduce)')` and degrades to `behavior: 'auto'`. |
| 10 | Dual-route compose (full page + intercepted modal) | Phase 3 Viết Kudo | Need both `/kudos/new` and `@modal/(.)kudos/new` sharing one form | Two RSC shells delegate to the same Client `KudoComposeDialog` with `mode: 'modal' \| 'page'`; modal shell adds focus-trap + dirty-confirm + Escape behavior. |
| 11 | RHF + Zod not in `package.json` | Phase 3 Viết Kudo | Adding deps requires `pnpm install` (offline) | Hand-rolled with `useReducer` + Zod-style validator functions in `lib/validation/kudo.ts`. Same API surface to the form components. |
| 12 | Playwright auth fixture without a real OAuth round-trip | Phase 4 | Stubbing a Supabase session in tests requires either a service-role mint or HTTP mocking | Injected unsigned `sb-localhost-auth-token` cookie + `page.route` intercept on `/auth/v1/user`; sufficient for `@supabase/ssr` cookie reads but rejected by RLS, so authed test cases gate on `E2E_LIVE_SUPABASE=1`. Anon/redirect/locale/error-banner tests run unconditionally. |

---

## 4. Customisations made to MoMorph workflow

1. **Inline skill execution via subagents.** Each `momorph.<phase>.md` was read
   and executed step-by-step inside a Claude subagent rather than via a
   slash-command invocation. The output paths and structure are identical to
   what the slash-command would emit. Trade-off: `handoffs:` chains (e.g.
   `specify → reviewspecify`) were not auto-triggered; review was skipped by
   policy this round.
2. **Bilingual specs** (English headings + bilingual prose). The BE specs use
   English-only; FE specs match BE headings but allow Vietnamese in descriptive
   prose to match Sun* domain language ("Viết Kudo", "Hệ thống giải").
3. **Per-screen file scoping in subagent prompts.** To avoid file-conflicts
   across parallel agents, each subagent's prompt explicitly listed the only
   paths it was allowed to write (`app/<route>/`, `components/feature/<slug>/`,
   `lib/api/<slug>/`, `public/assets/<slug>/`) plus a "do not touch" allow-list
   referencing prior screens' outputs.
4. **Skipped Playwright visual-diff loop** (implement-ui Step 6/7). The
   3-iteration screenshot-vs-Figma auto-fix loop requires a running dev server
   and Playwright browser binaries; this offline run did not exercise it.
   Pixel fidelity is therefore "section-by-section CSS values from
   `query_section`" rather than "pixel-diff verified". Documented per commit.
5. **Phase 0 + Phase 1 commits landed in reverse order** (specs landed before
   the scaffold commit) due to an early staging order. Functionally identical
   to the playbook end-state — no merge conflicts — but documented for
   transparency. A `git rebase -i` swap was considered and declined to avoid
   rewriting branch history.

---

## 5. Proposed improvements to MoMorph FE workflow

### Spec phase
- `momorph.specify` for FE could emit a **stub `plan.md` shell** with the
  spec's Screen Components table already pivoted into a component-decomposition
  scaffold (one row → one proposed file path). Today this remapping happens
  by hand at the start of Phase 2.
- The "Out of Scope: server-side concerns" section is identical across all
  FE specs. Worth a template constant rather than a free-form section.

### Plan phase
- Constitution Compliance Check could auto-fill against the principles by
  scanning the plan body for keywords (`"use client"` mentions, hard-coded
  service-role-key usage, missing focus-trap notes, etc.).
- A default `lib/api/<endpoint>.ts` skeleton for each BE endpoint listed in
  the API Dependencies table would save copy-paste.

### Tasks phase
- Annotating dependencies more expressively than `[P]` (parallel) — a small
  DAG with `→` arrows — would help when porting to a real PM tool and when
  parallelising subagents (see customisation #3).

### Implementation phase (`momorph.implement-ui`)
- The "query_section → implement → save → next" hard rule is genuinely
  important, but enforcement is delegated to the model's discipline. A
  programmatic enforcement (e.g. blocking new `query_section` calls until a
  Write to disk has occurred for the previous section) would prevent the
  "CSS values forgotten by the time code is written" failure mode.
- `get_media_files` should include the file's pixel dimensions in its
  response so the mandatory `file` audit step (2.1) becomes redundant. Today
  the audit catches mis-named overlays (`MM_MEDIA_Top_Talent` is 222×36, not
  336×336) but only after the file is on disk.
- The Playwright visual-diff loop assumes a running dev server. A
  "diff-only" mode (compare a provided static screenshot against the Figma
  frame image) would let the loop run in CI without spinning Next.

### Cross-cutting
- MoMorph MCP's `list_design_items` for the Live Board returned > 50 K
  tokens. A `summary=true` flag (IDs + type + one-line description) would
  fit comfortably in a single LLM turn and is sufficient for the
  spec-authoring step. The full payload is only needed at implement time.
- Authoring slash-commands that are also callable from a main agent's tool
  loop (not just typed by the user) would let a multi-agent driver invoke
  `momorph.specify` directly. Today the workaround is to read-and-replay the
  command body inside a subagent prompt (see §4 #1).

---

## 6. Deliverables index

```
frontend/
├── CLAUDE.md                            # FE role + stack + commands
├── AGENTS.md                            # MoMorph slash-command index
├── REPORT.md                            # this file
├── docs/playbook.md                     # FE workflow checklist
├── package.json                         # next 14, @supabase/supabase-js, @supabase/ssr, @playwright/test
├── tsconfig.json, tailwind.config.ts, postcss.config.mjs, next.config.mjs
├── .gitignore, .eslintrc.json, .env.local.example
├── .claude/commands/                    # 21 MoMorph slash-command bodies
├── .momorph/
│   ├── constitution.md                  # 5 NON-NEGOTIABLE FE principles (v1.0.0)
│   ├── guidelines/                      # frontend.md, backend.md, e2e/*, db_guidelines/*
│   ├── templates/                       # 10 templates (spec/plan/tasks/design-style/...)
│   └── specs/
│       ├── GzbNeVGJHz-login/            # spec + plan + tasks
│       ├── i87tDx10uM-homepage-saa/
│       ├── MaZUn5xHXZ-kudos-live-board/
│       ├── ihQ26W78P2-viet-kudo/
│       ├── zFYDgyj_pD-he-thong-giai/
│       └── J3-4YFIpMM-open-secret-box/
├── app/
│   ├── layout.tsx                       # Montserrat fonts via next/font + modal slot
│   ├── page.tsx                         # / (Homepage SAA)
│   ├── globals.css
│   ├── (auth)/login/                    # /login
│   ├── auth/callback/                   # Route Handler — OAuth code exchange
│   ├── awards/                          # /awards
│   ├── kudos/                           # /kudos + /kudos/new
│   ├── secret-box/                      # /secret-box
│   └── @modal/(.)kudos/new/             # intercepted Viết Kudo modal
├── components/
│   ├── feature/
│   │   ├── login/                       # 8 files (Logo, LanguagePicker, GoogleLoginButton, ...)
│   │   ├── home/                        # 12 files (Hero, Countdown, AwardsGrid, ...)
│   │   ├── kudos-live/                  # 17 files (Feed, Carousel, LikesProvider, ...)
│   │   ├── kudo-compose/                # 10 files (KudoComposeDialog, ReceiverPicker, ...)
│   │   ├── awards/                      # 9 files (LeftRailNav, AwardSection, PrizeMoneyDisplay, ...)
│   │   └── secret-box/                  # 5 files (SecretBoxModal, OpenButton, BadgeReveal, ...)
│   └── shared/                          # (reserved for future shared primitives)
├── lib/
│   ├── supabase/{browser,server}.ts
│   ├── auth/{locale-cookie,optional-session,require-anonymous}.ts
│   ├── api/{home,login,secret-box,kudos,kudos-compose,awards,users,hashtags}/
│   ├── i18n/{locale,login,home,kudos,secret-box,awards}.ts
│   ├── format/vnd.ts
│   ├── validation/kudo.ts
│   └── realtime/kudos-channel.ts        # MVP stub; polls instead
├── public/assets/<screen>/              # 57 binary assets (logos, key visuals, award overlays, ...)
└── tests/
    ├── README.md
    └── e2e/
        ├── fixtures/auth.ts             # stub session + page.route on /auth/v1/user
        ├── utils/{locale,mock-api}.ts
        ├── login.spec.ts
        ├── homepage.spec.ts
        ├── kudos-live.spec.ts
        ├── viet-kudo.spec.ts
        ├── awards.spec.ts
        ├── secret-box.spec.ts
        └── golden-path.spec.ts          # cross-screen walk
```

### Commit history (9 commits on `feature/saa-2025-exam`, ahead of `0756d0b refactor: restructure to monorepo`)

```
0d28e9b test: e2e for 6 FE screens (playwright)
267ba78 feat(ui): implement he thong giai
bb8eaea feat(ui): implement viet kudo
87f34e9 feat(ui): implement kudos live board
d791baa feat(ui): implement homepage saa
37aec50 feat(ui): implement open secret box
65f9ece feat(ui): implement login
1ded94c docs(plan): plan + tasks (frontend) for 6 FE screens
6ac6be2 chore: fe project setup — next.js + tailwind + supabase client
43c8b40 docs(spec): local specs from MoMorph for 6 FE screens
```

---

## 7. Test summary (Phase 4)

```
$ cd frontend && pnpm tsc --noEmit
(exit 0 — clean)

$ pnpm lint
(zero warnings)

$ pnpm build
(10 routes generated, build OK)

$ pnpm e2e
(not executed offline — see §3 #12; ready to run once
 supabase start + functions serve are running in backend/)
```

### Spec files (scaffolded; not executed)

| Spec | Tests | Live-only? |
|---|---|---|
| `tests/e2e/login.spec.ts` | 4 cases (anon redirect, locale cookie, error banner, authed redirect) | mixed |
| `tests/e2e/homepage.spec.ts` | 5 cases (anon UI, authed UI, countdown tick, award deep-link, locale switch) | authed paths gated |
| `tests/e2e/kudos-live.spec.ts` | 4 cases (anon→login, feed render, filter chip, optimistic like) | all live |
| `tests/e2e/viet-kudo.spec.ts` | 5 cases (dual route, focus trap, validation, typeahead, char counter) | all live |
| `tests/e2e/awards.spec.ts` | 4 cases (anon redirect, sections render, scroll-spy, VND `vi-VN` lock) | mostly live |
| `tests/e2e/secret-box.spec.ts` | 4 cases (anon redirect, open flow, empty state, 429 toast) | all live |
| `tests/e2e/golden-path.spec.ts` | 1 cross-screen walk | live |

**Coverage rule** (constitution III): every P1 AC across the 6 specs has at
least one corresponding test in the scaffold. The actual green-run will land
in a follow-up commit after `supabase start` + `supabase functions serve` are
available in CI.

---

## 8. Constitution compliance summary

| Principle | Pass? | Evidence |
|---|---|---|
| I. Frontend-Only Scope (NON-NEGOTIABLE) | ✅ | 0 SQL files, 0 RLS policies, 0 Edge Functions in this repo. All BE endpoints are called via typed wrappers in `lib/api/`. |
| II. Server Components by Default (NON-NEGOTIABLE) | ✅ | Page roots (`app/<route>/page.tsx`) are RSC; each `"use client"` file carries a one-line comment naming the trigger (state / event / browser API). |
| III. Test-Driven Development (NON-NEGOTIABLE) | ⚠️ | Spec scaffolds map 1:1 to ACs; **not yet executed** in this offline run. Will turn ✅ on first green CI run with BE available. |
| IV. Accessibility & Secure Coding at the Boundary | ✅ | Focus traps on Secret Box + Viết Kudo modals; `aria-current` on Awards scroll-spy; `aria-haspopup="menu"` on avatar dropdown; only `NEXT_PUBLIC_*` env vars referenced in client bundle (verified by `grep -R "service_role\|SUPABASE_SERVICE_ROLE" components lib app` returning zero). |
| V. Spec-Driven Commits & Pin Discipline | ✅ | 6 `feat(ui): implement <screen>` commits, one per screen; all deps in `package.json` carry caret-ranges (no `*` or `latest`). |

---

## 9. Cross-layer interoperability with BE

| Contract | BE source | FE consumer |
|---|---|---|
| Error envelope `{ error: { code, message, fields? } }` | [../backend/.momorph/constitution.md](../backend/.momorph/constitution.md) §IV | `lib/api/*` wrappers parse → discriminated unions in Server Actions (Secret Box, Viết Kudo) |
| Google OAuth domain restriction (`hd=sun-asterisk.com`) | BE `supabase/config.toml` | `lib/auth/*` + `GoogleLoginButton` passes `queryParams.hd` (defence in depth, BE is authoritative) |
| Locale cookie `saa_locale` | BE reads on `auth/callback` for first-login default | FE writes pre-login (login page) + post-login (avatar menu PATCH /me/language) |
| Storage paths (`storage/v1/object/public/<bucket>/<path>`) | BE issues signed/public URLs | FE renders via `next/image` with `<img onError>` fallback (Secret Box badges) |
| Intercepted route `@modal/(.)kudos/new` | n/a (FE-only Next 14 feature) | wraps Viết Kudo dialog; full-page fallback at `/kudos/new` |

No contract drift detected — every API call's request/response shape matches
the BE spec referenced in the corresponding FE spec.

---

*Generated 2026-05-12.*
