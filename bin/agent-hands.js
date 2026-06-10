#!/usr/bin/env bun
/**
 * Agent Hands CLI
 * Manages the Agent Hands server as a background daemon or foreground process.
 *
 * Usage:
 *   agent-hands start [--port N] [--host H] [--data-dir D] [--foreground]
 *   agent-hands stop
 *   agent-hands restart [same flags as start]
 *   agent-hands status
 *   agent-hands logs [--lines N] [--follow]
 *   agent-hands version
 *   agent-hands init          -- create super admin on first run
 *   agent-hands mcp           -- start MCP server (stdio)
 */

import { execSync, spawn } from "node:child_process";
import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readlinkSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");

// ─── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PORT = 18080;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_DATA_DIR = join(os.homedir(), ".agent-hands");

// ─── Parse CLI ─────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const COMMANDS = ["start", "stop", "status", "restart", "logs", "version", "init", "mcp", "uninstall", "help", "_monitor"];
const command = COMMANDS.includes(rawArgs[0]) ? rawArgs.shift() : "help";

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--foreground" || arg === "-f") {
      flags.foreground = true;
    } else if (arg === "--follow") {
      flags.follow = true;
    } else if (arg.startsWith("--") && arg.includes("=")) {
      // Support --key=value syntax
      const eqIdx = arg.indexOf("=");
      flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
    } else if (arg.startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      flags[arg.slice(2)] = args[++i];
    }
  }
  return flags;
}

const flags = parseFlags(rawArgs);

// ─── Persisted config ──────────────────────────────────────────────────────────
// Config file lives in dataDir (survives upgrades that rm -rf the install dir).
// We need dataDir to find the config, but dataDir can come from the config.
// Resolution order: CLI flag → env var → config file → default.
// To bootstrap: resolve dataDir first from flags/env/default, then load config from there.

function loadSavedConfig() {
  // 1. Determine dataDir without config (flags → env → default)
  const bootstrapDataDir = flags["data-dir"] ?? process.env.DATA_DIR ?? DEFAULT_DATA_DIR;
  const newPath = join(bootstrapDataDir, ".agent-hands.conf");
  // 2. Also check old location (PKG_ROOT) for migration from older versions
  const oldPath = join(PKG_ROOT, ".agent-hands.conf");

  for (const path of [newPath, oldPath]) {
    try {
      if (existsSync(path)) {
        const config = JSON.parse(readFileSync(path, "utf-8"));
        // Migrate: if loaded from old location, delete it after first load
        if (path === oldPath && path !== newPath) {
          try { unlinkSync(oldPath); } catch {}
        }
        return config;
      }
    } catch {}
  }
  return {};
}

const savedConfig = loadSavedConfig();
const dataDir = flags["data-dir"] ?? process.env.DATA_DIR ?? savedConfig.dataDir ?? DEFAULT_DATA_DIR;
const port = Number(flags.port ?? process.env.PORT ?? savedConfig.port ?? DEFAULT_PORT);
const host = flags.host ?? process.env.HOST ?? savedConfig.host ?? DEFAULT_HOST;

// Validate port
if (Number.isNaN(port) || port < 1 || port > 65535 || !Number.isInteger(port)) {
  console.error(`❌ Invalid port: ${flags.port ?? process.env.PORT ?? savedConfig.port}`);
  console.error(`   Port must be an integer between 1 and 65535.`);
  process.exit(1);
}

// Config file definitive location (in dataDir)
const configFile = join(dataDir, ".agent-hands.conf");

function saveConfig(config) {
  try {
    writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
  } catch {}
}

// Ensure data dir exists (needed for PID file, log file, config)
// Only create for commands that actually need it
const NEEDS_DATA_DIR = ["start", "stop", "status", "restart", "logs", "init", "mcp", "_monitor", "uninstall"];
if (NEEDS_DATA_DIR.includes(command)) {
  mkdirSync(dataDir, { recursive: true });
}

const pidFile = join(dataDir, "server.pid");
const logFile = join(dataDir, "server.log");
const serverEntry = join(PKG_ROOT, "dist", "index.js");

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a PID belongs to an agent-hands process (guards against PID reuse by OS).
 * Returns true if we can confirm it's ours, or if we can't determine (benefit of doubt).
 */
