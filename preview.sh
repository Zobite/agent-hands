#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Config ──────────────────────────────────────────────────────────────────────
PREVIEW_PORT="${PREVIEW_PORT:-19080}"
PREVIEW_HOST="${PREVIEW_HOST:-127.0.0.1}"
PREVIEW_DATA_DIR="${PREVIEW_DATA_DIR:-$HOME/.moro-llm-toolkit-preview}"

echo ""
echo "🔍 Moro LLM Toolkit — Preview (Production Mode)"
echo ""
echo "   Port     : $PREVIEW_PORT"
echo "   Host     : $PREVIEW_HOST"
echo "   Data dir : $PREVIEW_DATA_DIR"
echo ""

# ── 1. Build Web ────────────────────────────────────────────────────────────────
echo "📦 [1/3] Building Web (vite)..."
(cd src/web && bun run build) || { echo "❌ Web build failed!"; exit 1; }

# ── 2. Build Server ────────────────────────────────────────────────────────────
echo "📦 [2/3] Building Server (bun bundle)..."
(cd src/server && bun run build) || { echo "❌ Server build failed!"; exit 1; }

# ── 3. Prepare public dir ──────────────────────────────────────────────────────
echo "📁 [3/3] Preparing public dir..."
rm -rf public
cp -r src/web/dist ./public

echo ""
echo "✅ Build complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting production server..."
echo "   Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Run in foreground (production mode) ─────────────────────────────────────────
PORT="$PREVIEW_PORT" \
HOST="$PREVIEW_HOST" \
DATA_DIR="$PREVIEW_DATA_DIR" \
NODE_ENV=production \
  bun run dist/index.js
