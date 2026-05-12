<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Bump rationale: Initial ratification — no prior constitution existed.
Modified principles: N/A (initial)
Added sections:
  - Core Principles (5)
  - Tech Stack & Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .momorph/templates/plan-template.md       ⚠ pending — generic Frontend/Backend
    structure conflicts with server-side-only scope; recommend stripping the
    `# Frontend` block when planning SAA 2025 features, or fork a server-only
    plan template in a follow-up commit.
  - .momorph/templates/spec-template.md       ✅ no change required (general)
  - .momorph/templates/tasks-template.md      ✅ no change required (general)
  - CLAUDE.md                                 ✅ already aligned with this constitution
  - docs/playbook.md                          ✅ already aligned (Phase plan matches)
Follow-up TODOs:
  - TODO(plan-template): create a server-side-only variant or document that the
    "Frontend" section is intentionally left blank for this project.
-->

# SAA 2025 — Sun* Kudos Server Constitution

This constitution governs the **server-side** half of the SAA 2025 Sun* Kudos project
(Supabase BaaS — Postgres + RLS + Edge Functions). It is the single source of truth
for technical decisions across `specify → plan → tasks → implement` phases.

## Core Principles

### I. Server-Side Only Scope (NON-NEGOTIABLE)
This repository MUST contain only API, database, and business-logic artifacts.
Generation of UI screens, React components, CSS, asset rendering, or any
client-side rendering code is FORBIDDEN here — those live in a separate frontend
repository. A spec, plan, or task that requires UI generation MUST be rejected or
redirected at intake. Rationale: keeps the BE codebase focused, makes Supabase
RLS the authoritative boundary, and prevents drift between FE and BE concerns.

### II. RLS-First Data Access (NON-NEGOTIABLE)
Every table in the `public` schema MUST have Row-Level Security enabled with at
least one explicit policy that names who may read and who may write each row.
Tables without RLS, or with RLS enabled but no policy, are treated as a security
defect and MUST block merge. Before any new table is created the planning
artifact MUST answer "which authenticated principals can read/write which rows?"
Rationale: with Supabase, RLS is the only authorization layer between the public
PostgREST endpoint and the database; missing policies silently expose all rows.

### III. Test-Driven Development (NON-NEGOTIABLE)
For every Acceptance Criterion in a `spec.md`, a failing test MUST be written
*before* the implementation that satisfies it. Coverage rule: every AC has at
least one automated test (unit OR integration) — AC coverage 100%. Pure logic
uses unit tests; anything touching the database or an Edge Function uses an
integration test against a real local Supabase (`supabase start`) — mocks of the
database are NOT acceptable substitutes for the integration layer. Rationale:
the project is graded on spec fidelity; tests bound to ACs are the cheapest way
to make that fidelity measurable and regression-proof.

### IV. Validation & Secure Coding at the Boundary
Every Edge Function handler MUST validate inputs with Zod (or an equivalent
schema check) on the first executable line, before any I/O. Error responses MUST
follow `{ error: { code, message } }` and use the correct HTTP status
(400 / 401 / 403 / 404 / 409 / 422 / 500). Logs MUST NOT contain PII (email,
auth token, password, OTP, or any field marked sensitive in spec). Secrets are
read exclusively via `Deno.env.get(...)` — never hard-coded, never committed.
OWASP Top-10 mitigations are mandatory: parameterized queries / RPC only, authz
check after authn check, no trust of client-supplied identifiers. Rationale: the
public Supabase URL is internet-facing; the boundary is the only place we can
stop malformed or hostile traffic before it reaches Postgres.

### V. Migration & Commit Discipline
SQL migrations MUST be additive and append-only: filename
`supabase/migrations/YYYYMMDDHHMMSS_<short_description>.sql`. A migration once
committed MUST NOT be edited — corrections happen in a *new* migration. Commits
follow Conventional Commits in English, imperative mood; one commit per screen
during the implement phase; the phase prefixes defined in `docs/playbook.md`
(`chore:`, `docs(spec):`, `docs(plan):`, `feat:`, `test:`, `docs:`) are the
canonical set for this project. Branch names follow
`feature/<scope>`, `fix/<scope>`, `chore/<scope>`, `docs/<scope>`, `test/<scope>`.
Rationale: append-only migrations preserve replayability of the DB history;
phase-tagged commits map cleanly onto the practice-report deliverable.

## Tech Stack & Constraints

- **Auth**: Supabase Auth — email + password, JWT, email domain
  `@sun-asterisk.com`. No alternate provider unless added by amendment.
- **DB**: Supabase Postgres. SQL written in lowercase keywords, snake_case
  identifiers, every statement terminated with `;`.
- **Authorization**: Postgres RLS policies. No application-layer authz checks
  may replace RLS (they may complement it).
- **Runtime**: Supabase Edge Functions on Deno with TypeScript strict mode.
- **Imports**: Deno imports MUST be pinned — either `https://deno.land/...@x.y.z`
  or `npm:package@x.y.z`. Floating versions are FORBIDDEN.
- **Formatting**: Prettier defaults — 2-space indent, single quotes for TS,
  trailing commas.
- **Local dev**: `supabase start` (Docker) is the only supported local backend.
- **Repository layout** (target):
  ```
  supabase/
    config.toml
    migrations/
    seed.sql
    functions/<name>/index.ts
    functions/<name>/_shared/
  tests/
    unit/
    integration/
  specs/<screen>/
  ```

## Development Workflow & Quality Gates

- **Phase order is mandatory**: every screen passes through
  `momorph.specify → momorph.reviewspecify → momorph.plan → momorph.reviewplan
  → momorph.tasks → momorph.implement`. Skipping a phase is FORBIDDEN — if a
  later phase reveals a gap, return to the earlier phase, do not patch forward.
- **Constitution gate (in plan.md)**: every plan MUST tick the "Constitution
  Compliance Check" block before tasks are generated. Violations require a
  written justification entry in that block.
- **Test command (baseline)**:
  ```bash
  supabase start
  supabase db reset                         # apply migrations + seed
  supabase functions serve --env-file ./supabase/.env.local
  deno test --allow-net --allow-env --allow-read tests/
  supabase test db                          # RLS + SQL contract tests
  ```
- **Definition of Done for a screen**: spec + plan + tasks committed; all ACs
  have passing tests; RLS policies cover every new table; no PII in logs;
  Conventional-Commit feat commit landed; integration tests green against a
  fresh `supabase db reset`.

## Governance

- This constitution supersedes ad-hoc preferences and any conflicting guidance
  in `CLAUDE.md` or `docs/playbook.md`. Where those documents conflict with the
  constitution, the constitution wins and the other document MUST be amended in
  the same PR.
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
  the artifacts produced satisfy this constitution. The Phase-5 practice report
  MUST cite any deviations and their justifications.

**Version**: 1.0.0 | **Ratified**: 2026-05-11 | **Last Amended**: 2026-05-11