function isOurProcess(pid) {
  try {
    const cmd = execSync(`ps -p ${pid} -o command=`, { encoding: "utf-8", timeout: 2000 }).trim();
    // Check if the process command line mentions agent-hands or our server entry
    return cmd.includes("agent-hands") || cmd.includes("dist/index.js");
  } catch {
    // ps failed (process may have just died, or ps not available)
    // Fall back to basic alive check
    return isProcessAlive(pid);
  }
}

function readPid() {
  if (!existsSync(pidFile)) return null;
  const raw = readFileSync(pidFile, "utf-8").trim();
  const pid = Number(raw);
  if (Number.isNaN(pid)) return null;
  // Process must be alive AND actually be agent-hands (not a reused PID)
  if (isProcessAlive(pid) && isOurProcess(pid)) return pid;
  try {
    unlinkSync(pidFile);
  } catch {}
  return null;
}

function writePid(pid) {
  writeFileSync(pidFile, String(pid), "utf-8");
}

function removePid() {
  try {
    unlinkSync(pidFile);
  } catch {}
}

function getLocalVersion() {
  try {
    return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8")).version;
  } catch {
    return null;
  }
}

/**
 * Find PIDs listening on a given port.
 * Returns an array of PID numbers. Empty if port is free.
 */
function findPidsOnPort(targetPort) {
  // Try lsof first (macOS + most Linux)
  try {
    const out = execSync(`lsof -ti :${targetPort}`, { encoding: "utf-8", timeout: 3000 }).trim();
    if (out) return out.split("\n").map(Number).filter((p) => !Number.isNaN(p) && p > 0);
  } catch {}
  // Fallback: ss (Linux without lsof, e.g. Alpine/Debian slim)
  try {
    const out = execSync(`ss -tlnp sport = :${targetPort}`, { encoding: "utf-8", timeout: 3000 });
    const pids = [];
    for (const match of out.matchAll(/pid=(\d+)/g)) {
      const p = Number(match[1]);
      if (p > 0) pids.push(p);
    }
    return pids;
  } catch {}
  return [];
}

/**
 * Kill an entire process group (monitor + its children).
 * Falls back to single-PID kill if group kill fails.
 */
function killProcessGroup(pid, signal = "SIGTERM") {
  // Try killing the entire process group first (negative PID)
  try {
    process.kill(-pid, signal);
    return;
  } catch {}
  // Fallback: kill just the PID
  try {
    process.kill(pid, signal);
  } catch {}
}

// ─── Commands ──────────────────────────────────────────────────────────────────

