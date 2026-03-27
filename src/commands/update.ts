import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { AgentCatalog } from '../core/catalog.js';
import { c, VERSION, GLOBAL_BUILTIN, GLOBAL_EXTERNAL, GLOBAL_MD, GLOBAL_DIR } from '../utils/constants.js';
import { generateAgentIndex } from '../utils/index-generator.js';
import { buildCatalogIndex } from '../utils/catalog-index.js';

export async function cmdUpdate(): Promise<void> {
  console.log();
  console.log(`  ${c.purple('🐦 AgentCrow')} ${c.dim(`v${VERSION}`)} — updating agents`);
  console.log();

  if (!fs.existsSync(GLOBAL_DIR)) {
    console.log(`  ${c.red('✗')} AgentCrow not installed. Run ${c.cyan('agentcrow init --global')} first.`);
    return;
  }

  // 1. Update external agents via git clone (replace existing)
  const externalParent = path.dirname(GLOBAL_EXTERNAL);
  const tempDir = GLOBAL_EXTERNAL + '.tmp';

  console.log(`  ${c.yellow('▸')} External agents ··· fetching latest`);
  try {
    // Clone to temp dir
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

    const git = spawn('git', ['clone', '--depth', '1', 'https://github.com/msitarzewski/agency-agents.git', tempDir], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    await new Promise<void>((resolve, reject) => {
      git.on('close', (code) => code === 0 ? resolve() : reject(new Error(`git clone failed: ${code}`)));
      git.on('error', reject);
    });

    // Remove .git from clone
    const gitDir = path.join(tempDir, '.git');
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true, force: true });

    // Replace old with new
    if (fs.existsSync(GLOBAL_EXTERNAL)) fs.rmSync(GLOBAL_EXTERNAL, { recursive: true, force: true });
    fs.renameSync(tempDir, GLOBAL_EXTERNAL);

    console.log(`  ${c.green('▸')} External agents ··· updated ${c.green('✓')}`);
  } catch (err) {
    // Clean up temp dir on failure
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`  ${c.red('✗')} Failed to update external agents: ${(err as Error).message}`);
    console.log(`    ${c.dim('Make sure git is installed and you have internet access.')}`);
    return;
  }

  // 2. Regenerate .md files (clear and rebuild)
  if (fs.existsSync(GLOBAL_MD)) fs.rmSync(GLOBAL_MD, { recursive: true, force: true });
  fs.mkdirSync(GLOBAL_MD, { recursive: true });

  const catalog = new AgentCatalog(GLOBAL_BUILTIN, GLOBAL_EXTERNAL);
  await catalog.build();
  const allAgents = catalog.listAll();

  let mdGenerated = 0;
  for (const entry of allAgents) {
    const safeRole = entry.role.replace(/[^a-z0-9_]/g, '_');
    const mdPath = path.join(GLOBAL_MD, `${safeRole}.md`);

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

  console.log(`  ${c.green('▸')} Agent definitions ··· ${c.bold(String(mdGenerated))} regenerated ${c.green('✓')}`);

  // Regenerate INDEX.md
  generateAgentIndex(allAgents, GLOBAL_MD);
  console.log(`  ${c.green('▸')} Agent index ··· INDEX.md regenerated ${c.green('✓')}`);

  // Rebuild catalog index
  buildCatalogIndex(catalog);
  console.log(`  ${c.green('▸')} Catalog index ··· rebuilt ${c.green('✓')}`);

  console.log();
  console.log(`  ${c.green('✓')} Update complete — ${c.bold(String(allAgents.length))} agents available`);
  console.log();
}
