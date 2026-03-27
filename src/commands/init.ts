import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { AgentCatalog } from '../core/catalog.js';
import { installHook } from '../utils/hooks.js';
import { installMcpServer } from '../utils/mcp-config.js';
import { generateAgentIndex } from '../utils/index-generator.js';
import { buildCatalogIndex } from '../utils/catalog-index.js';
import {
  c, VERSION,
  BUILTIN_DIR, GLOBAL_BUILTIN, GLOBAL_EXTERNAL, GLOBAL_MD, GLOBAL_DIR,
  AGENTCROW_START, AGENTCROW_END,
} from '../utils/constants.js';

export async function ensureGlobalAgents(lang: string = 'en'): Promise<{ builtinDir: string; externalDir: string; agentCount: number }> {
  // 1. Copy builtin agents (from npm package → global)
  // Use language-specific directory if available (agents/builtin/en/ or agents/builtin/)
  const langBuiltinDir = path.join(BUILTIN_DIR, lang);
  const effectiveBuiltinDir = fs.existsSync(langBuiltinDir) ? langBuiltinDir : BUILTIN_DIR;

  fs.mkdirSync(GLOBAL_BUILTIN, { recursive: true });
  if (fs.existsSync(effectiveBuiltinDir)) {
    const files = fs.readdirSync(effectiveBuiltinDir).filter((f) => f.endsWith('.yaml'));
    let copied = 0;
    for (const file of files) {
      const dest = path.join(GLOBAL_BUILTIN, file);
      const src = path.join(effectiveBuiltinDir, file);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        copied++;
      } else {
        // Update if source file content hash differs (size is a proxy)
        const srcContent = fs.readFileSync(src, 'utf-8');
        const destContent = fs.readFileSync(dest, 'utf-8');
        if (srcContent !== destContent) {
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

  // 3. Generate .md files globally
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

  // 4. Generate INDEX.md for lazy-loading
  generateAgentIndex(allAgents, GLOBAL_MD);
  console.log(`  ${c.green('▸')} Agent index ··· INDEX.md generated ${c.green('✓')}`);

  // 5. Build catalog index for fast hook-based persona injection
  buildCatalogIndex(catalog);
  console.log(`  ${c.green('▸')} Catalog index ··· catalog-index.json built ${c.green('✓')}`);

  return { builtinDir: GLOBAL_BUILTIN, externalDir: GLOBAL_EXTERNAL, agentCount: allAgents.length };
}

function generateAgentCrowSection(agentCount: number, maxAgents: number, lang: string): string {
  const isKo = lang === 'ko';

  const rules = isKo
    ? `## 규칙
1. 복합 요청 (2개 이상의 작업)이 들어오면 .claude/agents/INDEX.md에서 매칭되는 에이전트를 찾고, 해당 .md 파일을 열어 전체 정의를 확인한 후 Agent 도구로 디스패치한다.
2. 한 번에 최대 **${maxAgents}개** 에이전트를 디스패치한다. 더 필요하면 우선순위 상위 ${maxAgents}개만.
3. 독립적인 작업은 병렬로, 의존 관계가 있으면 순차적으로 디스패치한다.
4. 질문하지 않는다. 판단하고 진행한다.
5. 디스패치 전에 아래 형식으로 계획을 보여준다:

\`\`\`
━━━ 🐦 AgentCrow ━━━━━━━━━━━━━━━━━━━━━
N개 에이전트 디스패치:

{emoji} @agent_role → 작업 설명
{emoji} @agent_role → 작업 설명
{emoji} @agent_role → 작업 설명 (의존: 1,2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`\`\`

6. 단순 요청 (버그 수정, 파일 하나 수정)은 직접 처리. 에이전트 불필요.
7. 모든 에이전트 완료 후: \`━━━ 🐦 AgentCrow 완료 ━━━━━━━━━━━━━\``
    : `## Rules
1. For complex requests (2+ tasks), read .claude/agents/INDEX.md to find matching agents, then open the agent's .md file for the full definition. Dispatch using the Agent tool.
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
7. After all agents complete, show: \`━━━ 🐦 AgentCrow complete ━━━━━━━━━━━━━\``;

  const roleEmojiGuide = isKo
    ? `## 역할 이모지
- 🖥️ frontend, ui — 🏗️ backend, api, architect — 🧪 qa, test
- 🛡️ security — 📝 writer, docs — 🔄 data, pipeline
- 🎨 design, ux — ⚙️ devops, sre — 🎮 game
- 🤖 ai, ml — 📢 marketing, seo — 📊 product — 📱 mobile
- 🐦 (기본)`
    : `## Role Emoji Reference
Use these emojis when showing the dispatch plan:
- 🖥️ frontend, ui — 🏗️ backend, api, architect — 🧪 qa, test
- 🛡️ security — 📝 writer, docs — 🔄 data, pipeline
- 🎨 design, ux — ⚙️ devops, sre — 🎮 game
- 🤖 ai, ml — 📢 marketing, seo — 📊 product — 📱 mobile
- 🐦 (default for unmatched roles)`;

  return `${AGENTCROW_START}
# 🐦 AgentCrow — Auto Agent Dispatch

${rules}

${roleEmojiGuide}

## Agents: ${agentCount} available in .claude/agents/
${AGENTCROW_END}`;
}

export async function cmdInit(lang: string = 'en', maxAgents: number = 5, global: boolean = false, mcp: boolean = false): Promise<void> {
  const targetBase = global ? path.join(os.homedir(), '.claude') : path.join(process.cwd(), '.claude');
  const modeLabel = global ? 'global' : 'project';

  console.log();
  console.log(`  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)} ${c.dim(`(${modeLabel})`)}`);
  console.log();

  // 1. Ensure global agent storage
  const { builtinDir, externalDir, agentCount } = await ensureGlobalAgents(lang);

  // 2. Build catalog
  const catalog = new AgentCatalog(builtinDir, externalDir);
  await catalog.build();

  // 3. Symlink .claude/agents/ → ~/.agentcrow/agents/md/
  const claudeDir = targetBase;
  const agentsDir = path.join(claudeDir, 'agents');
  fs.mkdirSync(claudeDir, { recursive: true });

  const allAgents = catalog.listAll();

  // Remove existing agents dir/symlink if present
  try {
    const stat = fs.lstatSync(agentsDir);
    if (stat.isSymbolicLink()) {
      fs.unlinkSync(agentsDir);
    } else if (stat.isDirectory()) {
      fs.rmSync(agentsDir, { recursive: true, force: true });
      console.log(`  ${c.dim('▸ Migrated: removed per-project agent copies')}`);
    }
  } catch {
    // agentsDir doesn't exist yet
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

  // 4. Generate CLAUDE.md with lang support
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
  const agentCrowSection = generateAgentCrowSection(allAgents.length, maxAgents, lang);

  try {
    if (fs.existsSync(claudeMdPath)) {
      const existing = fs.readFileSync(claudeMdPath, 'utf-8');
      const startIdx = existing.indexOf(AGENTCROW_START);
      const endIdx = existing.indexOf(AGENTCROW_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const before = existing.slice(0, startIdx);
        const after = existing.slice(endIdx + AGENTCROW_END.length);
        fs.writeFileSync(claudeMdPath, before + agentCrowSection + after, 'utf-8');
        console.log(`  ${c.green('▸')} Dispatch rules ··· CLAUDE.md updated ${c.green('✓')}`);
      } else {
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

  // 5. Install hook
  installHook(global ? os.homedir() : process.cwd(), global);
  console.log(`  ${c.green('▸')} SessionStart hook ··· installed ${c.dim(`(${modeLabel})`)} ${c.green('✓')}`);

  // 6. Install MCP server (optional)
  if (mcp) {
    installMcpServer(global);
    console.log(`  ${c.green('▸')} MCP server ··· registered ${c.dim(`(${modeLabel})`)} ${c.green('✓')}`);
  }

  console.log();
  console.log(`  ${c.green('✓')} ${c.purple('AgentCrow')} ready — ${c.bold(String(allAgents.length))} agents, max ${c.bold(String(maxAgents))} per dispatch ${c.dim(`(${modeLabel})`)}`);
  if (mcp) {
    console.log(`  ${c.dim('MCP server: Claude Code will auto-start agentcrow serve')}`);
  }
  if (global) {
    console.log(`  ${c.dim('Works in all projects. No per-project init needed.')}`);
  }
  console.log(`  ${c.dim('agentcrow off / on / status')}`);
  console.log();
}
