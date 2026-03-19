#!/usr/bin/env node

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { AgentCatalog } from './core/catalog.js';
import { AgentManager } from './core/agent-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Package root (dist/ -> .)
const PKG_ROOT = path.resolve(__dirname, '..');
const BUILTIN_DIR = path.join(PKG_ROOT, 'agents', 'builtin');
const EXTERNAL_DIR = path.join(PKG_ROOT, 'agents', 'external', 'agency-agents');
const AGENTCROW_START = '<!-- AgentCrow Start -->';
const AGENTCROW_END = '<!-- AgentCrow End -->';

function getTemplatePath(lang: string): string {
  return path.join(PKG_ROOT, 'templates', `CLAUDE.md.${lang}.template`);
}

function printUsage(): void {
  console.log(`
\x1b[35m🐦 agentcrow\x1b[0m — Auto Agent Router for Claude Code

\x1b[1mUsage:\x1b[0m
  agentcrow init [--lang ko]         Set up agents in current project (default: English)
  agentcrow on                       Enable AgentCrow (restore CLAUDE.md)
  agentcrow off                      Disable AgentCrow (backup & remove CLAUDE.md)
  agentcrow status                   Check if AgentCrow is active
  agentcrow agents                   List all available agents
  agentcrow agents search <query>    Search agents by keyword
  agentcrow compose <prompt>         Decompose a prompt (dry run)

\x1b[1mExamples:\x1b[0m
  agentcrow init
  agentcrow init --lang ko           # Korean template
  agentcrow off                      # Disable temporarily
  agentcrow on                       # Re-enable
  agentcrow compose "Build a todo app"
`);
}

// ─── Global agent storage ───
const GLOBAL_DIR = path.join(os.homedir(), '.agentcrow', 'agents');
const GLOBAL_BUILTIN = path.join(GLOBAL_DIR, 'builtin');
const GLOBAL_EXTERNAL = path.join(GLOBAL_DIR, 'external', 'agency-agents');

async function ensureGlobalAgents(): Promise<{ builtinDir: string; externalDir: string; agentCount: number }> {
  // 1. Copy builtin agents (from npm package → global)
  fs.mkdirSync(GLOBAL_BUILTIN, { recursive: true });
  if (fs.existsSync(BUILTIN_DIR)) {
    const files = fs.readdirSync(BUILTIN_DIR).filter((f) => f.endsWith('.yaml'));
    let copied = 0;
    for (const file of files) {
      const dest = path.join(GLOBAL_BUILTIN, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(BUILTIN_DIR, file), dest);
        copied++;
      }
    }
    if (copied > 0) console.log(`  Installed ${copied} builtin agents → ~/.agentcrow/`);
    else console.log(`  Builtin agents ready (${files.length})`);
  }

  // 2. Download external agents (once)
  if (!fs.existsSync(GLOBAL_EXTERNAL)) {
    fs.mkdirSync(path.join(GLOBAL_DIR, 'external'), { recursive: true });
    console.log('  Downloading external agents (agency-agents)...');
    try {
      const git = spawn('git', ['clone', '--depth', '1', 'https://github.com/msitarzewski/agency-agents.git', GLOBAL_EXTERNAL], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      await new Promise<void>((resolve, reject) => {
        git.on('close', (code) => code === 0 ? resolve() : reject(new Error(`git clone failed: ${code}`)));
        git.on('error', reject);
      });
      const gitDir = path.join(GLOBAL_EXTERNAL, '.git');
      if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true });
      console.log('  ✓ Downloaded external agents → ~/.agentcrow/');
    } catch {
      console.log('  ⚠ Failed to download external agents (git required). Builtin only.');
    }
  } else {
    console.log('  External agents ready');
  }

  // 3. Count
  const catalog = new AgentCatalog(GLOBAL_BUILTIN, GLOBAL_EXTERNAL);
  await catalog.build();
  return { builtinDir: GLOBAL_BUILTIN, externalDir: GLOBAL_EXTERNAL, agentCount: catalog.listAll().length };
}

