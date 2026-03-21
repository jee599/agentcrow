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

// ─── ANSI colors ───
const c = {
  purple: (s: string) => `\x1b[35m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  bgPurple: (s: string) => `\x1b[45m\x1b[37m${s}\x1b[0m`,
};

const VERSION = '3.3.1';

// ─── Role emoji map ───
const ROLE_EMOJI: Record<string, string> = {
  frontend: '🖥️', ui: '🖥️',
  backend: '🏗️', api: '🏗️', architect: '🏗️',
  qa: '🧪', test: '🧪',
  security: '🛡️', auditor: '🛡️',
  writer: '📝', docs: '📝', translator: '📝',
  data: '🔄', pipeline: '🔄',
  design: '🎨', ux: '🎨',
  devops: '⚙️', sre: '⚙️',
  game: '🎮', level: '🎮', unity: '🎮', unreal: '🎮', godot: '🎮',
  ai: '🤖', ml: '🤖',
  marketing: '📢', seo: '📢', content: '📢',
  product: '📊', analyst: '📊',
  mobile: '📱',
  refactoring: '♻️',
  complexity: '🔍',
};

function getRoleEmoji(role: string): string {
  for (const [key, emoji] of Object.entries(ROLE_EMOJI)) {
    if (role.includes(key)) return emoji;
  }
  return '🐦';
}

function printUsage(): void {
  console.log(`
  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)} — Auto Agent Router for Claude Code

  ${c.bold('Usage:')}
    ${c.cyan('agentcrow init')} ${c.dim('[--lang ko] [--max 5]')}  Set up agents
    ${c.cyan('agentcrow on')}                          Re-enable
    ${c.cyan('agentcrow off')}                         Disable temporarily
    ${c.cyan('agentcrow status')}                      Check status
    ${c.cyan('agentcrow agents')}                      List all agents
    ${c.cyan('agentcrow agents search')} ${c.dim('<query>')}      Search by keyword
    ${c.cyan('agentcrow compose')} ${c.dim('<prompt>')}           Preview decomposition

  ${c.bold('Examples:')}
    ${c.dim('$')} agentcrow init
    ${c.dim('$')} agentcrow compose "Build a todo app with auth and tests"
`);
}

// ─── Global agent storage ───
const GLOBAL_DIR = path.join(os.homedir(), '.agentcrow', 'agents');
const GLOBAL_BUILTIN = path.join(GLOBAL_DIR, 'builtin');
const GLOBAL_EXTERNAL = path.join(GLOBAL_DIR, 'external', 'agency-agents');
const GLOBAL_MD = path.join(GLOBAL_DIR, 'md');

async function ensureGlobalAgents(): Promise<{ builtinDir: string; externalDir: string; agentCount: number }> {
  // 1. Copy builtin agents (from npm package → global)
  fs.mkdirSync(GLOBAL_BUILTIN, { recursive: true });
  if (fs.existsSync(BUILTIN_DIR)) {
    const files = fs.readdirSync(BUILTIN_DIR).filter((f) => f.endsWith('.yaml'));
    let copied = 0;
    for (const file of files) {
      const dest = path.join(GLOBAL_BUILTIN, file);
      const src = path.join(BUILTIN_DIR, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        copied++;
      } else {
        // Update if source file is different (size changed = content changed)
        const srcStat = fs.statSync(src);
        const destStat = fs.statSync(dest);
        if (srcStat.size !== destStat.size) {
          fs.copyFileSync(src, dest);
          copied++;
        }
      }
    }
    if (copied > 0) console.log(`  ${c.green('▸')} Builtin agents ··· ${c.bold(String(copied))} installed ${c.green('✓')}`);
    else console.log(`  ${c.green('▸')} Builtin agents ··· ${c.bold(String(files.length))} ready ${c.green('✓')}`);
  }

  // 2. Download external agents (once)
  if (!fs.existsSync(GLOBAL_EXTERNAL)) {
    fs.mkdirSync(path.join(GLOBAL_DIR, 'external'), { recursive: true });
    console.log(`  ${c.yellow('▸')} External agents ··· downloading`);
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
      console.log(`  ${c.green('▸')} External agents ··· downloaded ${c.green('✓')}`);
    } catch {
      console.log(`  ${c.yellow('▸')} External agents ··· ${c.yellow('skipped')} ${c.dim('(git required)')}`);
    }
  } else {
    console.log(`  ${c.green('▸')} External agents ··· ready ${c.green('✓')}`);
  }

  // 3. Generate .md files globally (skip existing individually)
  fs.mkdirSync(GLOBAL_MD, { recursive: true });
  const catalog = new AgentCatalog(GLOBAL_BUILTIN, GLOBAL_EXTERNAL);
  await catalog.build();
  const allAgents = catalog.listAll();
  let mdGenerated = 0;
  let mdSkipped = 0;
  for (const entry of allAgents) {
    const safeRole = entry.role.replace(/[^a-z0-9_]/g, '_');
    const mdPath = path.join(GLOBAL_MD, `${safeRole}.md`);
    if (fs.existsSync(mdPath)) {
      mdSkipped++;
      continue;
    }

    try {
      if (entry.source.type === 'builtin') {
        const yamlPath = (entry.source as { filePath: string }).filePath;
        if (fs.existsSync(yamlPath)) {
          const yamlMod = await import('yaml');
          const parsed = yamlMod.parse(fs.readFileSync(yamlPath, 'utf-8'));
          const md = [
            `# ${parsed.name}`,
            `> ${parsed.description || ''}`,
            '',
            `**Role:** ${parsed.role}`,
            '',
            parsed.identity?.personality ? `## Identity\n${parsed.identity.personality.trim()}` : '',
            parsed.critical_rules?.must?.length ? `## MUST\n${parsed.critical_rules.must.map((r: string) => `- ${r}`).join('\n')}` : '',
            parsed.critical_rules?.must_not?.length ? `## MUST NOT\n${parsed.critical_rules.must_not.map((r: string) => `- ${r}`).join('\n')}` : '',
          ].filter(Boolean).join('\n\n');
          fs.writeFileSync(mdPath, md, 'utf-8');
          mdGenerated++;
        }
      } else if (entry.source.type === 'external') {
        const srcPath = (entry.source as { filePath: string }).filePath;
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, mdPath);
          mdGenerated++;
        }
      }
    } catch {
      // skip failed agents
    }
  }
  if (mdGenerated > 0) console.log(`  ${c.green('▸')} Agent definitions ··· ${c.bold(String(mdGenerated))} generated ${c.green('✓')}`);
  if (mdSkipped > 0 && mdGenerated === 0) console.log(`  ${c.green('▸')} Agent definitions ··· ${c.bold(String(mdSkipped))} ready ${c.green('✓')}`);

  return { builtinDir: GLOBAL_BUILTIN, externalDir: GLOBAL_EXTERNAL, agentCount: allAgents.length };
}

