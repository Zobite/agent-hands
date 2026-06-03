#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Docker-based Browser Integration Tests
#
# Runs the real server + browser API checks inside a clean Docker container.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/scripts/docker"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✅${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠️${NC}  $*"; }
error()   { echo -e "${RED}❌${NC} $*"; exit 1; }

# ── Find Docker ─────────────────────────────────────────────────────────────
DOCKER=""
DOCKER_CANDIDATES=(
  "$(command -v docker 2>/dev/null || true)"
  "/usr/local/bin/docker"
  "/opt/homebrew/bin/docker"
  "/Applications/Docker.app/Contents/Resources/bin/docker"
  "/Applications/OrbStack.app/Contents/MacOS/xbin/docker"
)
for candidate in "${DOCKER_CANDIDATES[@]}"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ] && "$candidate" version &>/dev/null; then
    DOCKER="$candidate"
    break
  fi
done

if [ -z "$DOCKER" ]; then
  error "Docker is required and no working Docker CLI was found.
   Checked: /usr/local/bin/docker, Docker Desktop, OrbStack, Homebrew.
   Install: https://docs.docker.com/get-docker/"
fi

# Ensure Docker helper binaries are in PATH
DOCKER_HELPER_PATHS=(
  "/usr/local/bin"
  "/Applications/Docker.app/Contents/Resources/bin"
  "$(dirname "$DOCKER")"
)
for hp in "${DOCKER_HELPER_PATHS[@]}"; do
  if [ -d "$hp" ] && [[ ":$PATH:" != *":$hp:"* ]]; then
    export PATH="$hp:$PATH"
  fi
done

info "Using Docker: $DOCKER ($("$DOCKER" --version 2>/dev/null | head -1))"

# ── Build Docker image ──────────────────────────────────────────────────────
IMAGE_NAME="agent-hands-test-browser"

info "Building Docker image for browser tests..."
$DOCKER build -t "$IMAGE_NAME" -f "$DOCKER_DIR/Dockerfile.test-browser" "$ROOT_DIR"

success "Docker image built: $IMAGE_NAME"

# ── Run tests ───────────────────────────────────────────────────────────
echo ""
info "Running real browser tests in container..."
echo ""

$DOCKER run --rm "$IMAGE_NAME"
EXIT_CODE=$?

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  success "All browser Docker integration tests passed! 🎉"
else
  error "Browser Docker tests failed."
fi
