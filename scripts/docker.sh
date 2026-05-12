#!/usr/bin/env bash
# SAA 2025 — toggle the backend Docker stack (Supabase: postgres, auth,
# rest, realtime, storage, edge-runtime, studio, mailpit, kong, pg_meta,
# imgproxy, pooler — 12 containers).
#
# FE is plain `pnpm dev` and does NOT use Docker.
#
# Usage:
#   ./scripts/docker.sh up        # boot the stack
#   ./scripts/docker.sh down      # stop the stack (data persists)
#   ./scripts/docker.sh status    # show current state
#   ./scripts/docker.sh restart   # down then up
#
# Run from anywhere — the script cd's into backend/ on its own.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

require_supabase_cli() {
  if ! command -v supabase >/dev/null 2>&1; then
    echo "❌ supabase CLI not found in PATH." >&2
    echo "   Install: https://supabase.com/docs/guides/cli" >&2
    exit 1
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "❌ docker not found in PATH." >&2
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Start Docker Desktop / systemd service first." >&2
    exit 1
  fi
}

print_running() {
  local count
  count=$(docker ps --filter "name=supabase" --format '{{.Names}}' | wc -l | tr -d ' ')
  if [[ "$count" -eq 0 ]]; then
    echo "🛑  No supabase containers running."
  else
    echo "✅  $count supabase containers running:"
    docker ps --filter "name=supabase" --format '   {{.Names}}  {{.Status}}'
  fi
}

cmd_up() {
  require_supabase_cli
  require_docker
  echo "🚀 Booting Supabase stack from $BACKEND_DIR ..."
  cd "$BACKEND_DIR"
  supabase start
  echo
  print_running
  echo
  echo "👉 Endpoints:"
  echo "   API gateway      http://127.0.0.1:54321"
  echo "   Postgres         postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  echo "   Studio           http://127.0.0.1:54323"
  echo "   Mailpit (mail)   http://127.0.0.1:54324"
  echo
  echo "👉 Next: cd frontend && pnpm dev   →   http://localhost:3000"
}

cmd_down() {
  require_supabase_cli
  require_docker
  echo "🛑 Stopping Supabase stack ..."
  cd "$BACKEND_DIR"
  supabase stop
  echo
  print_running
  echo
  echo "ℹ️  Volumes preserved. Data survives across down/up cycles."
  echo "   To wipe data on next up: ./scripts/docker.sh up && (cd backend && supabase db reset)"
}

cmd_status() {
  require_docker
  print_running
}

cmd_restart() {
  cmd_down
  echo
  cmd_up
}

case "${1:-}" in
  up)        cmd_up ;;
  down)      cmd_down ;;
  status)    cmd_status ;;
  restart)   cmd_restart ;;
  ""|help|-h|--help)
    cat <<'USAGE'
SAA 2025 — backend Docker stack toggle

Usage:
  scripts/docker.sh up        Boot Supabase (12 containers)
  scripts/docker.sh down      Stop Supabase (volumes preserved)
  scripts/docker.sh status    Show running supabase containers
  scripts/docker.sh restart   down then up
USAGE
    ;;
  *)
    echo "❌ Unknown command: $1" >&2
    echo "   Try: scripts/docker.sh help" >&2
    exit 2
    ;;
esac