// ─── agentcrow init ───
async function cmdInit(lang: string = 'en', maxAgents: number = 5): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(`  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)}`);
  console.log();

  // 1. Ensure global agent storage
  const { builtinDir, externalDir, agentCount } = await ensureGlobalAgents();

  // 2. Build catalog
  const catalog = new AgentCatalog(builtinDir, externalDir);
  await catalog.build();

  // 3. Symlink .claude/agents/ → ~/.agentcrow/agents/md/ (no per-project copy)
  const claudeDir = path.join(cwd, '.claude');
  const agentsDir = path.join(claudeDir, 'agents');
  fs.mkdirSync(claudeDir, { recursive: true });

  const allAgents = catalog.listAll();

  // Remove existing agents dir/symlink if present
  try {
    const stat = fs.lstatSync(agentsDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(agentsDir);
    } else if (stat.isDirectory()) {
      // Migrate: old per-project copy exists, remove it
      fs.rmSync(agentsDir, { recursive: true, force: true });
      console.log(`  ${c.dim('▸ Migrated: removed per-project agent copies')}`);
    }
  } catch {
    // agentsDir doesn't exist yet, fine
  }

  try {
    fs.symlinkSync(GLOBAL_MD, agentsDir, 'dir');
    console.log(`  ${c.green('▸')} Agent symlink ··· ${c.bold(String(allAgents.length))} agents linked ${c.green('✓')}`);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      console.log(`  ${c.green('▸')} Agent symlink ··· ${c.bold(String(allAgents.length))} agents linked ${c.green('✓')}`);
    } else {
      console.error(`  ✗ Failed to create symlink: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // 4. Generate slim CLAUDE.md (rules only, no agent list)
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');

  const roleEmojiGuide = `## Role Emoji Reference
Use these emojis when showing the dispatch plan:
- 🖥️ frontend, ui — 🏗️ backend, api, architect — 🧪 qa, test
- 🛡️ security — 📝 writer, docs — 🔄 data, pipeline
- 🎨 design, ux — ⚙️ devops, sre — 🎮 game
- 🤖 ai, ml — 📢 marketing, seo — 📊 product — 📱 mobile
- 🐦 (default for unmatched roles)`;

  const agentCrowSection = `${AGENTCROW_START}
# 🐦 AgentCrow — Auto Agent Dispatch

## Rules
1. For complex requests (2+ tasks), find matching agents from .claude/agents/ and dispatch them using the Agent tool.
2. Dispatch at most **${maxAgents} agents** at a time. If more are needed, pick the top ${maxAgents} by priority.
3. Dispatch independent tasks in parallel, dependent ones sequentially.
4. Do not ask questions. Make decisions and proceed.
5. Before dispatching, show the plan in this exact format:

\`\`\`
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
Dispatching N agents:

{emoji} @agent_role → task description
{emoji} @agent_role → task description
{emoji} @agent_role → task description (depends: 1,2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`

6. Simple requests (bug fixes, single file edits) — handle directly, no agents needed.
7. After all agents complete, show: \`━━━ 🐦 AgentCrow complete ━━━━━━━━━━━━━\`

${roleEmojiGuide}

## Agents: ${allAgents.length} available in .claude/agents/
${AGENTCROW_END}`;

  // 5. Merge
  try {
    if (fs.existsSync(claudeMdPath)) {
      const existing = fs.readFileSync(claudeMdPath, 'utf-8');
      const startIdx = existing.indexOf(AGENTCROW_START);
      const endIdx = existing.indexOf(AGENTCROW_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        // Both markers found in correct order — replace section
        const before = existing.slice(0, startIdx);
        const after = existing.slice(endIdx + AGENTCROW_END.length);
        fs.writeFileSync(claudeMdPath, before + agentCrowSection + after, 'utf-8');
        console.log(`  ${c.green('▸')} Dispatch rules ··· CLAUDE.md updated ${c.green('✓')}`);
      } else {
        // No valid markers — append section (preserve existing content)
        fs.writeFileSync(claudeMdPath, existing + '\n\n---\n\n' + agentCrowSection, 'utf-8');
        console.log(`  ${c.green('▸')} Dispatch rules ··· merged into CLAUDE.md ${c.green('✓')}`);
      }
    } else {
      fs.writeFileSync(claudeMdPath, agentCrowSection, 'utf-8');
      console.log(`  ${c.green('▸')} Dispatch rules ··· CLAUDE.md created ${c.green('✓')}`);
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EACCES') {
      console.error('  ✗ Permission denied writing CLAUDE.md. Try running with sudo or check .claude/ permissions.');
    } else if (code === 'ENOSPC') {
      console.error('  ✗ Disk full. Free some space and try again.');
    } else {
      console.error(`  ✗ Failed to write CLAUDE.md: ${(err as Error).message}`);
    }
    process.exit(1);
  }

  // 6. Install hook
  installHook(cwd);
  console.log(`  ${c.green('▸')} SessionStart hook ··· installed ${c.green('✓')}`);

  console.log();
  console.log(`  ${c.green('✓')} ${c.purple('AgentCrow')} ready — ${c.bold(String(allAgents.length))} agents, max ${c.bold(String(maxAgents))} per dispatch`);
  console.log(`  ${c.dim('agentcrow off / on / status')}`);
  console.log();
}

// ─── agentcrow agents ───
async function cmdAgents(): Promise<void> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  console.log(`\n  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)}\n`);

  const divisions = manager.listAgents();
  let totalCount = 0;

  for (const { division, agents } of divisions) {
    const divColor = division === 'builtin' ? c.yellow : c.cyan;
    console.log(`  ${divColor(`[${division}]`)} ${c.dim(`(${agents.length})`)}`);
    for (const agent of agents) {
      const emoji = getRoleEmoji(agent.role);
      const sourceTag = agent.source === 'builtin' ? c.yellow('builtin') : c.cyan('external');
      console.log(`    ${emoji} ${sourceTag} ${c.bold(agent.role)} ${c.dim('—')} ${agent.name}`);
      if (agent.description) {
        console.log(`       ${c.dim(agent.description.slice(0, 80))}`);
      }
    }
    totalCount += agents.length;
    console.log();
  }

  console.log(`  ${c.dim(`Total: ${totalCount} agents`)}`);
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

  console.log(`\n  ${c.purple('🐦')} Search: ${c.bold(`"${query}"`)}\n`);
  for (const { entry, score } of results) {
    const emoji = getRoleEmoji(entry.role);
    const sourceTag = entry.source.type === 'builtin' ? c.yellow('builtin') : c.cyan('external');
    console.log(`  ${emoji} ${sourceTag} ${c.bold(entry.role)} ${c.dim(`score:${score.toFixed(1)}`)} — ${entry.name}`);
    if (entry.description) {
      console.log(`     ${c.dim(entry.description.slice(0, 80))}`);
    }
  }

  console.log(`\n  ${c.dim(`${results.length} results`)}`);
}

