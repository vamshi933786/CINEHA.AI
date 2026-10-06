#!/usr/bin/env bash
# ==============================================================================
# CINEHAI AI — Local Development Launcher
# Starts both FastAPI backend (port 8000) and Next.js frontend (port 3000)
# detached in the background so Antigravity does not need to stay open.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

RUN_DIR="$PROJECT_ROOT/.cinehai"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$RUN_DIR" "$LOG_DIR"

BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG_FILE="$LOG_DIR/backend.log"
FRONTEND_LOG_FILE="$LOG_DIR/frontend.log"

# Add common binary paths to PATH for non-login shells / environments
for p in /opt/anaconda3/bin "$HOME/anaconda3/bin" "$HOME/miniconda3/bin" /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do
  if [ -d "$p" ]; then
    case ":$PATH:" in
      *":$p:"*) ;;
      *) PATH="$p:$PATH" ;;
    esac
  fi
done
export PATH

# Detect Python executable
detect_python() {
  if [ -n "$PYTHON_BIN" ] && [ -x "$PYTHON_BIN" ]; then
    echo "$PYTHON_BIN"
    return 0
  fi
  if [ -x "/opt/anaconda3/bin/python" ]; then
    echo "/opt/anaconda3/bin/python"
    return 0
  fi
  if [ -x "/opt/anaconda3/bin/python3" ]; then
    echo "/opt/anaconda3/bin/python3"
    return 0
  fi
  for py in python3 python; do
    if command -v "$py" >/dev/null 2>&1; then
      local candidate
      candidate="$(command -v "$py")"
      if "$candidate" -c "import fastapi" >/dev/null 2>&1; then
        echo "$candidate"
        return 0
      fi
    fi
  done
  if [ -x "$PROJECT_ROOT/apps/api/venv/bin/python" ]; then
    echo "$PROJECT_ROOT/apps/api/venv/bin/python"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi
  return 1
}

# Detect Uvicorn executable
detect_uvicorn() {
  if [ -n "$UVICORN_BIN" ] && [ -x "$UVICORN_BIN" ]; then
    echo "$UVICORN_BIN"
    return 0
  fi
  local py_dir
  if [ -n "$PYTHON_EXEC" ]; then
    py_dir="$(dirname "$PYTHON_EXEC")"
    if [ -x "$py_dir/uvicorn" ]; then
      echo "$py_dir/uvicorn"
      return 0
    fi
  fi
  if [ -x "/opt/anaconda3/bin/uvicorn" ]; then
    echo "/opt/anaconda3/bin/uvicorn"
    return 0
  fi
  if command -v uvicorn >/dev/null 2>&1; then
    command -v uvicorn
    return 0
  fi
  return 1
}

# Detect Node executable
detect_node() {
  if [ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ]; then
    echo "$NODE_BIN"
    return 0
  fi
  if [ -x "/opt/anaconda3/bin/node" ]; then
    echo "/opt/anaconda3/bin/node"
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  return 1
}

# Detect npm executable
detect_npm() {
  if [ -n "$NPM_BIN" ] && [ -x "$NPM_BIN" ]; then
    echo "$NPM_BIN"
    return 0
  fi
  if [ -x "/opt/anaconda3/bin/npm" ]; then
    echo "/opt/anaconda3/bin/npm"
    return 0
  fi
  if command -v npm >/dev/null 2>&1; then
    command -v npm
    return 0
  fi
  return 1
}

PYTHON_EXEC="$(detect_python || true)"
if [ -z "$PYTHON_EXEC" ]; then
  echo "Error: Python executable not found. Please install Python 3.9+ or set PYTHON_BIN."
  exit 1
fi

UVICORN_EXEC="$(detect_uvicorn || true)"

NODE_EXEC="$(detect_node || true)"
if [ -z "$NODE_EXEC" ]; then
  echo "Error: Node.js executable not found. Please install Node.js 18+ or set NODE_BIN."
  exit 1
fi

# Ensure Node directory is at the front of PATH for npm scripts
NODE_DIR="$(dirname "$NODE_EXEC")"
export PATH="$NODE_DIR:$PATH"

NPM_EXEC="$(detect_npm || true)"
if [ -z "$NPM_EXEC" ]; then
  echo "Error: npm executable not found. Please install npm or set NPM_BIN."
  exit 1
fi

# Detached background process launcher (creates an independent setsid OS session)
start_detached_process() {
  local work_dir="$1"
  local log_path="$2"
  local pid_path="$3"
  shift 3

  "$PYTHON_EXEC" - "$work_dir" "$log_path" "$pid_path" "$@" << 'PYEOF'
import sys, subprocess

work_dir = sys.argv[1]
log_path = sys.argv[2]
pid_path = sys.argv[3]
cmd = sys.argv[4:]

with open(log_path, 'a') as log_f:
    p = subprocess.Popen(
        cmd,
        cwd=work_dir,
        stdin=subprocess.DEVNULL,
        stdout=log_f,
        stderr=subprocess.STDOUT,
        start_new_session=True
    )
    with open(pid_path, 'w') as pid_f:
        pid_f.write(str(p.pid) + '\n')
PYEOF
}