// ─── agentcrow init ───
async function cmdInit(lang: string = 'en'): Promise<void> {
  const cwd = process.cwd();

  // 1. Ensure global agent storage
  const { builtinDir, externalDir, agentCount } = await ensureGlobalAgents();

  // 2. Build catalog for template
  const catalog = new AgentCatalog(builtinDir, externalDir);
  await catalog.build();

  // 3. Generate CLAUDE.md from template
  const claudeDir = path.join(cwd, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');

  const templatePath = getTemplatePath(lang);
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace('{{count}}', String(agentCount));

  const grouped = catalog.listByDivision();
  const builtinList = (grouped['builtin'] ?? [])
    .map((e) => `- **${e.role}**: ${e.name}. ${e.description}`)
    .join('\n');
  template = template.replace('{{builtin_agents}}', builtinList || '(none)');

  const countSuffix = lang === 'ko' ? '개' : '';
  const externalDivisions = Object.entries(grouped)
    .filter(([div]) => div !== 'builtin')
    .map(([div, entries]) => `- **${div}**: ${entries.map((e) => e.role).join(', ')} (${entries.length}${countSuffix})`)
    .join('\n');
  template = template.replace('{{external_agents}}', externalDivisions || '(none)');

  // 4. Merge with existing CLAUDE.md
  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    const startIdx = existing.indexOf(AGENTCROW_START);
    const endIdx = existing.indexOf(AGENTCROW_END);

    if (startIdx !== -1 && endIdx !== -1) {
      const before = existing.slice(0, startIdx);
      const after = existing.slice(endIdx + AGENTCROW_END.length);
      fs.writeFileSync(claudeMdPath, before + template + after, 'utf-8');
      console.log(`  Updated AgentCrow section in CLAUDE.md (${agentCount} agents)`);
    } else if (existing.includes('AgentCrow')) {
      fs.writeFileSync(claudeMdPath, template, 'utf-8');
      console.log(`  Replaced CLAUDE.md (${agentCount} agents)`);
    } else {
      fs.writeFileSync(claudeMdPath, existing + '\n\n---\n\n' + template, 'utf-8');
      console.log(`  Merged AgentCrow into existing CLAUDE.md (${agentCount} agents)`);
    }
  } else {
    fs.writeFileSync(claudeMdPath, template, 'utf-8');
    console.log(`  Generated CLAUDE.md (${agentCount} agents)`);
  }

  // 5. Install hook
  installHook(cwd);
  console.log('  Installed SessionStart hook');

  console.log();
  console.log('\x1b[32m✓ AgentCrow initialized.\x1b[0m Run `claude` and it will auto-dispatch agents.');
  console.log('\x1b[90m  Agents stored globally at ~/.agentcrow/ (shared across projects)\x1b[0m');
  console.log('\x1b[90m  agentcrow off / on / status\x1b[0m');
}

// ─── agentcrow agents ───
async function cmdAgents(): Promise<void> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  const divisions = manager.listAgents();
  let totalCount = 0;

  for (const { division, agents } of divisions) {
    console.log(`\n\x1b[1m[${division}]\x1b[0m (${agents.length})`);
    for (const agent of agents) {
      const sourceTag = agent.source === 'builtin' ? '\x1b[33mbuiltin\x1b[0m' : '\x1b[36mexternal\x1b[0m';
      console.log(`  ${sourceTag} \x1b[1m${agent.role}\x1b[0m — ${agent.name}`);
      if (agent.description) {
        console.log(`         ${agent.description.slice(0, 80)}`);
      }
    }
    totalCount += agents.length;
  }

  console.log(`\n\x1b[90mTotal: ${totalCount} agents\x1b[0m`);
}

// ─── agentcrow agents search ───
async function cmdAgentsSearch(query: string): Promise<void> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const catalog = new AgentCatalog(bDir, eDir);
  await catalog.build();

  const queryTags = query.split(/[\s,]+/).filter((t) => t.length > 0);
  const results = catalog.searchByTags(queryTags, 20);

  if (results.length === 0) {
    console.log(`No agents found for "${query}"`);
    return;
  }

  console.log(`\n\x1b[1mSearch results for "${query}":\x1b[0m\n`);
  for (const { entry, score } of results) {
    const sourceTag = entry.source.type === 'builtin' ? '\x1b[33mbuiltin\x1b[0m' : '\x1b[36mexternal\x1b[0m';
    console.log(`  ${sourceTag} \x1b[1m${entry.role}\x1b[0m (score: ${score.toFixed(1)}) — ${entry.name}`);
    if (entry.description) {
      console.log(`         ${entry.description.slice(0, 80)}`);
    }
  }

  console.log(`\n\x1b[90m${results.length} results\x1b[0m`);
}

