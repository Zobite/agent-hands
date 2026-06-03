#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Docker-based install.sh Integration Tests
#
# Runs the REAL install.sh inside a clean Docker container with:
#   ✅ Real Bun runtime
#   ✅ Real tar, chmod, ln, mkdir, sudo
#   ✅ Real file permissions (non-root user with sudo)
#   ✅ Clean Linux environment (no prior state)
#   ✅ Local HTTP server serving a test tarball
#
# Usage:
#   bash scripts/test-install-docker.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/scripts/docker"
SCRIPT_NAME="test-install-docker"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
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

# Ensure Docker helper binaries (credential helpers, etc.) are in PATH
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

echo ""
echo -e "${BOLD}🐳 Agent Hands — Docker Integration Tests for install.sh${NC}"
echo ""

# ── 1. Create test tarball ──────────────────────────────────────────────────
info "Creating test tarball..."

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

STAGING="$TMP_DIR/agent-hands"
mkdir -p "$STAGING/bin" "$STAGING/dist" "$STAGING/public"

# Real CLI entry point (simplified but functional with bun)
cat > "$STAGING/bin/agent-hands.js" << 'CLI'
#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const dataDir = process.env.DATA_DIR ?? join(os.homedir(), ".agent-hands");
const markerFile = join(dataDir, ".initialized");

const cmd = process.argv[2];
switch (cmd) {
  case "version": console.log(`agent-hands v1.0.0`); break;
  case "init":    console.log("✅ Super admin created (test)."); break;
  case "start":   console.log("🤖 Server started (test)."); break;
  case "stop":    console.log("🛑 Server stopped (test)."); break;
  case "restart":
    console.log("🛑 Stopping...");
    // Simulate first-install detection (like real seedDefaultAdmin)
    if (!existsSync(markerFile)) {
      console.log("🔑 Default super admin created:");
      console.log("   Username : admin");
      const { mkdirSync, writeFileSync } = await import("node:fs");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(markerFile, "done");
    }
    console.log("🤖 Agent Hands started!");
    console.log("   PID      : 12345");
    console.log("   URL      : http://127.0.0.1:18080");
    break;
  case "status":  console.log("🟢 Agent Hands is running"); break;
  default:        console.log("Usage: agent-hands <command>"); break;
}
CLI
chmod +x "$STAGING/bin/agent-hands.js"

cat > "$STAGING/package.json" << 'PKG'
{
  "name": "agent-hands",
  "version": "1.0.0"
}
PKG

echo "// server entry (test)" > "$STAGING/dist/index.js"

TARBALL_PATH="$TMP_DIR/agent-hands-1.0.0.tar.gz"
(cd "$TMP_DIR" && COPYFILE_DISABLE=1 tar -czf "$TARBALL_PATH" agent-hands)

success "Test tarball created"

# ── 2. Prepare local HTTP server files ──────────────────────────────────────
info "Preparing HTTP server content..."

HTTP_DIR="$TMP_DIR/http"

# API endpoint: install.sh does curl https://api.github.com/repos/Zobite/agent-hands/releases/latest
# After sed: http://127.0.0.1:18888/repos/Zobite/agent-hands/releases/latest
mkdir -p "$HTTP_DIR/repos/Zobite/agent-hands/releases"
echo '{"tag_name": "v1.0.0"}' > "$HTTP_DIR/repos/Zobite/agent-hands/releases/latest"

# Download endpoint: install.sh does curl https://github.com/Zobite/agent-hands/releases/download/v1.0.0/agent-hands-1.0.0.tar.gz
# After sed: http://127.0.0.1:18888/Zobite/agent-hands/releases/download/v1.0.0/agent-hands-1.0.0.tar.gz
mkdir -p "$HTTP_DIR/Zobite/agent-hands/releases/download/v1.0.0"
cp "$TARBALL_PATH" "$HTTP_DIR/Zobite/agent-hands/releases/download/v1.0.0/"

success "HTTP content ready"

# ── 3. Build Docker image ──────────────────────────────────────────────────
IMAGE_NAME="agent-hands-test-install"

info "Building Docker image..."
$DOCKER build -t "$IMAGE_NAME" -f "$DOCKER_DIR/Dockerfile.test-install" "$DOCKER_DIR" --quiet

success "Docker image built: $IMAGE_NAME"

# ── 4. Run tests ───────────────────────────────────────────────────────────
echo ""
info "Running tests in container..."
echo ""

$DOCKER run --rm \
  -v "$ROOT_DIR/install.sh:/test/install.sh:ro" \
  -v "$HTTP_DIR:/test/http:ro" \
  -e "TEST_VERSION=1.0.0" \
  "$IMAGE_NAME"

EXIT_CODE=$?

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
  success "All Docker integration tests passed! 🎉"
else
  error "Some Docker tests failed."
fi