async function cmdStart() {
  // ── Guard: check PID file ────────────────────────────────────────────────
  const existing = readPid();
  if (existing) {
    console.log(`⚠️  Agent Hands is already running (PID: ${existing})`);
    console.log(`   Use 'agent-hands restart' to restart.`);
    process.exit(1);
  }

  // ── Guard: check if port is occupied (catches orphaned processes) ───────
  const portPids = findPidsOnPort(port);
  if (portPids.length > 0) {
    console.log(`⚠️  Port ${port} is already in use (PIDs: ${portPids.join(", ")})`);
    console.log(`   This may be an orphaned Agent Hands process or another application.`);
    console.log(`   Kill it first:  kill ${portPids.join(" ")}`);
    console.log(`   Or use a different port:  agent-hands start --port <other-port>`);
    process.exit(1);
  }

  if (!existsSync(serverEntry)) {
    console.error(`❌ Server entry not found: ${serverEntry}`);
    console.error("   Run 'bun run build:server' first.");
    process.exit(1);
  }

  // Persist config so other commands auto-detect paths
  saveConfig({ dataDir, port, host });

  // ── Foreground mode ──────────────────────────────────────────────────────
  if (flags.foreground) {
    console.log("\n🤖 Agent Hands starting in foreground mode...");
    console.log(`   Port     : ${port}`);
    console.log(`   Host     : ${host}`);
    console.log(`   Data dir : ${dataDir}\n`);

    // Write PID so other CLI commands know we're running
    writePid(process.pid);
    const cleanup = () => { removePid(); process.exit(0); };
    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);

    process.env.PORT = String(port);
    process.env.HOST = host;
    process.env.DATA_DIR = dataDir;

    const { startServer } = await import(serverEntry);
    await startServer();
    return;
  }

  // ── Daemon mode ──────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const separator = "─".repeat(60);
  appendFileSync(logFile, `\n${separator}\n[${now}] Starting Agent Hands (port: ${port}, host: ${host})\n${separator}\n`);

  const logFd = openSync(logFile, "a");
  const binPath = join(PKG_ROOT, "bin", "agent-hands.js");
  const monitorArgs = ["run", binPath, "_monitor", "--port", String(port), "--host", host, "--data-dir", dataDir];

  const child = spawn("bun", monitorArgs, {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
      DATA_DIR: dataDir,
    },
    cwd: dataDir,
  });

  closeSync(logFd);

  // Wait for server to be ready (health check) or fail fast if process exits
  writePid(child.pid);
  child.unref();

  const startDeadline = Date.now() + 15000; // 15s max wait
  let started = false;
  while (Date.now() < startDeadline) {
    // Fail fast: process already exited
    if (child.exitCode !== null) {
      removePid();
      console.error("❌ Agent Hands failed to start. Check logs:");
      console.error(`   ${logFile}`);
      process.exit(1);
    }
    // Health check — always use 127.0.0.1 (host may be 0.0.0.0 which some systems can't connect to)
    try {
      const healthHost = (host === "0.0.0.0" || host === "::") ? "127.0.0.1" : host;
      const res = await fetch(`http://${healthHost}:${port}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) { started = true; break; }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!started) {
    // Process is alive but not responding — could be slow startup
    if (child.exitCode === null) {
      console.log("\n⚠️  Server process started but health check timed out (15s).");
      console.log(`   PID      : ${child.pid}`);
      console.log(`   URL      : http://${host}:${port}`);
      console.log(`   It may still be initializing. Check: ${logFile}`);
    } else {
      removePid();
      console.error("❌ Agent Hands failed to start. Check logs:");
      console.error(`   ${logFile}`);
      process.exit(1);
    }
  } else {
    console.log("\n🤖 Agent Hands started!");
    console.log(`   PID      : ${child.pid}`);
    console.log(`   URL      : http://${host}:${port}`);
    console.log(`   Data dir : ${dataDir}`);
    console.log(`   Logs     : ${logFile}`);
  }
  console.log(`\n   Use 'agent-hands stop' to stop.\n`);
}

function cmdStop() {
  const pid = readPid();
  if (!pid) {
    // Even without PID file, check for orphaned processes on the configured port
    const orphans = findPidsOnPort(port);
    if (orphans.length > 0) {
      console.log(`⚠️  No PID file, but found orphaned process(es) on port ${port}: ${orphans.join(", ")}`);
      console.log(`   Killing orphans...`);
      for (const opid of orphans) {
        try { process.kill(opid, "SIGTERM"); } catch {}
      }
      Bun.sleepSync(1000);
      for (const opid of orphans) {
        if (isProcessAlive(opid)) {
          try { process.kill(opid, "SIGKILL"); } catch {}
        }
      }
      console.log("✅ Orphaned processes cleaned up.\n");
    } else {
      console.log("ℹ️  Agent Hands is not running.");
    }
    return;
  }

  console.log(`🛑 Stopping Agent Hands (PID: ${pid})...`);

  // Kill the entire process group (monitor + server child) to prevent orphans
  killProcessGroup(pid, "SIGTERM");

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && isProcessAlive(pid)) {
    Bun.sleepSync(200);
  }

  if (isProcessAlive(pid)) {
    console.log("   Force killing process group...");
    killProcessGroup(pid, "SIGKILL");
    Bun.sleepSync(300);
  }

  // Final safety net: kill anything still on the port
  const remaining = findPidsOnPort(port);
  for (const rpid of remaining) {
    try { process.kill(rpid, "SIGKILL"); } catch {}
  }

  removePid();
  console.log("✅ Agent Hands stopped.\n");
}

