#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
#  start.sh — AI Driver Behavior Monitoring System
#  
#  Linux / macOS startup script
#  - Checks system requirements
#  - Sets up Python venv & installs dependencies
#  - Downloads ML models
#  - Builds React frontend & starts dev server
#  - Starts FastAPI backend
# ──────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
VENV_DIR="$ROOT_DIR/.venv"

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Header ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════${NC}${BOLD}"
echo -e "${BOLD}  AI Driver Behavior Monitoring System${NC}"
echo -e "${BOLD}  Setup & Launch${NC}"
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════${NC}${BOLD}"
echo ""

# ── 1. Check system requirements ────────────────────────────
info "Checking system requirements..."

if ! command -v python3 &>/dev/null; then
    error "Python 3 not found. Please install Python 3.11 or higher."
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]); then
    error "Python 3.11+ required. Found Python $PYTHON_VERSION"
fi
ok "Python $PYTHON_VERSION detected"

if ! command -v node &>/dev/null; then
    warn "Node.js not found — frontend will be built but not available for live development"
    warn "To use live development server, install Node.js 18+: https://nodejs.org"
    SKIP_FRONTEND_DEV=1
else
    NODE_VERSION=$(node -v)
    ok "Node.js $NODE_VERSION detected"
fi

# ── 2. Python virtual environment ───────────────────────────
info "Setting up Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"
ok "Python venv activated"

# ── 3. Install Python dependencies ──────────────────────────
info "Installing Python dependencies (this may take a few minutes)..."
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r "$SERVER_DIR/requirements.txt" || error "Failed to install Python packages"
ok "Python packages installed"

# ── 4. Download ML models if missing ────────────────────────
MODELS_DIR="$SERVER_DIR/models"
mkdir -p "$MODELS_DIR"

info "Checking ML models..."

if [ ! -f "$MODELS_DIR/shape_predictor_68_face_landmarks.dat" ]; then
    info "Downloading dlib face landmarks model (10 MB)..."
    if command -v wget &>/dev/null; then
        wget -q -O /tmp/shape_predictor.bz2 \
            "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2" \
            && bzip2 -d /tmp/shape_predictor.bz2 \
            && mv /tmp/shape_predictor "$MODELS_DIR/shape_predictor_68_face_landmarks.dat" \
            && ok "dlib model downloaded" \
            || warn "dlib model download failed — plate reading will not work"
    elif command -v curl &>/dev/null; then
        curl -sL -o /tmp/shape_predictor.bz2 \
            "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2" \
            && bzip2 -d /tmp/shape_predictor.bz2 \
            && mv /tmp/shape_predictor "$MODELS_DIR/shape_predictor_68_face_landmarks.dat" \
            && ok "dlib model downloaded" \
            || warn "dlib model download failed"
    fi
else
    ok "dlib model already present"
fi

if [ ! -f "$MODELS_DIR/face_landmarker.task" ]; then
    info "Downloading MediaPipe face landmarker model (50 MB)..."
    if command -v wget &>/dev/null; then
        wget -q -O "$MODELS_DIR/face_landmarker.task" \
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task" \
            && ok "MediaPipe model downloaded" \
            || warn "MediaPipe model download failed"
    elif command -v curl &>/dev/null; then
        curl -sL -o "$MODELS_DIR/face_landmarker.task" \
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task" \
            && ok "MediaPipe model downloaded" \
            || warn "MediaPipe model download failed"
    fi
else
    ok "MediaPipe model already present"
fi

if [ ! -f "$MODELS_DIR/yolov8n.pt" ]; then
    info "Downloading YOLOv8n model (25 MB)..."
    cd "$MODELS_DIR"
    python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" 2>/dev/null && ok "YOLOv8n model downloaded" || warn "YOLOv8n model download failed"
    cd "$ROOT_DIR"
else
    ok "YOLOv8n model already present"
fi

# ── 5. Node.js & client setup ──────────────────────────────
if [ -z "$SKIP_FRONTEND_DEV" ]; then
    info "Installing Node.js dependencies..."
    cd "$CLIENT_DIR"
    npm install --silent 2>/dev/null || {
        warn "npm install failed"
    }
    ok "Node packages installed"
    cd "$ROOT_DIR"
else
    warn "Skipping Node.js setup — frontend unavailable"
fi

# ── 6. Kill stale processes on ports ───────────────────────
kill_port() {
    local port=$1
    local pid
    pid=$(lsof -ti:"$port" 2>/dev/null)
    if [ -n "$pid" ]; then
        warn "Port $port in use (PID $pid) — killing..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

kill_port 8000
kill_port 3000

# ── 7. Summary ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════${NC}${BOLD}"
echo -e "${GREEN}  ✓ Setup Complete${NC}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════${NC}${BOLD}"
echo ""
echo -e "  ${BOLD}Backend  (FastAPI):${NC}  http://localhost:8000"
echo -e "  ${BOLD}Frontend (React):${NC}   http://localhost:3000"
echo -e "  ${BOLD}Health Check:${NC}       http://localhost:8000/api/health"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop both servers"
echo ""

# ── 8. Trap Ctrl+C to clean up both processes ──────────────
cleanup() {
    echo ""
    info "Shutting down..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    wait 2>/dev/null
    ok "All servers stopped"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── 9. Start backend (FastAPI on port 8000) ────────────────
info "Starting FastAPI backend on http://localhost:8000 ..."
cd "$SERVER_DIR"
python3 -m uvicorn backend:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 2

# Verify backend started
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    error "Backend failed to start. Check logs above."
fi
ok "Backend running (PID $BACKEND_PID)"

# ── 10. Start frontend (Vite dev server on port 3000) ──────
if [ -z "$SKIP_FRONTEND_DEV" ]; then
    info "Starting React dev server on http://localhost:3000 ..."
    cd "$CLIENT_DIR"
    npm run dev &
    FRONTEND_PID=$!
    sleep 2
    ok "Frontend running (PID $FRONTEND_PID)"
    echo ""
    echo -e "${BOLD}${GREEN}  ➜  Open http://localhost:3000 in your browser${NC}"
else
    echo ""
    echo -e "${BOLD}${GREEN}  ➜  Open http://localhost:8000 in your browser${NC}"
    echo -e "     (serving pre-built frontend from client/dist/)"
fi

echo ""

# Wait for both processes
wait
