#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Runs INSIDE the Docker container.
# Tests the REAL install.sh with a local HTTP server serving the tarball.
# Everything is real: bun, tar, sudo, file permissions, symlinks.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0
FAILED_TESTS=()

pass() {
  TESTS_PASSED=$((TESTS_PASSED + 1))
  echo -e "  ${GREEN}✅ PASS${NC}: $1"
}

fail_test() {
  TESTS_FAILED=$((TESTS_FAILED + 1))
  FAILED_TESTS+=("$1")
  echo -e "  ${RED}❌ FAIL${NC}: $1"
  if [ -n "${2:-}" ]; then
    echo -e "         ${DIM}$2${NC}"
  fi
}

assert() {
  local desc="$1"
  shift
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if "$@" 2>/dev/null; then
    pass "$desc"
  else
    fail_test "$desc" "Command failed: $*"
  fi
}

assert_not() {
  local desc="$1"
  shift
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if ! "$@" 2>/dev/null; then
    pass "$desc"
  else
    fail_test "$desc" "Command unexpectedly succeeded: $*"
  fi
}

assert_eq() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    pass "$desc"
  else
    fail_test "$desc" "Expected '$expected', got '$actual'"
  fi
}

assert_contains_output() {
  local desc="$1"
  local output="$2"
  local pattern="$3"
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if echo "$output" | grep -q "$pattern"; then
    pass "$desc"
  else
    fail_test "$desc" "Pattern '$pattern' not found in output"
  fi
}

assert_not_contains_output() {
  local desc="$1"
  local output="$2"
  local pattern="$3"
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if ! echo "$output" | grep -q "$pattern"; then
    pass "$desc"
  else
    fail_test "$desc" "Pattern '$pattern' unexpectedly found in output"
  fi
}

# ── Local HTTP Server ───────────────────────────────────────────────────────

HTTP_PID=""
HTTP_PORT=18888

start_http_server() {
  # Serve /test/http directory on port 18888
  cd /test/http
  python3 -m http.server "$HTTP_PORT" --bind 127.0.0.1 &>/dev/null &
  HTTP_PID=$!
  cd ~
  # Wait for server to be ready
  for i in $(seq 1 20); do
    if curl -s "http://127.0.0.1:$HTTP_PORT/" &>/dev/null; then
      return 0
    fi
    sleep 0.1
  done
  echo "ERROR: HTTP server failed to start" >&2
  return 1
}

stop_http_server() {
  if [ -n "$HTTP_PID" ]; then
    kill "$HTTP_PID" 2>/dev/null || true
    wait "$HTTP_PID" 2>/dev/null || true
    HTTP_PID=""
  fi
}

# ── Patched Installer ──────────────────────────────────────────────────────
# Creates a copy of install.sh that uses our local HTTP server instead of GitHub

create_patched_installer() {
  local output_path="$1"
  sed \
    -e "s|https://api.github.com|http://127.0.0.1:$HTTP_PORT|g" \
    -e "s|https://github.com|http://127.0.0.1:$HTTP_PORT|g" \
    /test/install.sh > "$output_path"
  chmod +x "$output_path"
}

# ── Clean State ─────────────────────────────────────────────────────────────

cleanup_state() {
  rm -rf "$HOME/.local/share/agent-hands" 2>/dev/null || true
  sudo rm -f /usr/local/bin/agent-hands 2>/dev/null || true
  rm -f "$HOME/.local/bin/agent-hands" 2>/dev/null || true
  rm -f "$HOME/bin/agent-hands" 2>/dev/null || true
}

# ── Test Cases ──────────────────────────────────────────────────────────────

