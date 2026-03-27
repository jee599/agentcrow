import * as fs from 'node:fs';
import { spawn } from 'node:child_process';
import { AgentManager } from '../core/agent-manager.js';
import { AgentCatalog } from '../core/catalog.js';
import { c, BUILTIN_DIR, GLOBAL_BUILTIN, EXTERNAL_DIR, GLOBAL_EXTERNAL, getRoleEmoji } from '../utils/constants.js';
import { recordDispatch } from '../utils/history.js';

function getAgentDirs(): { bDir: string; eDir: string } {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  return { bDir, eDir };
}

function checkClaudeCli(): boolean {
  try {
    const result = require('node:child_process').execSync('which claude', { stdio: 'pipe' });
    return result.toString().trim().length > 0;
  } catch {
    return false;
  }
}

async function decompose(prompt: string, verbose: boolean = false): Promise<Array<{ role: string; action: string }>> {
  // Pre-check: is claude CLI available?
  if (!checkClaudeCli()) {
    console.error(`  ${c.red('✗')} claude CLI not found.`);
    console.error(`    Install: ${c.cyan('npm i -g @anthropic-ai/claude-code')}`);
    console.error(`    Then: ${c.cyan('claude login')}`);
    process.exit(1);
  }

  const { bDir, eDir } = getAgentDirs();
  const catalog = new AgentCatalog(bDir, eDir);
  await catalog.build();
  const allRoles = catalog.listAll().map((e) => e.role);

  const sysPrompt = `You are a task decomposer. Given a user prompt, break it into tasks with agent roles.
Available roles: ${allRoles.join(', ')}
Output ONLY a JSON array: [{"role":"role_name","action":"specific task"}]
2-6 tasks. No explanation.`;

  return new Promise((resolve) => {
    const proc = spawn('claude', ['-p'], {
      env: process.env as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(`${sysPrompt}\n\nUser prompt: "${prompt}"\n\nJSON array:`);
    proc.stdin.end();

    let out = '';
    let errOut = '';
    proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { errOut += d.toString(); });

    proc.on('close', (code) => {
      if (verbose) {
        console.log(`  ${c.dim(`[verbose] exit code: ${code}`)}`);
        if (errOut) console.log(`  ${c.dim(`[verbose] stderr: ${errOut.slice(0, 200)}`)}`);
      }

      try {
        const match = out.match(/\[[\s\S]*\]/);
        if (match) {
          resolve(JSON.parse(match[0]));
        } else {
          console.error(`  ${c.red('✗')} Failed to decompose prompt.`);
          if (code !== 0) {
            console.error(`    claude exited with code ${code}`);
          }
          if (errOut) {
            console.error(`    ${c.dim(errOut.slice(0, 300))}`);
          }
          console.error(`    Make sure ${c.cyan('claude')} is installed and authenticated.`);
          process.exit(1);
        }
      } catch (parseErr) {
        console.error(`  ${c.red('✗')} Failed to parse decomposition result.`);
        console.error(`    Raw output: ${c.dim(out.slice(0, 200))}`);
        process.exit(1);
      }
    });

    proc.on('error', (err) => {
      console.error(`  ${c.red('✗')} Failed to spawn claude process: ${err.message}`);
      console.error(`    Make sure ${c.cyan('claude')} is installed and in your PATH.`);
      process.exit(1);
    });
  });
}

export async function cmdCompose(prompt: string, verbose: boolean = false): Promise<void> {
  const { bDir, eDir } = getAgentDirs();
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  console.log(`\n  ${c.purple('🐦')} Decomposing prompt...\n`);

  const tasks = await decompose(prompt, verbose);

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

    // Record dispatch history
    recordDispatch({
      timestamp: new Date().toISOString(),
      role: t.role,
      action: t.action,
      matchType: matchResult.matchType,
      agentName: matchResult.agent?.name ?? null,
      source: 'cli',
    });

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
