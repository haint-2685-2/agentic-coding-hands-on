# Docker Stack — SAA 2025 Server

The local development stack uses **12 Docker containers**, all provisioned by
the Supabase CLI (`supabase start`). This document explains what each container
does, the image versions pinned for this project, and how the optional
[docker-compose.yml](../docker-compose.yml) at the repo root fits in.

## Running services

| Container | Image | Port (host) | Role |
|---|---|---|---|
| `supabase_kong_saa-2025-server` | `kong:2.8.1` | 54321 → 8000 | API gateway. Routes `/auth/v1/*`, `/rest/v1/*`, `/storage/v1/*`, `/functions/v1/*` to the right service. |
| `supabase_db_saa-2025-server` | `postgres:17.6.1.106` | 54322 → 5432 | Postgres 17 with Supabase extensions (pgcrypto, pg_net, pgtap, supabase_admin role). |
| `supabase_auth_saa-2025-server` | `gotrue:v2.188.1` | 9999 (internal) | Auth service. Hosts the `before_user_created` hook (see [supabase/config.toml](../supabase/config.toml)). |
| `supabase_rest_saa-2025-server` | `postgrest:v14.10` | 3000 (internal) | REST API auto-generated from the Postgres schema (used by `supabase-js`). |
| `supabase_realtime_saa-2025-server` | `realtime:v2.86.3` | 4000 (internal) | Realtime via Postgres replication. Not used by current screens (Notification spec defers Realtime). |
| `supabase_storage_saa-2025-server` | `storage-api:v1.54.1` | 5000 (internal) | S3-compatible object storage; backs the `kudos` bucket used by Viết Kudo. |
| `supabase_edge_runtime_saa-2025-server` | `edge-runtime:v1.73.13` | 8081 (internal) | Deno-based runtime hosting our Edge Functions under [supabase/functions/](../supabase/functions/). |
| `supabase_pg_meta_saa-2025-server` | `postgres-meta:v0.96.4` | 8080 (internal) | Schema introspection for Studio. |
| `supabase_studio_saa-2025-server` | `studio:2026.04.28-sha-89d08a2` | 54323 → 3000 | Web admin UI (http://localhost:54323). |
| `supabase_inbucket_saa-2025-server` | `mailpit:v1.22.3` | 54324 → 8025 | Email capture for local auth (magic links etc.). |
| `supabase_vector_saa-2025-server` | `vector:0.53.0-alpine` | — | Log aggregator. |
| `supabase_analytics_saa-2025-server` | `logflare:1.39.1` | 54327 → 4000 | Logflare backend for Studio's log views. |

## How they boot

```bash
supabase start                       # starts all 12 containers
supabase db reset --no-seed          # applies supabase/migrations/*.sql
supabase functions serve \
  --no-verify-jwt                    # runs Deno functions from supabase/functions/
```

Read the canonical env via:

```bash
supabase status --output env
```

This prints `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET`, etc.
The test harness in [supabase/tests/_shared/env.ts](../supabase/tests/_shared/env.ts)
reads these from `SUPABASE_*` env vars.

## Standalone docker-compose.yml

The optional [docker-compose.yml](../docker-compose.yml) at the repo root
defines a **subset** of the stack that can be brought up without the Supabase
CLI:

- `db` — Postgres
- `pg_meta` — schema introspection
- `studio` — admin UI
- `edge_runtime` — Edge Function runtime (mounts `./supabase/functions`)
- `inbucket` — email capture

It deliberately omits `auth`, `rest`, `storage`, `kong`, `realtime`, `vector`,
`analytics` because those need project-specific config that Supabase CLI
generates dynamically (Kong route files, init SQL, JWT keys). For a full
standalone Supabase deployment, see the canonical
[supabase/supabase docker compose](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml).

Use cases for the compose file:

- Pinning + auditing image versions in CI/CD.
- Bringing up Postgres alone for fast pgTAP runs without the rest of the stack.
- Documentation: "what's running, exactly?"

## Tearing down

```bash
supabase stop                        # graceful stop of all 12 containers
supabase stop --no-backup            # stop + delete volumes (fresh DB next start)
```

Or with docker compose:

```bash
docker compose down                  # stop subset
docker compose down -v               # plus delete volumes
```
