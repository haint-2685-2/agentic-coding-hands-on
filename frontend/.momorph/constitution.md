<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Bump rationale: Initial ratification for the frontend layer — no prior constitution existed.
Modified principles: N/A (initial)
Added sections:
  - Core Principles (5)
  - Tech Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .momorph/templates/plan-template.md       ✅ no change required (template is layer-agnostic;
    plan.md author MUST tick "Constitution Compliance Check" against the 5 principles below)
  - .momorph/templates/spec-template.md       ✅ no change required (general)
  - .momorph/templates/tasks-template.md      ✅ no change required (general)
  - CLAUDE.md                                 ✅ already aligned with this constitution
  - docs/playbook.md                          ✅ already aligned (Phase plan matches)
Follow-up TODOs: none
-->

# SAA 2025 — Sun* Kudos Frontend Constitution

This constitution governs the **frontend** half of the SAA 2025 Sun* Kudos
project (Next.js 14 App Router + TypeScript + Tailwind + `@supabase/supabase-js`).
It is the single source of truth for technical decisions across
`specify → plan → tasks → implement-ui` phases.

The backend (Supabase BaaS) lives in [../../backend/](../../backend/) and has
its own constitution. Where the two layers must interoperate (auth, API
contracts, redirect URLs, error shape), this constitution defers to the
contracts published in [../../backend/.momorph/SCREENFLOW.md](../../backend/.momorph/SCREENFLOW.md).

## Core Principles

### I. Frontend-Only Scope (NON-NEGOTIABLE)
This repository MUST contain only UI screens, React components, client-side
state, styling, and routing. Generation of SQL migrations, RLS policies, Edge
Functions, or any server-authoritative business logic is FORBIDDEN here —
those live in [../../backend/](../../backend/). A spec, plan, or task that
requires new BE endpoints MUST stop and either (a) cite an existing BE endpoint
or (b) be rejected and redirected at intake. Rationale: keeps the FE codebase
focused on presentation + interaction, makes Supabase RLS the authoritative
authorization boundary, and prevents drift between layers.

### II. Server Components by Default (NON-NEGOTIABLE)
Every new component MUST start as a Server Component. A component may opt into
`"use client"` only when it (a) uses React state/effects/refs, (b) attaches
DOM event handlers, or (c) consumes browser-only APIs. Each `"use client"`
file MUST have a one-line comment above the directive explaining which of
(a)/(b)/(c) triggers it. Rationale: minimizes JS shipped to the browser,
keeps secrets out of the client bundle, and forces an explicit decision rather
than the silent default of `"use client"` everywhere.

### III. Test-Driven Development (NON-NEGOTIABLE)
For every Acceptance Criterion in a `spec.md`, an automated test MUST exist
before the PR merges. Pure helper logic in `lib/` uses Vitest unit tests; any
behavior involving routing, data fetching, or DOM interaction uses Playwright
E2E against a real local BE (`supabase start` + `functions serve`). Mocking
the BE in E2E is NOT acceptable. Coverage rule: every AC has at least one
automated test — AC coverage 100%. Rationale: the project is graded on spec
fidelity; tests bound to ACs are the cheapest way to make that fidelity
measurable and regression-proof.

### IV. Accessibility & Secure Coding at the Boundary
Every interactive UI MUST be operable by keyboard alone (Tab order matches
visual order, focus ring visible, focus trapped inside open modals, `Escape`
closes them). Color contrast meets WCAG 2.1 AA on text + UI components. Form
inputs have programmatic labels (`<label htmlFor>` or `aria-label`); error
messages reference inputs via `aria-describedby`. Secrets: only
`NEXT_PUBLIC_*` env vars may be referenced in client-bundled code; the
Supabase service-role key MUST NEVER appear in the frontend, even in Server
Components. All BE error responses follow the shape
`{ error: { code, message, fields? } }` (defined by the BE constitution);
the FE MUST render the human-readable `message` and MAY use `code` for
branching but MUST NOT silently swallow errors. Rationale: a11y is a Sun*
inclusion expectation, and the FE is the only place a leaked service-role key
becomes immediately exploitable from anywhere on the internet.

### V. Spec-Driven Commits & Pin Discipline
Each screen is delivered as one Conventional-Commits commit:
`feat(ui): implement <screen>`. Branch names follow `feature/fe-<scope>`,
`fix/fe-<scope>`, `chore/fe-<scope>`, `docs/fe-<scope>`, `test/fe-<scope>`.
Dependency versions in `package.json` MUST be pinned to a concrete version or
caret-range that was the published latest at the time of commit — no
unconstrained `*` or `latest`. Phase-prefixed commits defined in
`docs/playbook.md` (`chore:`, `docs(spec):`, `docs(plan):`, `feat(ui):`,
`test:`, `docs:`) are the canonical set for this project. Rationale:
phase-tagged commits map cleanly onto the practice-report deliverable, and
pinned deps make the Phase-3 implement step reproducible.

