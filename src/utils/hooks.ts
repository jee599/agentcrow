import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK_SCRIPT_NAME = 'agentcrow-inject.sh';

function getHookScriptSource(): string {
  // Strategy 1: relative to this file (dist/utils/hooks.js → ../../scripts/)
  const __filename = fileURLToPath(import.meta.url);
  const pkgRoot = path.resolve(path.dirname(__filename), '..', '..');
  const relativePath = path.join(pkgRoot, 'scripts', HOOK_SCRIPT_NAME);
  if (fs.existsSync(relativePath)) return relativePath;

  // Strategy 2: find via which agentcrow → resolve symlink → package root
  try {
    const { execSync } = require('node:child_process');
    const binPath = execSync('which agentcrow', { stdio: 'pipe' }).toString().trim();
    const realBin = fs.realpathSync(binPath);
    // bin is at <pkg>/dist/cli.js, so go up 2 levels
    const globalPkgRoot = path.resolve(path.dirname(realBin), '..');
    const globalPath = path.join(globalPkgRoot, 'scripts', HOOK_SCRIPT_NAME);
    if (fs.existsSync(globalPath)) return globalPath;
  } catch {
    // which not available or agentcrow not in PATH
  }

  return relativePath; // fallback (may not exist, triggers inline script)
}

function getHookScriptDest(): string {
  return path.join(os.homedir(), '.claude', 'hooks', HOOK_SCRIPT_NAME);
}

export function installHook(cwd: string, global: boolean = false): void {
  const settingsDir = global ? path.join(os.homedir(), '.claude') : path.join(cwd, '.claude');
  const settingsFile = path.join(settingsDir, global ? 'settings.json' : 'settings.local.json');

  fs.mkdirSync(settingsDir, { recursive: true });

  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    } catch {
      settings = {};
    }
  }

  if (!settings.hooks) settings.hooks = {};
  const hooksObj = settings.hooks as Record<string, unknown[]>;

  // --- SessionStart hook (dispatch rules injection) ---
  if (!hooksObj.SessionStart) hooksObj.SessionStart = [];

  const hasSessionHook = hooksObj.SessionStart.some((entry: unknown) => {
    const e = entry as Record<string, unknown>;
    if (Array.isArray(e.hooks)) return (e.hooks as Array<Record<string, unknown>>).some((h) => String(h.command ?? '').includes('AgentCrow'));
    if (e.command) return String(e.command).includes('AgentCrow');
    return false;
  });

  if (!hasSessionHook) {
    const hookScript = `printf '\\033[95m🐦 AgentCrow active\\033[0m \\033[90m— auto-dispatch + persona injection enabled\\033[0m\\n' >&2 && echo '<AGENTCROW_DISPATCH_RULES>
CRITICAL INSTRUCTION — AgentCrow is active.
When the user gives a complex request (2+ tasks like "build X with Y and Z"), you MUST:
1. Look in .claude/agents/INDEX.md to find matching agents
2. Show dispatch plan using the format in CLAUDE.md (with ━━━ borders and role emojis)
3. Use the Agent tool to dispatch each agent. Set the agent name to match the role (e.g. name: "qa_engineer"). AgentCrow will auto-inject the persona.
4. Do NOT do the work yourself. Delegate to agents.
5. After all agents complete, show: ━━━ 🐦 AgentCrow complete ━━━━━━━━━━━━━
Simple single-task requests: handle directly, no agents.
</AGENTCROW_DISPATCH_RULES>'`;

    hooksObj.SessionStart.push({
      matcher: '',
      hooks: [{
        type: 'command',
        command: hookScript,
      }],
    });
  }

  // --- PreToolUse hook (persona injection) ---
  if (!hooksObj.PreToolUse) hooksObj.PreToolUse = [];

  const hasInjectHook = hooksObj.PreToolUse.some((entry: unknown) => {
    const e = entry as Record<string, unknown>;
    if (Array.isArray(e.hooks)) return (e.hooks as Array<Record<string, unknown>>).some((h) => String(h.command ?? '').includes('agentcrow'));
    if (e.command) return String(e.command).includes('agentcrow');
    return false;
  });

  if (!hasInjectHook) {
    // Deploy hook script
    const scriptDest = getHookScriptDest();
    fs.mkdirSync(path.dirname(scriptDest), { recursive: true });

    const scriptSrc = getHookScriptSource();
    if (fs.existsSync(scriptSrc)) {
      fs.copyFileSync(scriptSrc, scriptDest);
      fs.chmodSync(scriptDest, '755');
    } else {
      // Fallback: write inline script
      const inlineScript = `#!/bin/bash
INPUT=$(cat)
if command -v jq &>/dev/null; then
  TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
else
  if ! echo "$INPUT" | grep -q '"tool_name"[[:space:]]*:[[:space:]]*"Agent"'; then exit 0; fi
  TOOL="Agent"
fi
[ "$TOOL" != "Agent" ] && exit 0
echo "$INPUT" | agentcrow inject 2>/dev/null`;
      fs.writeFileSync(scriptDest, inlineScript, { mode: 0o755 });
    }

    hooksObj.PreToolUse.push({
      matcher: 'Agent',
      hooks: [{
        type: 'command',
        command: scriptDest,
      }],
    });
  }

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

export function removeHook(cwd: string, global: boolean = false): void {
  const settingsDir = global ? path.join(os.homedir(), '.claude') : path.join(cwd, '.claude');
  const settingsFile = path.join(settingsDir, global ? 'settings.json' : 'settings.local.json');

  if (!fs.existsSync(settingsFile)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));

    // Remove SessionStart hooks
    if (settings.hooks?.SessionStart) {
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter((entry: Record<string, unknown>) => {
        if (Array.isArray(entry.hooks)) return !(entry.hooks as Array<Record<string, unknown>>).some((h) => String(h.command ?? '').includes('AgentCrow'));
        if (entry.command) return !String(entry.command).includes('AgentCrow');
        return true;
      });
      if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
    }

    // Remove PreToolUse hooks
    if (settings.hooks?.PreToolUse) {
      settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter((entry: Record<string, unknown>) => {
        if (Array.isArray(entry.hooks)) return !(entry.hooks as Array<Record<string, unknown>>).some((h) => String(h.command ?? '').includes('agentcrow'));
        if (entry.command) return !String(entry.command).includes('agentcrow');
        return true;
      });
      if (settings.hooks.PreToolUse.length === 0) delete settings.hooks.PreToolUse;
    }

    if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {
    // settings file is malformed, skip
  }

  // Remove hook script
  const scriptDest = getHookScriptDest();
  if (fs.existsSync(scriptDest)) {
    try { fs.unlinkSync(scriptDest); } catch { /* ignore */ }
  }
}