// ─── agentcrow compose ───
async function cmdCompose(prompt: string): Promise<void> {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  console.log(`\n  ${c.purple('🐦')} Decomposing prompt...\n`);

  const tasks = await decompose(prompt);

  console.log(`  ━━━ ${c.purple('🐦 AgentCrow')} ━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Dispatching ${c.bold(String(tasks.length))} agents:\n`);

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
        ? c.green('✓ exact')
        : matchResult.matchType === 'fuzzy'
          ? c.yellow('~ fuzzy')
          : c.red('✗ none');

    const emoji = getRoleEmoji(t.role);
    const agentName = matchResult.agent?.name ?? t.role;
    console.log(`  ${emoji} ${c.bold(agentName)} ${c.dim(`(${t.role})`)} [${matchIcon}]`);
    console.log(`     ${t.action}`);

    if (matchResult.candidates && matchResult.candidates.length > 1) {
      console.log(`     ${c.dim(`Candidates: ${matchResult.candidates.map((cd) => `${cd.name}(${cd.score})`).join(', ')}`)}`);
    }
  }

  console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${c.dim('Dry run — no agents were dispatched.')}`);
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

    proc.on('close', (_code) => {
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
  const agentsDir = path.join(cwd, '.claude', 'agents');

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

  // Remove symlink (global agents stay intact)
  try {
    const stat = fs.lstatSync(agentsDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(agentsDir);
    }
  } catch {
    // agents dir doesn't exist, fine
  }

  removeHook(cwd);
  console.log(`\n  ${c.red('●')} ${c.purple('🐦 AgentCrow')} ${c.yellow('disabled')} — CLAUDE.md backed up. Run ${c.cyan('agentcrow on')} to re-enable.\n`);
}

// ─── agentcrow on ───
function cmdOn(): void {
  const cwd = process.cwd();
  const claudeMd = path.join(cwd, '.claude', 'CLAUDE.md');
  const backupMd = path.join(cwd, '.claude', 'CLAUDE.md.agentcrow-backup');
  const agentsDir = path.join(cwd, '.claude', 'agents');

  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    if (content.includes('AgentCrow') || content.includes('agentcrow')) {
      console.log(`\n  ${c.green('●')} ${c.purple('🐦 AgentCrow')} already ${c.green('ON')}\n`);
      installHook(cwd);
      return;
    }
  }

  if (fs.existsSync(backupMd)) {
    fs.renameSync(backupMd, claudeMd);

    // Recreate symlink to global agents
    if (!fs.existsSync(agentsDir) && fs.existsSync(GLOBAL_MD)) {
      try {
        fs.symlinkSync(GLOBAL_MD, agentsDir, 'dir');
      } catch {
        // symlink failed, non-critical
      }
    }

    installHook(cwd);
    console.log(`\n  ${c.green('●')} ${c.purple('🐦 AgentCrow')} ${c.green('re-enabled')} — restored from backup.\n`);
  } else {
    console.log(`\n  ${c.yellow('⚠')} No backup found. Run ${c.cyan('agentcrow init')} first.\n`);
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
      let builtinCount = 0;
      let externalCount = 0;
      const builtinDir = path.join(agrDir, 'builtin');
      if (fs.existsSync(builtinDir)) {
        builtinCount = fs.readdirSync(builtinDir).filter(f => f.endsWith('.yaml')).length;
      }
      const mdDir = path.join(agrDir, 'md');
      if (fs.existsSync(mdDir)) {
        externalCount = Math.max(0, fs.readdirSync(mdDir).filter(f => f.endsWith('.md')).length - builtinCount);
      }
      const totalCount = builtinCount + externalCount;
      console.log();
      console.log(`  ${c.green('●')} ${c.purple('🐦 AgentCrow')} ${c.green('ON')}`);
      console.log(`    ${c.bold(String(builtinCount))} builtin + ${c.bold(String(externalCount))} external = ${c.bold(String(totalCount))} agents`);
      console.log(`    ${c.dim(`CLAUDE.md: ${claudeMd}`)}`);
      console.log(`    ${c.dim(`Agents:    ${agrDir}`)}`);
      console.log();
    } else {
      console.log(`\n  ${c.yellow('⚠')} .claude/CLAUDE.md exists but is not AgentCrow.\n`);
    }
  } else if (hasAgr) {
    console.log(`\n  ${c.red('●')} ${c.purple('🐦 AgentCrow')} ${c.yellow('OFF')} — agents installed but CLAUDE.md missing. Run ${c.cyan('agentcrow on')}\n`);
  } else {
    console.log(`\n  ${c.dim('●')} ${c.purple('🐦 AgentCrow')} ${c.dim('not installed')} — Run ${c.cyan('agentcrow init')}\n`);
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
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  // New hook format: { matcher: "", hooks: [{ type, command }] }
  const hasOurHook = settings.hooks.SessionStart.some((entry: any) => {
    if (entry.hooks) return entry.hooks.some((h: any) => h.command?.includes('AgentCrow'));
    if (entry.command) return entry.command.includes('AgentCrow');
    return false;
  });
  if (!hasOurHook) {
    const hookScript = `printf '\\033[35m🐦 AgentCrow active\\033[0m \\033[90m— auto-dispatch enabled\\033[0m\\n' && echo '<AGENTCROW_DISPATCH_RULES>