## Tech Stack & Constraints

- **Framework**: Next.js 14 (App Router only — no Pages Router files).
- **Language**: TypeScript with `strict: true`. No `any`-typed identifiers,
  no `// @ts-ignore` without a one-line justification comment.
- **Styling**: Tailwind CSS utility-first. No standalone `.css` files except
  `app/globals.css`. CSS-in-JS libraries are FORBIDDEN.
- **State**: Built-in React + Next.js primitives (`useState`, Server Actions,
  URL search params). Global stores (Redux, Zustand) require a written
  justification in the screen's `plan.md`.
- **Data fetching**:
  - Server Component → `createClient()` from `lib/supabase/server.ts` (cookie-bound).
  - Client Component → `createClient()` from `lib/supabase/browser.ts`.
  - Mutations from Client Components SHOULD use Server Actions; if not, they
    MUST go through a typed wrapper under `lib/api/`.
- **Auth**: Google OAuth via Supabase Auth, restricted to
  `@sun-asterisk.com` (configured server-side). No alternate provider may be
  added by the FE without a BE constitution amendment.
- **Imports**: Path alias `@/*` configured in `tsconfig.json`. Deep relative
  imports (`../../..`) are discouraged inside `app/` and `components/`.
- **Formatting**: Prettier defaults — 2-space indent, single quotes for TS,
  trailing commas, semicolons.
- **Repository layout** (target):
  ```
  app/                      # Next.js App Router pages (1 dir per route)
    (auth)/login/
    kudos/
    kudos/new/
    awards/
    awards/[id]/
    secret-box/
    page.tsx                # Homepage SAA
  components/
    ui/                     # Headless primitives (Button, Card, Dialog, ...)
    feature/                # Feature-specific composed blocks
  lib/
    supabase/
      browser.ts            # createBrowserClient
      server.ts             # createServerClient (cookie-bound)
    api/                    # Typed wrappers for Edge Functions
  tests/
    e2e/                    # Playwright
  .momorph/
    constitution.md
    SCREENFLOW.md
    specs/<screenId>-<slug>/
  ```

## Development Workflow & Quality Gates

- **Phase order is mandatory**: every screen passes through
  `momorph.specify → momorph.reviewspecify → momorph.plan → momorph.reviewplan
  → momorph.tasks → momorph.implement-ui`. Skipping a phase is FORBIDDEN — if
  a later phase reveals a gap, return to the earlier phase, do not patch forward.
- **Constitution gate (in plan.md)**: every plan MUST tick the "Constitution
  Compliance Check" block against the 5 principles above before tasks are
  generated. Violations require a written justification entry in that block.
- **Test command (baseline)**:
  ```bash
  # Pre-requisite: BE local stack running (see ../../backend/docs/docker.md)
  cd ../backend && supabase start
  cd ../backend && supabase functions serve --no-verify-jwt &
  cd ../frontend

  pnpm typecheck                                # tsc --noEmit (zero errors)
  pnpm lint                                     # next lint (zero warnings)
  pnpm build                                    # production build succeeds
  pnpm e2e                                      # Playwright golden paths
  ```
- **Definition of Done for a screen**: spec + plan + tasks committed; all ACs
  have passing tests; `pnpm typecheck` + `pnpm lint` + `pnpm build` green;
  Playwright E2E green against a fresh BE `supabase db reset`; no service-role
  key in any bundled chunk; Conventional-Commit `feat(ui)` commit landed.

## Governance

- This constitution supersedes ad-hoc preferences and any conflicting guidance
  in `CLAUDE.md` or `docs/playbook.md`. Where those documents conflict with the
  constitution, the constitution wins and the other document MUST be amended in
  the same PR.
- **Cross-layer amendments**: principles I and IV depend on contracts owned by
  the BE constitution. A change that affects the cross-layer contract (e.g.
  error-shape, auth domain) MUST be made first in BE, then mirrored here.
- **Amendment procedure**: open a PR that (a) edits this file, (b) bumps the
  version per the rules below, (c) updates the Sync Impact Report at the top,
  and (d) updates any dependent templates flagged in the report. Approval
  requires the project owner.
- **Versioning policy** (semantic):
  - MAJOR — a NON-NEGOTIABLE principle is removed, redefined, or made optional.
  - MINOR — a new principle or section is added, or scope of an existing
    principle is materially expanded.
  - PATCH — wording, typo, or clarifying refinement with no semantic change.
- **Compliance review**: at the end of each phase commit, the author confirms
  the artifacts produced satisfy this constitution. The Phase-5 practice
  report MUST cite any deviations and their justifications.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12
