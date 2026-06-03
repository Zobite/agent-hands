#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run-browser-tests.sh — runs inside the Docker container
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

export DATA_DIR="$HOME/.agent-hands-test"
export PORT=18080
export HOST="127.0.0.1"
export NODE_ENV="test"

echo "=== Setup Environment ==="
rm -rf "$DATA_DIR"
mkdir -p "$DATA_DIR"

# ── Phase 1: Test Server behavior WITHOUT Playwright ─────────────────────────
echo "=== Phase 1: Test Server behavior WITHOUT Playwright ==="

# Force remove playwright to simulate missing package
echo "Removing Playwright from node_modules..."
rm -rf /app/node_modules/playwright /app/src/server/node_modules/playwright

# Start Server
echo "Starting Agent Hands server..."
bun src/server/src/index.ts &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to be healthy..."
HEALTHY=false
for i in {1..30}; do
  if curl -s "http://127.0.0.1:18080/api/health" &>/dev/null; then
    echo "Server is healthy."
    HEALTHY=true
    break
  fi
  sleep 1
done

if [ "$HEALTHY" = false ]; then
  echo "Error: Server failed to start or become healthy."
  exit 1
fi

# Run verify-no-playwright
echo "Running no-playwright verification..."
bun scripts/docker/test-browser-helper.ts verify-no-playwright

# Stop server
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID || true

# ── Phase 2: Install Playwright & Chromium ───────────────────────────────────
echo "=== Phase 2: Installing Playwright & Chromium ==="
cd /app
npm install playwright --no-audit --no-fund --ignore-scripts
# Install chromium via playwright
npx playwright install chromium

# ── Phase 3: Test Server and browser profiles with Playwright ────────────────
echo "=== Phase 3: Test Server behavior WITH Playwright ==="

# Start Server
echo "Starting Agent Hands server..."
bun src/server/src/index.ts &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to be healthy..."
HEALTHY=false
for i in {1..30}; do
  if curl -s "http://127.0.0.1:18080/api/health" &>/dev/null; then
    echo "Server is healthy."
    HEALTHY=true
    break
  fi
  sleep 1
done

if [ "$HEALTHY" = false ]; then
  echo "Error: Server failed to start or become healthy."
  exit 1
fi

# Run verify-with-playwright
echo "Running playwright verification..."
bun scripts/docker/test-browser-helper.ts verify-with-playwright

# Stop server
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID || true

echo "=== All Real Browser Integration Tests Passed! 🎉 ==="
exit 0