// ─── agentcrow compose ───
async function cmdCompose(prompt: string): Promise<void> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  console.log('\x1b[35mDecomposing prompt...\x1b[0m\n');

  const tasks = await decompose(prompt);

  console.log(`\x1b[1mDecomposed into ${tasks.length} tasks:\x1b[0m\n`);

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const matchResult = await manager.matchAgent({
      id: `task_${i + 1}`,
      role: t.role,
      action: t.action,
      depends_on: [],
    });

    const matchIcon =
      matchResult.matchType === 'exact'
        ? '\x1b[32m✓ exact\x1b[0m'
        : matchResult.matchType === 'fuzzy'
          ? '\x1b[33m~ fuzzy\x1b[0m'
          : '\x1b[31m✗ none\x1b[0m';

    const agentName = matchResult.agent?.name ?? t.role;
    console.log(`  ${i + 1}. \x1b[1m${agentName}\x1b[0m \x1b[90m(${t.role})\x1b[0m [${matchIcon}]`);
    console.log(`     ${t.action}`);

    if (matchResult.candidates && matchResult.candidates.length > 1) {
      console.log(`     \x1b[90mCandidates: ${matchResult.candidates.map((c) => `${c.name}(${c.score})`).join(', ')}\x1b[0m`);
    }
  }

  console.log(`\n\x1b[90mDry run — no agents were dispatched.\x1b[0m`);
}

// ─── Decompose via claude -p ───
async function decompose(prompt: string): Promise<Array<{ role: string; action: string }>> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const catalog = new AgentCatalog(bDir, eDir);
  await catalog.build();
  const allRoles = catalog.listAll().map((e) => e.role);

  const sysPrompt = `You are a task decomposer. Given a user prompt, break it into tasks with agent roles.
Available roles: ${allRoles.join(', ')}
Output ONLY a JSON array: [{"role":"role_name","action":"specific task"}]
2-6 tasks. No explanation.`;

  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    const proc = spawn('claude', ['-p'], {
      env: env as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(`${sysPrompt}\n\nUser prompt: "${prompt}"\n\nJSON array:`);
    proc.stdin.end();

    let out = '';
    proc.stdout.on('data', (d: Buffer) => {
      out += d.toString();
    });

    proc.on('close', (code) => {
      try {
        const match = out.match(/\[[\s\S]*\]/);
        if (match) {
          resolve(JSON.parse(match[0]));
        } else {
          console.error('Failed to decompose. Make sure `claude` CLI is installed and authenticated.');
          process.exit(1);
        }
      } catch {
        console.error('Failed to decompose. Make sure `claude` CLI is installed and authenticated.');
        process.exit(1);
      }
    });

    proc.on('error', () => {
      console.error('Failed to decompose. Make sure `claude` CLI is installed and authenticated.');
      process.exit(1);
    });
  });
}

// ─── agentcrow off ───
function cmdOff(): void {
  const cwd = process.cwd();
  const claudeMd = path.join(cwd, '.claude', 'CLAUDE.md');
  const backupMd = path.join(cwd, '.claude', 'CLAUDE.md.agentcrow-backup');

  if (!fs.existsSync(claudeMd)) {
    console.log('\x1b[33m⚠ AgentCrow is already off (no .claude/CLAUDE.md found)\x1b[0m');
    return;
  }

  // Check if it's an AgentCrow-generated file
  const content = fs.readFileSync(claudeMd, 'utf-8');
  if (!content.includes('AgentCrow') && !content.includes('agentcrow')) {
    console.log('\x1b[33m⚠ .claude/CLAUDE.md exists but was not generated by AgentCrow. Skipping.\x1b[0m');
    return;
  }

  fs.renameSync(claudeMd, backupMd);
  removeHook(cwd);
  console.log('\x1b[35m🐦 AgentCrow disabled.\x1b[0m CLAUDE.md backed up. Run `agentcrow on` to re-enable.');
}

