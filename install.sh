#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash
#
# Options (environment variables):
#   VERSION=0.3.0      Install a specific version (default: latest)
#   INSTALL_DIR=...    Custom install directory (default: ~/.local/share/agent-hands)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
REPO="Zobite/agent-hands"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/share/agent-hands}"
BIN_DIR="/usr/local/bin"
BIN_NAME="agent-hands"

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

# ── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🤖 Agent Hands — Installer${NC}"
echo ""

# ── 1. Check prerequisites ─────────────────────────────────────────────────
if ! command -v bun &> /dev/null; then
  error "Bun runtime is required but not installed.
   Install it first:  curl -fsSL https://bun.sh/install | bash
   Then re-run this installer."
fi

BUN_VERSION=$(bun --version 2>/dev/null || echo "0.0.0")
info "Bun detected: v${BUN_VERSION}"

if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
  error "Either 'curl' or 'wget' is required to download files."
fi

# ── 2. Determine version ───────────────────────────────────────────────────
if [ -n "${VERSION:-}" ]; then
  TAG="v${VERSION}"
  info "Installing specified version: ${TAG}"
else
  info "Fetching latest release..."
  if command -v curl &> /dev/null; then
    TAG=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  else
    TAG=$(wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  fi

  if [ -z "$TAG" ]; then
    error "Could not determine the latest version. Check https://github.com/${REPO}/releases"
  fi

  info "Latest version: ${TAG}"
fi

VERSION_NUM="${TAG#v}"
TARBALL_NAME="agent-hands-${VERSION_NUM}.tar.gz"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${TARBALL_NAME}"

# ── 3. Check for existing installation ──────────────────────────────────────
if [ -d "$INSTALL_DIR" ]; then
  EXISTING_VERSION=""
  if [ -f "$INSTALL_DIR/package.json" ]; then
    EXISTING_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
  fi

  if [ -n "$EXISTING_VERSION" ]; then
    if [ "$EXISTING_VERSION" = "$VERSION_NUM" ]; then
      warn "v${VERSION_NUM} is already installed. Reinstalling..."
    else
      info "Upgrading v${EXISTING_VERSION} → v${VERSION_NUM}"
    fi
  fi
fi

# ── 4. Download ─────────────────────────────────────────────────────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

info "Downloading ${TARBALL_NAME}..."
if command -v curl &> /dev/null; then
  curl -fSL --progress-bar "$DOWNLOAD_URL" -o "$TMP_DIR/$TARBALL_NAME"
else
  wget --show-progress -q "$DOWNLOAD_URL" -O "$TMP_DIR/$TARBALL_NAME"
fi

# ── 5. Extract ──────────────────────────────────────────────────────────────
info "Installing to ${INSTALL_DIR}..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
tar -xzf "$TMP_DIR/$TARBALL_NAME" -C "$INSTALL_DIR" --strip-components=1

# ── 6. Set permissions ──────────────────────────────────────────────────────
chmod +x "$INSTALL_DIR/bin/agent-hands.js"

# ── 7. Create symlink ──────────────────────────────────────────────────────
info "Creating symlink..."

NEEDS_SUDO=false
if [ ! -w "$BIN_DIR" ]; then
  NEEDS_SUDO=true
fi

LINK_TARGET="$INSTALL_DIR/bin/agent-hands.js"

if [ "$NEEDS_SUDO" = true ]; then
  warn "Need sudo to create symlink in ${BIN_DIR}"
  sudo ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME"
else
  ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME"
fi

# ── 8. Verify ───────────────────────────────────────────────────────────────
echo ""
if command -v "$BIN_NAME" &> /dev/null; then
  INSTALLED_V=$($BIN_NAME version 2>/dev/null || echo "unknown")
  success "Agent Hands installed successfully!"
  echo ""
  echo -e "   ${BOLD}Version${NC}  : ${VERSION_NUM}"
  echo -e "   ${BOLD}Location${NC} : ${INSTALL_DIR}"
  echo -e "   ${BOLD}Binary${NC}   : ${BIN_DIR}/${BIN_NAME}"
  echo ""
  echo -e "   ${BOLD}Quick start:${NC}"
  echo -e "     ${CYAN}agent-hands start${NC}          # Start the server"
  echo -e "     ${CYAN}open http://localhost:18080${NC}      # Open Web UI"
  echo ""
else
  success "Files installed to ${INSTALL_DIR}"
  warn "Could not verify binary in PATH. You may need to add it manually:"
  echo ""
  echo -e "     ${CYAN}export PATH=\"${BIN_DIR}:\$PATH\"${NC}"
  echo ""
fi