backend_is_healthy() {
  curl -s -f -m 2 http://localhost:8000/api/v1/health >/dev/null 2>&1
}

frontend_is_healthy() {
  curl -s -I -m 2 http://localhost:3000 >/dev/null 2>&1
}

get_backend_pid() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    local pid
    pid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  local port_pid
  port_pid="$(lsof -ti :8000 2>/dev/null | head -n 1 || true)"
  if [ -n "$port_pid" ]; then
    echo "$port_pid"
    echo "$port_pid" > "$BACKEND_PID_FILE"
    return 0
  fi
  return 1
}

get_frontend_pid() {
  if [ -f "$FRONTEND_PID_FILE" ]; then
    local pid
    pid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "$pid"
      return 0
    fi
  fi
  local port_pid
  port_pid="$(lsof -ti :3000 2>/dev/null | head -n 1 || true)"
  if [ -n "$port_pid" ]; then
    echo "$port_pid"
    echo "$port_pid" > "$FRONTEND_PID_FILE"
    return 0
  fi
  return 1
}

BACKEND_ALREADY_RUNNING=0
FRONTEND_ALREADY_RUNNING=0

if backend_is_healthy; then
  BACKEND_PID="$(get_backend_pid || echo "unknown")"
  BACKEND_ALREADY_RUNNING=1
fi

if frontend_is_healthy; then
  FRONTEND_PID="$(get_frontend_pid || echo "unknown")"
  FRONTEND_ALREADY_RUNNING=1
fi

# Duplicate start protection: If both are already running, inform user and exit
if [ "$BACKEND_ALREADY_RUNNING" = "1" ] && [ "$FRONTEND_ALREADY_RUNNING" = "1" ]; then
  echo ""
  echo "======================================================================"
  echo "  CINEHAI AI is already running and healthy!"
  echo "======================================================================"
  echo "  Frontend URL:   http://localhost:3000 (PID: $FRONTEND_PID)"
  echo "  Backend API:    http://localhost:8000 (PID: $BACKEND_PID)"
  echo "  Health Check:   http://localhost:8000/api/v1/health"
  echo "  API Docs:       http://localhost:8000/docs"
  echo ""
  echo "  Frontend Log:   logs/frontend.log"
  echo "  Backend Log:    logs/backend.log"
  echo ""
  echo "  Check status:   ./status.sh  (or npm run status)"
  echo "  Stop services:  ./stop.sh    (or npm run stop)"
  echo "======================================================================"
  echo ""
  exit 0
fi

echo "======================================================================"
echo "  Starting CINEHAI AI Platform"
echo "======================================================================"
echo "  Python:  $PYTHON_EXEC"
if [ -n "$UVICORN_EXEC" ]; then
  echo "  Uvicorn: $UVICORN_EXEC"
fi
echo "  Node:    $NODE_EXEC"
echo "  npm:     $NPM_EXEC"
echo "----------------------------------------------------------------------"

# 1. Start Backend if not already healthy
if [ "$BACKEND_ALREADY_RUNNING" = "1" ]; then
  echo "• Backend is already running on port 8000 (PID: $BACKEND_PID)"
else
  # Check if port 8000 is occupied by an unresponsive process
  PORT_8000_PID="$(lsof -ti :8000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_8000_PID" ]; then
    echo "Warning: Port 8000 is occupied by PID $PORT_8000_PID but not responding to health checks."
    echo "Attempting to start backend anyway or free port first..."
  fi

  echo "• Starting FastAPI Backend on http://localhost:8000..."
  echo "" >> "$BACKEND_LOG_FILE"
  echo "=== CINEHAI AI Backend started at $(date) ===" >> "$BACKEND_LOG_FILE"

  if [ -n "$UVICORN_EXEC" ]; then
    start_detached_process "$PROJECT_ROOT/apps/api" "$BACKEND_LOG_FILE" "$BACKEND_PID_FILE" \
      "$UVICORN_EXEC" "app.main:app" "--host" "0.0.0.0" "--port" "8000" "--reload"
  else
    start_detached_process "$PROJECT_ROOT/apps/api" "$BACKEND_LOG_FILE" "$BACKEND_PID_FILE" \
      "$PYTHON_EXEC" "-m" "uvicorn" "app.main:app" "--host" "0.0.0.0" "--port" "8000" "--reload"
  fi
  BACKEND_PID="$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo "")"
fi

# 2. Start Frontend if not already healthy
if [ "$FRONTEND_ALREADY_RUNNING" = "1" ]; then
  echo "• Frontend is already running on port 3000 (PID: $FRONTEND_PID)"