function cmdStatus() {
  const pid = readPid();
  if (pid) {
    console.log("\n🟢 Agent Hands is running");
    console.log(`   PID      : ${pid}`);
    console.log(`   URL      : http://${host}:${port}`);
    console.log(`   Data dir : ${dataDir}`);
    console.log(`   Logs     : ${logFile}`);
  } else {
    // Check for orphan processes
    const orphans = findPidsOnPort(port);
    if (orphans.length > 0) {
      console.log(`\n🟡 Agent Hands PID file missing, but port ${port} is in use (PIDs: ${orphans.join(", ")})`);
      console.log(`   This may be an orphaned process. Run 'agent-hands stop' to clean up.`);
    } else {
      console.log("\n🔴 Agent Hands is not running.");
    }
  }
  console.log("");
}

async function cmdRestart() {
  // Always call stop — it handles both PID-tracked and orphaned processes
  cmdStop();
  await new Promise((r) => setTimeout(r, 500));
  await cmdStart();
}

async function cmdLogs() {
  if (!existsSync(logFile)) {
    console.log("ℹ️  No log file found. Start the server first.");
    return;
  }

  const lines = Number(flags.lines ?? 50);

  if (flags.follow) {
    const tail = spawn("tail", ["-f", "-n", String(lines), logFile], {
      stdio: "inherit",
    });
    process.on("SIGINT", () => {
      tail.kill();
      process.exit(0);
    });
    // Wait for tail to exit (e.g. when killed by SIGINT above)
    await new Promise((resolve) => tail.on("close", resolve));
    return;
  }

  const content = readFileSync(logFile, "utf-8");
  const allLines = content.split("\n");
  const lastLines = allLines.slice(-lines).join("\n");
  console.log(lastLines);
}

function cmdVersion() {
  const v = getLocalVersion();
  console.log(`agent-hands v${v ?? "unknown"}`);
}

async function cmdInit() {
  if (!existsSync(serverEntry)) {
    console.error("❌ Server not built. Run 'bun run build:server' first.");
    process.exit(1);
  }
  process.env.DATA_DIR = dataDir;
  const { initSuperAdmin } = await import(serverEntry);
  await initSuperAdmin();
}

async function cmdMcp() {
  if (!existsSync(serverEntry)) {
    console.error("❌ Server not built. Run 'bun run build:server' first.");
    process.exit(1);
  }
  process.env.DATA_DIR = dataDir;
  const { startMcpServer } = await import(serverEntry);
  await startMcpServer();
}

async function cmdUninstall() {
  // 1. Stop server if running (also cleans orphans)
  cmdStop();

  // 2. Detect paths
  const installDir = PKG_ROOT;

  // Also try to find symlink by scanning common locations
  const possibleBinDirs = [join(os.homedir(), ".local/bin"), join(os.homedir(), "bin"), "/usr/local/bin"];
  const foundLinks = possibleBinDirs
    .map((dir) => join(dir, "agent-hands"))
    .filter((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });

  console.log("\n🗑️  Agent Hands — Uninstall\n");
  console.log(`   Install dir : ${installDir}`);
  console.log(`   Data dir    : ${dataDir}`);
  if (foundLinks.length > 0) {
    console.log(`   Symlink(s)  : ${foundLinks.join(", ")}`);
  }
  console.log("");

  // 3. Confirm
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  const answer = await ask("⚠️  This will remove Agent Hands and all data. Continue? [y/N] ");
  rl.close();

  if (answer.trim().toLowerCase() !== "y") {
    console.log("\n❌ Uninstall cancelled.\n");
    process.exit(0);
  }

  // 4. Remove symlink(s)
  for (const link of foundLinks) {
    try {
      const stat = lstatSync(link);
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(link);
        // Only remove if it points to our install
        if (target.startsWith(installDir)) {
          try {
            unlinkSync(link);
            console.log(`   ✅ Removed symlink: ${link}`);
          } catch {
            try {
              execSync(`sudo rm -f "${link}"`, { stdio: "inherit" });
              console.log(`   ✅ Removed symlink: ${link} (sudo)`);
            } catch {
              console.log(`   ⚠️  Could not remove symlink: ${link} (remove manually)`);
            }
          }
        }
      }
    } catch {}
  }

  // 5. Remove install directory
  try {
    rmSync(installDir, { recursive: true, force: true });
    console.log(`   ✅ Removed install dir: ${installDir}`);
  } catch {
    console.log(`   ⚠️  Could not remove install dir: ${installDir}`);
    console.log(`       Remove manually: rm -rf "${installDir}"`);
  }

  // 6. Remove data directory (includes config, PID, logs)
  try {
    rmSync(dataDir, { recursive: true, force: true });
    console.log(`   ✅ Removed data dir: ${dataDir}`);
  } catch {
    console.log(`   ⚠️  Could not remove data dir: ${dataDir}`);
    console.log(`       Remove manually: rm -rf "${dataDir}"`);
  }

  console.log("\n✅ Agent Hands has been uninstalled.\n");
}