CRITICAL INSTRUCTION — AgentCrow is active.
When the user gives a complex request (2+ tasks like "build X with Y and Z"), you MUST:
1. Look in .claude/agents/ for matching agent .md files
2. Show dispatch plan using the format in CLAUDE.md (with ━━━ borders and role emojis)
3. Use the Agent tool to dispatch each agent with their .md file as the prompt
4. Do NOT do the work yourself. Delegate to agents.
5. After all agents complete, show: ━━━ 🐦 AgentCrow complete ━━━━━━━━━━━━━
Simple single-task requests: handle directly, no agents.
</AGENTCROW_DISPATCH_RULES>'`;

    settings.hooks.SessionStart.push({
      matcher: "",
      hooks: [{
        type: 'command',
        command: hookScript,
      }],
    });
  }

  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

function removeHook(cwd: string): void {
  const settingsFile = path.join(cwd, '.claude', 'settings.local.json');

  if (!fs.existsSync(settingsFile)) return;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    if (settings.hooks?.SessionStart) {
      settings.hooks.SessionStart = settings.hooks.SessionStart.filter((entry: any) => {
        if (entry.hooks) return !entry.hooks.some((h: any) => h.command?.includes('AgentCrow'));
        if (entry.command) return !entry.command.includes('AgentCrow');
        return true;
      });
      if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
      if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;
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
      const maxIdx = args.indexOf('--max');
      const maxRaw = maxIdx !== -1 && args[maxIdx + 1] ? parseInt(args[maxIdx + 1], 10) : 5;
      const maxAgents = Number.isNaN(maxRaw) || maxRaw < 1 ? 5 : maxRaw;
      await cmdInit(lang, maxAgents);
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
      if (args[1] === 'search') {
        if (!args[2]) {
          console.error('Usage: agentcrow agents search <query>');
          process.exit(1);
        }
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
      if (command) {
        console.error(`Unknown command: ${command}\n`);
        process.exitCode = 1;
      }
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
