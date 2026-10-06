#!/usr/bin/env bash
# ==============================================================================
# CINEHAI AI — Graceful Process Stopper
# Stops both FastAPI backend and Next.js frontend services started by this project
# using tracked PIDs without indiscriminately killing system node or python processes.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

RUN_DIR="$PROJECT_ROOT/.cinehai"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

echo "======================================================================"
echo "  Stopping CINEHAI AI Services"
echo "======================================================================"

stop_process_tree() {
  local parent_pid="$1"
  local name="$2"

  if [ -z "$parent_pid" ]; then
    return 0
  fi

  # Check if parent is running
  if ! kill -0 "$parent_pid" 2>/dev/null; then
    return 0
  fi

  echo "• Stopping $name (PID: $parent_pid)..."

  # Find immediate child processes
  local child_pids
  child_pids="$(pgrep -P "$parent_pid" 2>/dev/null || true)"

  # Send SIGTERM to children first, then parent
  for cpid in $child_pids; do
    if kill -0 "$cpid" 2>/dev/null; then
      kill -TERM "$cpid" 2>/dev/null || true
    fi
  done
  kill -TERM "$parent_pid" 2>/dev/null || true

  # Wait up to 5 seconds for graceful shutdown
  local wait_count=0
  while kill -0 "$parent_pid" 2>/dev/null && [ $wait_count -lt 5 ]; do
    sleep 1
    wait_count=$((wait_count + 1))
  done

  # Force kill if still running after timeout
  if kill -0 "$parent_pid" 2>/dev/null; then
    echo "  Process $parent_pid did not exit gracefully; sending SIGKILL..."
    for cpid in $child_pids; do
      kill -9 "$cpid" 2>/dev/null || true
    done
    kill -9 "$parent_pid" 2>/dev/null || true
    sleep 1
  fi

  if kill -0 "$parent_pid" 2>/dev/null; then
    echo "  ✗ Warning: Process $parent_pid may still be running."
  else
    echo "  ✓ $name stopped successfully."
  fi
}

# 1. Stop Frontend
FRONTEND_STOPPED=0
if [ -f "$FRONTEND_PID_FILE" ]; then
  FRONTEND_PID="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
  if [ -n "$FRONTEND_PID" ]; then
    stop_process_tree "$FRONTEND_PID" "Frontend"
    FRONTEND_STOPPED=1
  fi
  rm -f "$FRONTEND_PID_FILE"
fi

# Double check port 3000 in case Next.js spawned a detached child worker
PORT_3000_PIDS="$(lsof -ti :3000 2>/dev/null || true)"
if [ -n "$PORT_3000_PIDS" ]; then
  for p in $PORT_3000_PIDS; do
    echo "• Cleaning up remaining process on port 3000 (PID: $p)..."
    kill -TERM "$p" 2>/dev/null || true
    sleep 1
    if kill -0 "$p" 2>/dev/null; then
      kill -9 "$p" 2>/dev/null || true
    fi
  done
elif [ "$FRONTEND_STOPPED" = "0" ]; then
  echo "• Frontend: Not running or already stopped."
fi

# 2. Stop Backend
BACKEND_STOPPED=0
if [ -f "$BACKEND_PID_FILE" ]; then
  BACKEND_PID="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
  if [ -n "$BACKEND_PID" ]; then
    stop_process_tree "$BACKEND_PID" "Backend"
    BACKEND_STOPPED=1
  fi
  rm -f "$BACKEND_PID_FILE"
fi

# Double check port 8000 in case Uvicorn spawned a reload worker
PORT_8000_PIDS="$(lsof -ti :8000 2>/dev/null || true)"
if [ -n "$PORT_8000_PIDS" ]; then
  for p in $PORT_8000_PIDS; do
    echo "• Cleaning up remaining process on port 8000 (PID: $p)..."
    kill -TERM "$p" 2>/dev/null || true
    sleep 1
    if kill -0 "$p" 2>/dev/null; then
      kill -9 "$p" 2>/dev/null || true
    fi
  done
elif [ "$BACKEND_STOPPED" = "0" ]; then
  echo "• Backend: Not running or already stopped."
fi

echo "----------------------------------------------------------------------"
echo "  ✓ All CINEHAI AI services are stopped."
echo "======================================================================"
echo ""