function cmdHelp() {
  console.log(`
🤖 Agent Hands — LLM-First Knowledge Base

USAGE:
  agent-hands <command> [options]

COMMANDS:
  start        Start the server (daemon mode by default)
  stop         Stop the running server
  restart      Restart the server
  status       Show server status
  logs         View server logs
  version      Show version
  init         Create super admin (first run)
  mcp          Start MCP server in stdio mode
  uninstall    Remove Agent Hands and all data
  help         Show this help

OPTIONS (start / restart):
  --port <number>        Server port (default: ${DEFAULT_PORT})
  --host <string>        Server host (default: ${DEFAULT_HOST})
  --data-dir <path>      Data directory (default: ${DEFAULT_DATA_DIR})
  -f, --foreground       Run in foreground

OPTIONS (logs):
  --lines <number>       Number of lines (default: 50)
  --follow               Tail log continuously

EXAMPLES:
  agent-hands init
  agent-hands start
  agent-hands start --port 8080 --host 0.0.0.0
  agent-hands start --foreground
  agent-hands stop
  agent-hands mcp
  agent-hands uninstall
  agent-hands logs --follow
`);
}

// ─── Monitor ───────────────────────────────────────────────────────────────────
const MAX_RAPID_CRASHES = 5;
const RAPID_CRASH_WINDOW_MS = 60_000;
const RESTART_DELAY_MS = 3000;

async function cmdMonitor() {
  const crashTimes = [];
  let stopping = false;
  let activeChild = null;

  const handleStop = () => {
    stopping = true;
    if (activeChild) activeChild.kill("SIGTERM");
  };
  process.on("SIGTERM", handleStop);
  process.on("SIGINT", handleStop);

  while (!stopping) {
    const serverChild = Bun.spawn(["bun", "run", serverEntry], {
      env: { ...process.env, PORT: String(port), HOST: host, DATA_DIR: dataDir },
      cwd: PKG_ROOT,
      stdout: "inherit",
      stderr: "inherit",
    });
    activeChild = serverChild;

    // If SIGTERM arrived during spawn, kill the child we just created
    if (stopping) {
      serverChild.kill("SIGTERM");
      break;
    }

    const exitCode = await serverChild.exited;
    activeChild = null;
    if (stopping) break;
    if (exitCode === 0) break;

    const now = Date.now();
    crashTimes.push(now);
    while (crashTimes.length > 0 && crashTimes[0] < now - RAPID_CRASH_WINDOW_MS) {
      crashTimes.shift();
    }

    if (crashTimes.length >= MAX_RAPID_CRASHES) {
      console.error(`[Monitor] ${MAX_RAPID_CRASHES} crashes in ${RAPID_CRASH_WINDOW_MS / 1000}s — giving up.`);
      removePid();
      process.exit(1);
    }

    console.log(`[Monitor] Crashed (exit: ${exitCode}). Restarting in ${RESTART_DELAY_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, RESTART_DELAY_MS));
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────────
switch (command) {
  case "start":
    await cmdStart();
    break;
  case "stop":
    cmdStop();
    break;
  case "status":
    cmdStatus();
    break;
  case "restart":
    await cmdRestart();
    break;
  case "logs":
    await cmdLogs();
    break;
  case "version":
    cmdVersion();
    break;
  case "init":
    await cmdInit();
    break;
  case "mcp":
    await cmdMcp();
    break;
  case "uninstall":
    await cmdUninstall();
    break;
  case "_monitor":
    await cmdMonitor();
    break;
  default:
    cmdHelp();
}