test_fresh_install_real() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: Fresh Install — Real Environment${NC}"

  cleanup_state

  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  local output
  output=$(VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  local install_dir="$HOME/.local/share/agent-hands"

  assert_eq "Exit code is 0" "0" "$exit_code"
  assert "Install directory exists" test -d "$install_dir"
  assert "package.json exists" test -f "$install_dir/package.json"
  assert "CLI script exists" test -f "$install_dir/bin/agent-hands.js"
  assert "CLI script is executable" test -x "$install_dir/bin/agent-hands.js"
  assert "dist/index.js exists" test -f "$install_dir/dist/index.js"

  # Verify version in package.json
  local installed_version
  installed_version=$(grep '"version"' "$install_dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
  assert_eq "Installed version is 1.0.0" "1.0.0" "$installed_version"

  # Verify symlink exists (either in /usr/local/bin or ~/.local/bin)
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  if [ -L /usr/local/bin/agent-hands ] || [ -L "$HOME/.local/bin/agent-hands" ]; then
    pass "Symlink created"
  else
    fail_test "Symlink created" "No symlink in /usr/local/bin or ~/.local/bin"
  fi

  # Verify CLI works via bun
  local cli_output
  cli_output=$(bun "$install_dir/bin/agent-hands.js" version 2>&1)
  assert_contains_output "CLI version command works" "$cli_output" "v1.0.0"

  # Verify first-install init ran
  assert_contains_output "First install detected" "$output" "First install detected"
  assert_contains_output "Super admin init ran" "$output" "Super admin created"

  # Verify server start output
  assert_contains_output "Web UI URL displayed" "$output" "localhost:18080"

  cleanup_state
}

test_upgrade_real() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: Upgrade v0.9.0 → v1.0.0 — Real Environment${NC}"

  cleanup_state

  # Pre-install fake v0.9.0
  local install_dir="$HOME/.local/share/agent-hands"
  mkdir -p "$install_dir/bin"
  cat > "$install_dir/package.json" << 'EOF'
{
  "name": "agent-hands",
  "version": "0.9.0"
}
EOF
  echo '#!/usr/bin/env bun' > "$install_dir/bin/agent-hands.js"
  chmod +x "$install_dir/bin/agent-hands.js"

  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  local output
  output=$(VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  assert_eq "Exit code is 0" "0" "$exit_code"

  local installed_version
  installed_version=$(grep '"version"' "$install_dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
  assert_eq "Upgraded to v1.0.0" "1.0.0" "$installed_version"

  assert_contains_output "Upgrade message shown" "$output" "Upgrading v0.9.0"
  assert_not_contains_output "Not detected as first install" "$output" "First install detected"
  assert_not_contains_output "Init not run on upgrade" "$output" "Super admin created"

  cleanup_state
}

test_usr_local_bin_missing() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: /usr/local/bin Missing — Real sudo${NC}"

  cleanup_state

  # Remove /usr/local/bin to simulate fresh macOS
  sudo rm -rf /usr/local/bin

  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  local output
  output=$(VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  assert_eq "Exit code is 0" "0" "$exit_code"
  assert "Directory /usr/local/bin was created" test -d /usr/local/bin
  assert "Symlink created via sudo" test -L /usr/local/bin/agent-hands

  # Restore
  cleanup_state
}

test_local_bin_preferred() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: ~/.local/bin Preferred Over /usr/local/bin${NC}"

  cleanup_state

  # Create ~/.local/bin and add to PATH
  mkdir -p "$HOME/.local/bin"

  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  local install_dir="$HOME/.local/share/agent-hands"
  local output
  output=$(PATH="$HOME/.local/bin:$PATH" VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  assert_eq "Exit code is 0" "0" "$exit_code"
  assert "Symlink created in ~/.local/bin" test -L "$HOME/.local/bin/agent-hands"

  local link_target
  link_target=$(readlink "$HOME/.local/bin/agent-hands")
  assert_eq "Symlink points to correct target" "$install_dir/bin/agent-hands.js" "$link_target"

  # Verify /usr/local/bin was NOT used
  assert_not "/usr/local/bin NOT used" test -L /usr/local/bin/agent-hands

  cleanup_state
}

test_corrupt_tarball_real() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: Corrupt Tarball — Old Install Preserved${NC}"

  cleanup_state

  # Pre-install v0.9.0
  local install_dir="$HOME/.local/share/agent-hands"
  mkdir -p "$install_dir/bin"
  cat > "$install_dir/package.json" << 'EOF'
{
  "name": "agent-hands",
  "version": "0.9.0"
}
EOF
  echo '#!/usr/bin/env bun' > "$install_dir/bin/agent-hands.js"
  chmod +x "$install_dir/bin/agent-hands.js"

  # Create patched installer that uses a corrupt tarball
  # We'll override the download to serve garbage
  local corrupt_http="/tmp/corrupt-http"
  mkdir -p "$corrupt_http/repos/Zobite/agent-hands/releases"
  echo '{"tag_name": "v1.0.0"}' > "$corrupt_http/repos/Zobite/agent-hands/releases/latest"
  mkdir -p "$corrupt_http/Zobite/agent-hands/releases/download/v1.0.0"
  echo "CORRUPT DATA" > "$corrupt_http/Zobite/agent-hands/releases/download/v1.0.0/agent-hands-1.0.0.tar.gz"

  # Start a separate HTTP server for corrupt data
  cd "$corrupt_http"
  python3 -m http.server 18889 --bind 127.0.0.1 &>/dev/null &
  local corrupt_pid=$!
  cd ~
  sleep 0.5

  local installer="/tmp/install-corrupt.sh"
  sed \
    -e "s|https://api.github.com|http://127.0.0.1:18889|g" \
    -e "s|https://github.com|http://127.0.0.1:18889|g" \
    /test/install.sh > "$installer"
  chmod +x "$installer"

  local output
  output=$(VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  kill "$corrupt_pid" 2>/dev/null || true

  assert_not "Installer fails on corrupt tarball" test "$exit_code" -eq 0
  assert "Old package.json still exists" test -f "$install_dir/package.json"

  local preserved_version
  preserved_version=$(grep '"version"' "$install_dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
  assert_eq "Old version v0.9.0 preserved" "0.9.0" "$preserved_version"

  rm -rf "$corrupt_http"
  cleanup_state
}

test_path_with_spaces() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: INSTALL_DIR With Spaces${NC}"

  cleanup_state

  local install_dir="$HOME/my apps/agent hands"
  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  local output
  output=$(INSTALL_DIR="$install_dir" VERSION=1.0.0 bash "$installer" 2>&1)
  local exit_code=$?

  assert_eq "Exit code is 0" "0" "$exit_code"
  assert "Install dir with spaces exists" test -d "$install_dir"
  assert "package.json in spaced path" test -f "$install_dir/package.json"
  assert "CLI script in spaced path" test -x "$install_dir/bin/agent-hands.js"

  # Verify CLI actually works with spaces in path
  local cli_output
  cli_output=$(bun "$install_dir/bin/agent-hands.js" version 2>&1)
  assert_contains_output "CLI works from spaced path" "$cli_output" "v1.0.0"

  rm -rf "$install_dir"
  cleanup_state
}

test_symlink_update_on_upgrade() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: Symlink Stays Correct After Upgrade${NC}"

  cleanup_state

  local install_dir="$HOME/.local/share/agent-hands"
  mkdir -p "$HOME/.local/bin"

  # First install
  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  PATH="$HOME/.local/bin:$PATH" VERSION=1.0.0 bash "$installer" &>/dev/null

  # Verify symlink
  assert "Symlink exists after first install" test -L "$HOME/.local/bin/agent-hands"

  local target_before
  target_before=$(readlink "$HOME/.local/bin/agent-hands")

  # Second install (upgrade)
  PATH="$HOME/.local/bin:$PATH" VERSION=1.0.0 bash "$installer" &>/dev/null

  local target_after
  target_after=$(readlink "$HOME/.local/bin/agent-hands")

  assert_eq "Symlink target unchanged after upgrade" "$target_before" "$target_after"

  cleanup_state
}

test_file_permissions_real() {
  echo -e "\n${CYAN}${BOLD}▸ TEST [Docker]: File Permissions Are Correct${NC}"

  cleanup_state

  local installer="/tmp/install-test.sh"
  create_patched_installer "$installer"

  VERSION=1.0.0 bash "$installer" &>/dev/null

  local install_dir="$HOME/.local/share/agent-hands"

  # Check executable bit
  assert "CLI has executable permission" test -x "$install_dir/bin/agent-hands.js"

  # Verify owner is testuser (not root)
  local file_owner
  file_owner=$(stat -c '%U' "$install_dir/bin/agent-hands.js" 2>/dev/null)
  assert_eq "CLI owned by testuser" "testuser" "$file_owner"

  cleanup_state
}

# ── Runner ──────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}🐳 Agent Hands — Docker Integration Tests${NC}"
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo -e "${DIM}Environment: $(uname -s) $(uname -m), Bun $(bun --version 2>/dev/null || echo 'N/A')${NC}"

# Start local HTTP server
start_http_server
trap 'stop_http_server' EXIT

ALL_TESTS=(
  test_fresh_install_real
  test_upgrade_real
  test_usr_local_bin_missing
  test_local_bin_preferred
  test_corrupt_tarball_real
  test_path_with_spaces
  test_symlink_update_on_upgrade
  test_file_permissions_real
)

for test_fn in "${ALL_TESTS[@]}"; do
  "$test_fn"
done

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Results:${NC} ${GREEN}${TESTS_PASSED} passed${NC}, ${RED}${TESTS_FAILED} failed${NC}, ${TESTS_TOTAL} total"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}${BOLD}Failed tests:${NC}"
  for ft in "${FAILED_TESTS[@]}"; do
    echo -e "  ${RED}• $ft${NC}"
  done
fi

echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
  exit 1
else
  echo -e "${GREEN}${BOLD}All Docker tests passed! 🎉${NC}"
  exit 0
fi