// ─── agentcrow on ───
function cmdOn(): void {
  const cwd = process.cwd();
  const claudeMd = path.join(cwd, '.claude', 'CLAUDE.md');
  const backupMd = path.join(cwd, '.claude', 'CLAUDE.md.agentcrow-backup');

  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    if (content.includes('AgentCrow') || content.includes('agentcrow')) {
      console.log('\x1b[32m✓ AgentCrow is already on.\x1b[0m');
      installHook(cwd);
      return;
    }
  }

  if (fs.existsSync(backupMd)) {
    fs.renameSync(backupMd, claudeMd);
    installHook(cwd);
    console.log('\x1b[32m✓ AgentCrow re-enabled.\x1b[0m Restored from backup.');
  } else {
    console.log('\x1b[33m⚠ No backup found. Run `agentcrow init` first.\x1b[0m');
  }
}

// ─── agentcrow status ───
function cmdStatus(): void {
  const cwd = process.cwd();
  const claudeMd = path.join(cwd, '.claude', 'CLAUDE.md');
  const agrDir = GLOBAL_DIR;

  const hasClaude = fs.existsSync(claudeMd);
  const hasAgr = fs.existsSync(agrDir);

  if (hasClaude && hasAgr) {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    const isAgentCrow = content.includes('AgentCrow') || content.includes('agentcrow');

    if (isAgentCrow) {
      // Count agents
      let count = 0;
      const builtinDir = path.join(agrDir, 'builtin');
      if (fs.existsSync(builtinDir)) {
        count = fs.readdirSync(builtinDir).filter(f => f.endsWith('.yaml')).length;
      }
      console.log(`\x1b[32m🐦 AgentCrow is ON\x1b[0m — ${count} builtin agents loaded`);
      console.log(`   CLAUDE.md: ${claudeMd}`);
      console.log(`   Agents:    ${agrDir}`);
    } else {
      console.log('\x1b[33m⚠ .claude/CLAUDE.md exists but is not AgentCrow.\x1b[0m');
    }
  } else if (hasAgr) {
    console.log('\x1b[33m🐦 AgentCrow is OFF\x1b[0m — agents installed but CLAUDE.md missing. Run `agentcrow on`.');
  } else {
    console.log('\x1b[90m🐦 AgentCrow is not installed.\x1b[0m Run `agentcrow init`.');
  }
}

// ─── Hook management ───
function installHook(cwd: string): void {
  const settingsDir = path.join(cwd, '.claude');
  const settingsFile = path.join(settingsDir, 'settings.local.json');

  fs.mkdirSync(settingsDir, { recursive: true });

  let settings: any = {};
  if (fs.existsSync(settingsFile)) {
    try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8')); } catch { settings = {}; }
  }

  if (!settings.hooks) settings.hooks = {};

  settings.hooks.SessionStart = [{
    type: 'command',
    command: "echo '🐦 AgentCrow active'",
  }];

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

function removeHook(cwd: string): void {
  const settingsFile = path.join(cwd, '.claude', 'settings.local.json');

  if (!fs.existsSync(settingsFile)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    if (settings.hooks?.SessionStart) {
      delete settings.hooks.SessionStart;
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
    }
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
  } catch {}
}

// ─── Main ───
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init': {
      const langIdx = args.indexOf('--lang');
      const lang = langIdx !== -1 && args[langIdx + 1] ? args[langIdx + 1] : 'en';
      await cmdInit(lang);
      break;
    }

    case 'on':
      cmdOn();
      break;

    case 'off':
      cmdOff();
      break;

    case 'status':
      cmdStatus();
      break;

    case 'agents':
      if (args[1] === 'search' && args[2]) {
        await cmdAgentsSearch(args.slice(2).join(' '));
      } else {
        await cmdAgents();
      }
      break;

    case 'compose':
      if (!args[1]) {
        console.error('Usage: agentcrow compose <prompt>');
        process.exit(1);
      }
      await cmdCompose(args.slice(1).join(' '));
      break;

    default:
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
