#!/usr/bin/env bash
# SAA 2025 — toggle the entire local dev stack.
#
#   BE  =  Supabase Docker stack (12 containers: postgres, auth, rest,
#          realtime, storage, edge-runtime, studio, mailpit, kong,
#          pg_meta, vector, analytics).
#   FE  =  plain `pnpm dev` (Next.js 14), NOT in Docker — managed via PID
#          file `.fe-dev.pid` at the repo root.
#
# Usage:
#   ./scripts/docker.sh up         # BE stack + FE dev server
#   ./scripts/docker.sh down       # stop FE dev + BE stack
#   ./scripts/docker.sh status     # show both
#   ./scripts/docker.sh restart    # down then up
#
#   ./scripts/docker.sh up be      # BE only
#   ./scripts/docker.sh up fe      # FE only
#   ./scripts/docker.sh down be    # BE only
#   ./scripts/docker.sh down fe    # FE only
#
# Run from anywhere — the script cd's into backend/ or frontend/ as needed.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"
FRONTEND_DIR="$REPO_ROOT/frontend"
FE_PID_FILE="$REPO_ROOT/.fe-dev.pid"
FE_LOG_FILE="$REPO_ROOT/.fe-dev.log"
FE_PORT=3000

# ---- prereq checks --------------------------------------------------------

require_supabase_cli() {
  command -v supabase >/dev/null 2>&1 || {
    echo "❌ supabase CLI not found in PATH." >&2
    echo "   Install: https://supabase.com/docs/guides/cli" >&2
    exit 1
  }
}

require_docker() {
  command -v docker >/dev/null 2>&1 || { echo "❌ docker not in PATH" >&2; exit 1; }
  docker info >/dev/null 2>&1 || {
    echo "❌ Docker daemon is not running. Start Docker Desktop / systemd first." >&2
    exit 1
  }
}

require_pnpm() {
  command -v pnpm >/dev/null 2>&1 || {
    echo "❌ pnpm not in PATH. Install: corepack enable && corepack prepare pnpm@latest --activate" >&2
    exit 1
  }
}

# ---- status helpers -------------------------------------------------------

be_count() {
  docker ps --filter "name=supabase" --format '{{.Names}}' | wc -l | tr -d ' '
}

