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
# Determine the best BIN_DIR (prefer user-local directories if they are in PATH)
if [ -z "${BIN_DIR:-}" ]; then
  if [[ ":$PATH:" == *":$HOME/.local/bin:"* ]]; then
    BIN_DIR="$HOME/.local/bin"
  elif [[ ":$PATH:" == *":$HOME/bin:"* ]]; then
    BIN_DIR="$HOME/bin"
  else
    BIN_DIR="/usr/local/bin"
  fi
fi
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

# ── 5. Extract (safe: stage first, then swap) ──────────────────────────────
info "Installing to ${INSTALL_DIR}..."
IS_FIRST_INSTALL=false
if [ ! -d "$INSTALL_DIR" ] || [ ! -f "$INSTALL_DIR/package.json" ]; then
  IS_FIRST_INSTALL=true
fi

STAGING_DIR="$TMP_DIR/staging"
mkdir -p "$STAGING_DIR"
tar -xzf "$TMP_DIR/$TARBALL_NAME" -C "$STAGING_DIR" --strip-components=1

# Only remove old installation after successful extract
rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$STAGING_DIR" "$INSTALL_DIR"

# ── 6. Set permissions ──────────────────────────────────────────────────────
chmod +x "$INSTALL_DIR/bin/agent-hands.js"

# ── 7. Create symlink ──────────────────────────────────────────────────────
LINK_TARGET="$INSTALL_DIR/bin/agent-hands.js"

# Check if correct symlink already exists to avoid unnecessary sudo prompts on updates
if [ -L "$BIN_DIR/$BIN_NAME" ] && [ "$(readlink "$BIN_DIR/$BIN_NAME")" = "$LINK_TARGET" ]; then
  info "Symlink already exists and is correct. Skipping."
else
  info "Creating symlink..."

  # Ensure BIN_DIR exists
  if [ ! -d "$BIN_DIR" ]; then
    info "Creating directory ${BIN_DIR}..."
    if [ -w "$(dirname "$BIN_DIR")" ]; then
      mkdir -p "$BIN_DIR"
    else
      warn "Need sudo to create directory ${BIN_DIR}"
      sudo mkdir -p "$BIN_DIR" || warn "Could not create directory ${BIN_DIR}."
    fi
  fi

  if [ -d "$BIN_DIR" ]; then
    NEEDS_SUDO=false
    if [ ! -w "$BIN_DIR" ]; then
      NEEDS_SUDO=true
    fi

    if [ "$NEEDS_SUDO" = true ]; then
      warn "Need sudo to create symlink in ${BIN_DIR}"
      sudo ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME" || warn "Failed to create symlink in ${BIN_DIR}. You can create it manually later."
    else
      ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME" || warn "Failed to create symlink in ${BIN_DIR}. You can create it manually later."
    fi
  fi
fi

# ── 8. First-run init (create super admin) ──────────────────────────────────
if [ "$IS_FIRST_INSTALL" = true ]; then
  echo ""
  info "First install detected — initializing super admin..."
  bun "$INSTALL_DIR/bin/agent-hands.js" init || warn "Auto-init failed. Run 'agent-hands init' manually after start."
fi

# ── 9. Start/Restart Server ──────────────────────────────────────────────────
echo ""
info "Starting Agent Hands server..."
if bun "$INSTALL_DIR/bin/agent-hands.js" restart; then
  echo ""
  success "Agent Hands is up and running!"
  echo -e "   ${BOLD}Version${NC}  : ${VERSION_NUM}"
  echo -e "   ${BOLD}Location${NC} : ${INSTALL_DIR}"
  if [ -x "$BIN_DIR/$BIN_NAME" ]; then
    echo -e "   ${BOLD}Binary${NC}   : ${BIN_DIR}/${BIN_NAME}"
  fi
  echo ""
  echo -e "   🎉 ${BOLD}Web UI is available at:${NC}"
  echo -e "     🔗  ${CYAN}http://localhost:18080${NC}"
  echo ""
  echo -e "   To manage the server in the future:"
  echo -e "     ${CYAN}agent-hands stop${NC}      # Stop the server"
  echo -e "     ${CYAN}agent-hands status${NC}    # Check status"
  echo -e "     ${CYAN}agent-hands logs${NC}      # View logs"
  echo ""
else
  warn "Could not start Agent Hands server automatically."
  echo ""
  success "Agent Hands files installed successfully to ${INSTALL_DIR}"
  if ! command -v "$BIN_NAME" &> /dev/null; then
    warn "Could not verify binary in PATH. You may need to add it manually:"
    echo -e "     ${CYAN}export PATH=\"${BIN_DIR}:\$PATH\"${NC}"
  fi
  echo ""
fi
