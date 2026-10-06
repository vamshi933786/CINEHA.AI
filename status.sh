#!/usr/bin/env bash
# ==============================================================================
# CINEHAI AI — Service Status Inspector
# Checks running state, PIDs, ports, and health of both Backend and Frontend.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

RUN_DIR="$PROJECT_ROOT/.cinehai"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG_FILE="$LOG_DIR/backend.log"
FRONTEND_LOG_FILE="$LOG_DIR/frontend.log"

backend_healthy() {
  curl -s -f -m 2 http://localhost:8000/api/v1/health >/dev/null 2>&1
}

frontend_healthy() {
  curl -s -I -m 2 http://localhost:3000 >/dev/null 2>&1
}

# --- Backend Status Inspection ---
BACKEND_PID=""
BACKEND_STATE="STOPPED"
BACKEND_NOTE="Port 8000 free"

if [ -f "$BACKEND_PID_FILE" ]; then
  CANDIDATE_PID="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
  if [ -n "$CANDIDATE_PID" ] && kill -0 "$CANDIDATE_PID" 2>/dev/null; then
    BACKEND_PID="$CANDIDATE_PID"
  fi
fi

if [ -z "$BACKEND_PID" ]; then
  PORT_PID="$(lsof -ti :8000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_PID" ]; then
    BACKEND_PID="$PORT_PID"
  fi
fi

if backend_healthy; then
  BACKEND_STATE="RUNNING (Healthy)"
  BACKEND_NOTE="Responding 200 OK"
elif [ -n "$BACKEND_PID" ]; then
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    BACKEND_STATE="STARTING / UNHEALTHY"
    BACKEND_NOTE="Process active, port not responding yet"
  else
    BACKEND_STATE="STOPPED"
    BACKEND_NOTE="Stale PID file"
  fi
else
  PORT_PID="$(lsof -ti :8000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_PID" ]; then
    BACKEND_STATE="PORT CONFLICT"
    BACKEND_NOTE="Occupied by foreign PID $PORT_PID"
  fi
fi

# --- Frontend Status Inspection ---
FRONTEND_PID=""
FRONTEND_STATE="STOPPED"
FRONTEND_NOTE="Port 3000 free"

if [ -f "$FRONTEND_PID_FILE" ]; then
  CANDIDATE_PID="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
  if [ -n "$CANDIDATE_PID" ] && kill -0 "$CANDIDATE_PID" 2>/dev/null; then
    FRONTEND_PID="$CANDIDATE_PID"
  fi
fi

if [ -z "$FRONTEND_PID" ]; then
  PORT_PID="$(lsof -ti :3000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_PID" ]; then
    FRONTEND_PID="$PORT_PID"
  fi
fi

if frontend_healthy; then
  FRONTEND_STATE="RUNNING (Healthy)"
  FRONTEND_NOTE="Responding HTTP 200"
elif [ -n "$FRONTEND_PID" ]; then
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    FRONTEND_STATE="STARTING / UNHEALTHY"
    FRONTEND_NOTE="Process active, compiling or initializing"
  else
    FRONTEND_STATE="STOPPED"
    FRONTEND_NOTE="Stale PID file"
  fi
else
  PORT_PID="$(lsof -ti :3000 2>/dev/null | head -n 1 || true)"
  if [ -n "$PORT_PID" ]; then
    FRONTEND_STATE="PORT CONFLICT"
    FRONTEND_NOTE="Occupied by foreign PID $PORT_PID"
  fi
fi

echo "======================================================================"
echo "  CINEHAI AI Service Status"
echo "======================================================================"
printf "%-12s | %-6s | %-10s | %-24s | %s\n" "SERVICE" "PORT" "PID" "STATUS" "DETAILS"
echo "----------------------------------------------------------------------"
printf "%-12s | %-6s | %-10s | %-24s | %s\n" "Backend" "8000" "${BACKEND_PID:--}" "$BACKEND_STATE" "$BACKEND_NOTE"
printf "%-12s | %-3s | %-10s | %-24s | %s\n" "Frontend" "3000" "${FRONTEND_PID:--}" "$FRONTEND_STATE" "$FRONTEND_NOTE"
echo "----------------------------------------------------------------------"

if [ "$BACKEND_STATE" = "RUNNING (Healthy)" ] && [ "$FRONTEND_STATE" = "RUNNING (Healthy)" ]; then
  echo "  ✓ All services are running and healthy!"
  echo ""
  echo "  URLs:"
  echo "    Application: http://localhost:3000"
  echo "    API Health:  http://localhost:8000/api/v1/health"
  echo "    API Docs:    http://localhost:8000/docs"
  echo ""
  echo "  Logs:"
  echo "    Backend:     $BACKEND_LOG_FILE"
  echo "    Frontend:    $FRONTEND_LOG_FILE"
  echo ""
  echo "  Commands:"
  echo "    Stop:        ./stop.sh  (or npm run stop)"
  echo "    Logs:        tail -f logs/backend.log logs/frontend.log"
  echo "======================================================================"
  echo ""
  exit 0
else
  echo "  • Services are partially running or stopped."
  echo ""
  echo "  To start all services: ./start.sh (or npm run start:dev)"
  echo "  To stop all services:  ./stop.sh  (or npm run stop)"
  echo "======================================================================"
  echo ""
  exit 1
fi
