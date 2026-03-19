#!/usr/bin/env node

import * as fs from 'node:fs';
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
const TEMPLATE_PATH = path.join(PKG_ROOT, 'templates', 'CLAUDE.md.template');

function printUsage(): void {
  console.log(`
\x1b[35m🐦 agentcrow\x1b[0m — Auto Agent Router for Claude Code

\x1b[1mUsage:\x1b[0m
  agentcrow init                     Set up agents in current project
  agentcrow on                       Enable AgentCrow (restore CLAUDE.md)
  agentcrow off                      Disable AgentCrow (backup & remove CLAUDE.md)
  agentcrow status                   Check if AgentCrow is active
  agentcrow agents                   List all available agents
  agentcrow agents search <query>    Search agents by keyword
  agentcrow compose <prompt>         Decompose a prompt (dry run)

\x1b[1mExamples:\x1b[0m
  agentcrow init
  agentcrow off                      # Disable temporarily
  agentcrow on                       # Re-enable
  agentcrow compose "투두앱 만들어줘"
`);
}

// ─── agentcrow init ───
async function cmdInit(): Promise<void> {
  const cwd = process.cwd();
  const agrDir = path.join(cwd, '.agr', 'agents');

  // 1. Copy builtin agents
  const agrBuiltinDir = path.join(agrDir, 'builtin');
  fs.mkdirSync(agrBuiltinDir, { recursive: true });

  if (fs.existsSync(BUILTIN_DIR)) {
    const files = fs.readdirSync(BUILTIN_DIR).filter((f) => f.endsWith('.yaml'));
    for (const file of files) {
      fs.copyFileSync(path.join(BUILTIN_DIR, file), path.join(agrBuiltinDir, file));
    }
    console.log(`  Copied ${files.length} builtin agents`);
  }

  // 2. Copy or symlink external agents
  if (fs.existsSync(EXTERNAL_DIR)) {
    const agrExternalDir = path.join(agrDir, 'external', 'agency-agents');
    fs.mkdirSync(path.join(agrDir, 'external'), { recursive: true });

    if (!fs.existsSync(agrExternalDir)) {
      try {
        fs.symlinkSync(EXTERNAL_DIR, agrExternalDir, 'dir');
        console.log('  Linked external agents (agency-agents)');
      } catch {
        // Fallback: copy recursively
        copyDirRecursive(EXTERNAL_DIR, agrExternalDir);
        console.log('  Copied external agents (agency-agents)');
      }
    } else {
      console.log('  External agents already exist, skipping');
    }
  }

  // 3. Build catalog to count agents
  const catalog = new AgentCatalog(agrBuiltinDir, path.join(agrDir, 'external', 'agency-agents'));
  await catalog.build();
  const agentCount = catalog.listAll().length;

  // 4. Generate .claude/CLAUDE.md from template
  const claudeDir = path.join(cwd, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  template = template.replace('{{count}}', String(agentCount));

  // Fill in agent lists
  const grouped = catalog.listByDivision();
  const builtinList = (grouped['builtin'] ?? [])
    .map((e) => `- **${e.role}**: ${e.name}. ${e.description}`)
    .join('\n');
  template = template.replace('{{builtin_agents}}', builtinList || '(none)');

  const externalDivisions = Object.entries(grouped)
    .filter(([div]) => div !== 'builtin')
    .map(([div, entries]) => `- **${div}**: ${entries.map((e) => e.role).join(', ')} (${entries.length}개)`)
    .join('\n');
  template = template.replace('{{external_agents}}', externalDivisions || '(none)');

  fs.writeFileSync(claudeMdPath, template, 'utf-8');
  console.log(`  Generated .claude/CLAUDE.md (${agentCount} agents)`);

  // 5. Add .agr/ to .gitignore
  const gitignorePath = path.join(cwd, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    if (!content.includes('.agr/')) {
      fs.appendFileSync(gitignorePath, '\n.agr/\n');
      console.log('  Added .agr/ to .gitignore');
    }
  } else {
    fs.writeFileSync(gitignorePath, '.agr/\n', 'utf-8');
    console.log('  Created .gitignore with .agr/');
  }

  // 6. Install SessionStart hook
  installHook(cwd);
  console.log('  Installed SessionStart hook');

  console.log();
  console.log('\x1b[32m✓ AgentCrow initialized.\x1b[0m Run `claude` and it will auto-dispatch agents.');
  console.log('\x1b[90m  agentcrow off    — disable\x1b[0m');
  console.log('\x1b[90m  agentcrow on     — re-enable\x1b[0m');
  console.log('\x1b[90m  agentcrow status — check\x1b[0m');
}

// ─── agentcrow agents ───
async function cmdAgents(): Promise<void> {
  const manager = new AgentManager(BUILTIN_DIR, EXTERNAL_DIR);
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
  const catalog = new AgentCatalog(BUILTIN_DIR, EXTERNAL_DIR);
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
  const manager = new AgentManager(BUILTIN_DIR, EXTERNAL_DIR);
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
  const catalog = new AgentCatalog(BUILTIN_DIR, EXTERNAL_DIR);
  await catalog.build();
  const allRoles = catalog.listAll().map((e) => e.role);

  const sysPrompt = `You are a task decomposer. Given a user prompt, break it into tasks with agent roles.
Available roles: ${allRoles.join(', ')}
Output ONLY a JSON array: [{"role":"role_name","action":"specific task"}]
2-6 tasks. No explanation.`;

  return new Promise((resolve) => {
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

    proc.on('close', () => {
      try {
        const match = out.match(/\[[\s\S]*\]/);
        if (match) resolve(JSON.parse(match[0]));
        else resolve([{ role: 'frontend_developer', action: prompt }]);
      } catch {
        resolve([{ role: 'frontend_developer', action: prompt }]);
      }
    });

    proc.on('error', () => {
      resolve([{ role: 'frontend_developer', action: prompt }]);
    });
  });
}

// ─── Utility ───
function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
  const agrDir = path.join(cwd, '.agr', 'agents');

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
  // Find the hook script — try npx location first, then local
  const hookScript = `node -e "
const fs=require('fs'),p=require('path');
const d=p.join(process.cwd(),'.agr','agents','builtin');
if(!fs.existsSync(d)){process.exit(0)}
const f=fs.readdirSync(d).filter(x=>x.endsWith('.yaml'));
const r=f.map(x=>x.replace('.yaml','').replace(/-/g,'_'));
const line='─'.repeat(50);
console.log('\\x1b[35m🐦 AgentCrow active\\x1b[0m');
console.log('\\x1b[90m'+line+'\\x1b[0m');
console.log('\\x1b[90m'+f.length+' builtin agents:\\x1b[0m');
r.forEach(x=>console.log('\\x1b[90m  · '+x+'\\x1b[0m'));
const e=p.join(process.cwd(),'.agr','agents','external','agency-agents');
if(fs.existsSync(e)){
  const skip=new Set(['scripts','integrations','examples','.github','.git']);
  let c=0,divs=[];
  fs.readdirSync(e,{withFileTypes:true}).forEach(x=>{
    if(!x.isDirectory()||skip.has(x.name))return;
    divs.push(x.name);
    const walk=d=>{fs.readdirSync(d,{withFileTypes:true}).forEach(y=>{
      if(y.isDirectory())walk(p.join(d,y.name));
      else if(y.name.endsWith('.md')&&y.name!=='README.md')c++;
    })};
    walk(p.join(e,x.name));
  });
  console.log('\\x1b[90m'+c+' external agents ('+divs.length+' divisions)\\x1b[0m');
}
console.log('\\x1b[90m'+line+'\\x1b[0m');
console.log('\\x1b[90mComplex prompts → auto agent dispatch\\x1b[0m');
"`;

  settings.hooks.SessionStart = [{
    type: 'command',
    command: hookScript,
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
    case 'init':
      await cmdInit();
      break;

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