fe_pid_alive() {
  [[ -f "$FE_PID_FILE" ]] || return 1
  local pid; pid=$(cat "$FE_PID_FILE" 2>/dev/null || echo "")
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

print_be_status() {
  local count; count=$(be_count)
  if [[ "$count" -eq 0 ]]; then
    echo "🛑  BE: no supabase containers running."
  else
    echo "✅  BE: $count supabase containers running."
  fi
}

print_fe_status() {
  if fe_pid_alive; then
    echo "✅  FE: pnpm dev running (pid $(cat $FE_PID_FILE), log $FE_LOG_FILE)"
  else
    # Detect an orphan dev server holding the port
    local orphan
    orphan=$(lsof -ti:$FE_PORT 2>/dev/null || true)
    if [[ -n "$orphan" ]]; then
      echo "⚠️  FE: process is on port $FE_PORT (pid $orphan) but not tracked by this script."
    else
      echo "🛑  FE: pnpm dev not running."
    fi
  fi
}

# ---- BE actions -----------------------------------------------------------

be_up() {
  require_supabase_cli
  require_docker
  if [[ $(be_count) -gt 0 ]]; then
    echo "ℹ️  BE already running — skipping supabase start."
    return
  fi
  echo "🚀 Booting Supabase stack from $BACKEND_DIR ..."
  # `supabase start` substitutes ${VAR} in docker-compose from the shell env,
  # not from supabase/.env.local (that file is only read by `functions serve`).
  # Source it here so OAuth client_id/secret reach the auth container.
  local env_file="$BACKEND_DIR/supabase/.env.local"
  if [[ -f "$env_file" ]]; then
    set -a; source "$env_file"; set +a
  fi
  ( cd "$BACKEND_DIR" && supabase start )
  echo "   Studio   http://127.0.0.1:54323"
  echo "   Mailpit  http://127.0.0.1:54324"
  echo "   API      http://127.0.0.1:54321"
}

be_down() {
  require_supabase_cli
  require_docker
  if [[ $(be_count) -eq 0 ]]; then
    echo "ℹ️  BE not running — skipping supabase stop."
    return
  fi
  echo "🛑 Stopping Supabase stack ..."
  ( cd "$BACKEND_DIR" && supabase stop )
  echo "ℹ️  Volumes preserved. Data survives across down/up cycles."
}

# ---- FE actions -----------------------------------------------------------

fe_up() {
  require_pnpm
  if fe_pid_alive; then
    echo "ℹ️  FE dev already running (pid $(cat $FE_PID_FILE))."
    return
  fi
  local orphan
  orphan=$(lsof -ti:$FE_PORT 2>/dev/null || true)
  if [[ -n "$orphan" ]]; then
    echo "⚠️  Port $FE_PORT already held by pid $orphan. Run 'down fe' first or free the port." >&2
    exit 1
  fi
  echo "🌐 Starting FE dev server (pnpm dev) ..."
  ( cd "$FRONTEND_DIR" && nohup pnpm dev > "$FE_LOG_FILE" 2>&1 & echo $! > "$FE_PID_FILE" )
  sleep 1
  if fe_pid_alive; then
    echo "   pid $(cat $FE_PID_FILE), log $FE_LOG_FILE"
    echo "   → http://localhost:$FE_PORT"
  else
    echo "❌ FE failed to start. Check $FE_LOG_FILE" >&2
    rm -f "$FE_PID_FILE"
    exit 1
  fi
}

fe_down() {
  local stopped=0
  if [[ -f "$FE_PID_FILE" ]]; then
    local pid; pid=$(cat "$FE_PID_FILE" 2>/dev/null || echo "")
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      # Kill the pnpm wrapper AND its `next-dev` child.
      pkill -P "$pid" 2>/dev/null || true
      kill "$pid" 2>/dev/null || true
      stopped=1
    fi
    rm -f "$FE_PID_FILE"
  fi
  # Reap any orphan listener on the script's primary port.
  local orphan
  orphan=$(lsof -ti:$FE_PORT 2>/dev/null || true)
  if [[ -n "$orphan" ]]; then
    echo "🛑 Killing orphan listener on port $FE_PORT (pid $orphan)"
    kill $orphan 2>/dev/null || true
    stopped=1
  fi
  # Reap stragglers from previous boots: if port $FE_PORT was busy during
  # `up fe`, Next.js silently falls back to 3001/3002/... and our PID file
  # only tracks the latest invocation — older orphans on those ports leak.
  # Sweep all user-owned `next dev` / `next-server` processes to make sure
  # `up fe` after this can claim $FE_PORT cleanly.
  local stragglers
  stragglers=$(pgrep -u "$(id -u)" -f "next dev|next-server" 2>/dev/null || true)
  if [[ -n "$stragglers" ]]; then
    echo "🛑 Killing leftover Next.js processes: $(echo $stragglers | tr '\n' ' ')"
    pkill -u "$(id -u)" -f "next dev" 2>/dev/null || true
    pkill -u "$(id -u)" -f "next-server" 2>/dev/null || true
    stopped=1
  fi
  if [[ "$stopped" -eq 1 ]]; then
    echo "🛑 FE dev stopped"
  else
    echo "ℹ️  FE dev not running"
  fi
}

# ---- dispatch -------------------------------------------------------------

cmd_up() {
  case "${1:-all}" in
    all)  be_up; echo; fe_up ;;
    be)   be_up ;;
    fe)   fe_up ;;
    *)    echo "❌ unknown target '$1' (use: all | be | fe)" >&2; exit 2 ;;
  esac
}

cmd_down() {
  case "${1:-all}" in
    all)  fe_down; echo; be_down ;;
    be)   be_down ;;
    fe)   fe_down ;;
    *)    echo "❌ unknown target '$1' (use: all | be | fe)" >&2; exit 2 ;;
  esac
}

cmd_status() {
  print_be_status
  print_fe_status
}

cmd_restart() {
  cmd_down all
  echo
  cmd_up all
}

usage() {
  cat <<'USAGE'
SAA 2025 — full local dev stack toggle

Usage:
  scripts/docker.sh up [be|fe]      Boot BE (Supabase) and FE (pnpm dev)
  scripts/docker.sh down [be|fe]    Stop FE then BE
  scripts/docker.sh status          Show both
  scripts/docker.sh restart         down then up

Targets (default = all):
  be    backend Supabase Docker stack only
  fe    frontend Next.js dev server only

Files:
  .fe-dev.pid    PID of the FE dev server (script-managed)
  .fe-dev.log    stdout/stderr of `pnpm dev`
USAGE
}

case "${1:-}" in
  up)        shift; cmd_up "${1:-all}" ;;
  down)      shift; cmd_down "${1:-all}" ;;
  status)    cmd_status ;;
  restart)   cmd_restart ;;
  ""|help|-h|--help) usage ;;
  *)
    echo "❌ Unknown command: $1" >&2
    usage >&2
    exit 2
    ;;
esac