else
  # Check if port 3000 is occupied by an unresponsive process
  PORT_3000_PID="$(lsof -ti :3000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_3000_PID" ]; then
    echo "Warning: Port 3000 is occupied by PID $PORT_3000_PID but not responding to requests."
  fi

  echo "• Starting Next.js Frontend on http://localhost:3000..."
  echo "" >> "$FRONTEND_LOG_FILE"
  echo "=== CINEHAI AI Frontend started at $(date) ===" >> "$FRONTEND_LOG_FILE"

  if [ -x "$PROJECT_ROOT/apps/web/node_modules/.bin/next" ]; then
    start_detached_process "$PROJECT_ROOT/apps/web" "$FRONTEND_LOG_FILE" "$FRONTEND_PID_FILE" \
      "$NODE_EXEC" "./node_modules/.bin/next" "dev" "-p" "3000"
  else
    start_detached_process "$PROJECT_ROOT/apps/web" "$FRONTEND_LOG_FILE" "$FRONTEND_PID_FILE" \
      "$NPM_EXEC" "run" "dev"
  fi
  FRONTEND_PID="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || echo "")"
fi

echo "----------------------------------------------------------------------"
echo "Verifying service readiness..."

# Verify Backend health
if [ "$BACKEND_ALREADY_RUNNING" != "1" ]; then
  echo -n "• Waiting for Backend to be ready on http://localhost:8000"
  BACKEND_READY=0
  for i in $(seq 1 30); do
    if backend_is_healthy; then
      BACKEND_READY=1
      break
    fi
    if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo ""
      echo "Error: Backend process (PID: $BACKEND_PID) exited unexpectedly."
      echo "Check $BACKEND_LOG_FILE for error details:"
      tail -n 25 "$BACKEND_LOG_FILE"
      exit 1
    fi
    echo -n "."
    sleep 1
  done
  echo ""
  if [ "$BACKEND_READY" = "1" ]; then
    echo "  ✓ Backend is healthy!"
  else
    echo "  ✗ Backend failed to respond within 30 seconds."
    echo "  Check $BACKEND_LOG_FILE for details."
    exit 1
  fi
fi

# Verify Frontend health
if [ "$FRONTEND_ALREADY_RUNNING" != "1" ]; then
  echo -n "• Waiting for Frontend to be ready on http://localhost:3000"
  FRONTEND_READY=0
  for i in $(seq 1 35); do
    if frontend_is_healthy; then
      FRONTEND_READY=1
      break
    fi
    if [ -n "$FRONTEND_PID" ] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      echo ""
      echo "Error: Frontend process (PID: $FRONTEND_PID) exited unexpectedly."
      echo "Check $FRONTEND_LOG_FILE for error details:"
      tail -n 25 "$FRONTEND_LOG_FILE"
      exit 1
    fi
    echo -n "."
    sleep 1
  done
  echo ""
  if [ "$FRONTEND_READY" = "1" ]; then
    echo "  ✓ Frontend is ready!"
  else
    echo "  ✗ Frontend failed to respond within 35 seconds."
    echo "  Check $FRONTEND_LOG_FILE for details."
    exit 1
  fi
fi

# Refresh resolved PIDs with listening port PIDs
BACKEND_PORT_PID="$(lsof -ti :8000 2>/dev/null | head -n 1 || true)"
if [ -n "$BACKEND_PORT_PID" ]; then
  BACKEND_PID="$BACKEND_PORT_PID"
  echo "$BACKEND_PID" > "$BACKEND_PID_FILE"
fi

FRONTEND_PORT_PID="$(lsof -ti :3000 2>/dev/null | head -n 1 || true)"
if [ -n "$FRONTEND_PORT_PID" ]; then
  FRONTEND_PID="$FRONTEND_PORT_PID"
  echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
fi

echo ""
echo "======================================================================"
echo "  🚀 CINEHAI AI is up and running!"
echo "======================================================================"
echo "  Frontend Application: http://localhost:3000"
echo "  Backend API:          http://localhost:8000"
echo "  API Documentation:    http://localhost:8000/docs"
echo "  Backend Health:       http://localhost:8000/api/v1/health"
echo ""
echo "  Backend PID:          $BACKEND_PID"
echo "  Frontend PID:         $FRONTEND_PID"
echo ""
echo "  Logs:"
echo "    Frontend:           $LOG_DIR/frontend.log"
echo "    Backend:            $LOG_DIR/backend.log"
echo ""
echo "  Management Commands:"
echo "    Check status:       ./status.sh  (or npm run status)"
echo "    Stop services:      ./stop.sh    (or npm run stop)"
echo "    Stream logs:        tail -f logs/backend.log logs/frontend.log"
echo ""
echo "  Services are running independently in the background."
echo "  You may safely close Antigravity or this terminal at any time."
echo "======================================================================"
echo ""
