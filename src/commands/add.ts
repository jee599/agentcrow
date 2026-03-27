import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { AgentCatalog } from '../core/catalog.js';
import { generateAgentIndex } from '../utils/index-generator.js';
import { c, GLOBAL_BUILTIN, GLOBAL_EXTERNAL, GLOBAL_MD } from '../utils/constants.js';

const CUSTOM_DIR = path.join(GLOBAL_MD, '..', 'custom');

function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

function inferRoleFromFile(filePath: string): string {
  return path.basename(filePath, path.extname(filePath)).replace(/[-\s]/g, '_').toLowerCase();
}

export async function cmdAdd(input: string): Promise<void> {
  console.log();

  // 1. Resolve input to a local file
  let sourcePath: string;
  let tempFile = false;

  if (isUrl(input)) {
    // Download to temp
    const ext = input.endsWith('.yaml') || input.endsWith('.yml') ? '.yaml' : '.md';
    const tmpPath = path.join(CUSTOM_DIR, `_download_tmp${ext}`);
    fs.mkdirSync(CUSTOM_DIR, { recursive: true });

    try {
      execSync(`curl -sL "${input}" -o "${tmpPath}"`, { stdio: 'pipe' });
      sourcePath = tmpPath;
      tempFile = true;
      console.log(`  ${c.green('▸')} Downloaded from URL`);
    } catch {
      console.error(`  ${c.red('✗')} Failed to download: ${input}`);
      return;
    }
  } else {
    // Local file
    const resolved = path.resolve(input);
    if (!fs.existsSync(resolved)) {
      console.error(`  ${c.red('✗')} File not found: ${resolved}`);
      return;
    }
    sourcePath = resolved;
  }

  // 2. Validate file extension
  const ext = path.extname(sourcePath);
  if (ext !== '.md' && ext !== '.yaml' && ext !== '.yml') {
    console.error(`  ${c.red('✗')} Unsupported format: ${ext}. Use .md or .yaml`);
    if (tempFile) fs.unlinkSync(sourcePath);
    return;
  }

  // 3. Read and validate content
  const content = fs.readFileSync(sourcePath, 'utf-8');
  if (content.trim().length < 50) {
    console.error(`  ${c.red('✗')} File is too short to be a valid agent definition.`);
    if (tempFile) fs.unlinkSync(sourcePath);
    return;
  }

  // 4. Determine role and destination
  const role = inferRoleFromFile(sourcePath.replace('_download_tmp', input.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'custom'));
  const destFileName = `${role}.md`;
  const destPath = path.join(GLOBAL_MD, destFileName);

  // 5. If source is .yaml, convert to .md
  let mdContent: string;
  if (ext === '.yaml' || ext === '.yml') {
    try {
      const yamlMod = await import('yaml');
      const parsed = yamlMod.parse(content);
      mdContent = [
        `# ${parsed.name || role}`,
        `> ${parsed.description || ''}`,
        '',
        `**Role:** ${parsed.role || role}`,
        '',
        parsed.identity?.personality ? `## Identity\n${parsed.identity.personality.trim()}` : '',
        parsed.critical_rules?.must?.length ? `## MUST\n${parsed.critical_rules.must.map((r: string) => `- ${r}`).join('\n')}` : '',
        parsed.critical_rules?.must_not?.length ? `## MUST NOT\n${parsed.critical_rules.must_not.map((r: string) => `- ${r}`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n');
    } catch {
      console.error(`  ${c.red('✗')} Failed to parse YAML.`);
      if (tempFile) fs.unlinkSync(sourcePath);
      return;
    }
  } else {
    mdContent = content;
  }

  // 6. Write to global agents directory
  const existed = fs.existsSync(destPath);
  fs.writeFileSync(destPath, mdContent, 'utf-8');

  // 7. Also keep a copy in custom dir for tracking
  fs.mkdirSync(CUSTOM_DIR, { recursive: true });
  fs.writeFileSync(path.join(CUSTOM_DIR, destFileName), mdContent, 'utf-8');

  // 8. Clean up temp file
  if (tempFile) {
    const tmpPath = sourcePath;
    if (fs.existsSync(tmpPath) && tmpPath.includes('_download_tmp')) {
      fs.unlinkSync(tmpPath);
    }
  }

  // 9. Regenerate INDEX.md
  const catalog = new AgentCatalog(GLOBAL_BUILTIN, GLOBAL_EXTERNAL);
  await catalog.build();
  generateAgentIndex(catalog.listAll(), GLOBAL_MD);

  const action = existed ? 'updated' : 'added';
  console.log(`  ${c.green('✓')} Agent ${c.bold(role)} ${action} → ${c.dim(destPath)}`);
  console.log();
}

export async function cmdRemove(role: string): Promise<void> {
  console.log();

  const safeRole = role.replace(/[-\s]/g, '_').toLowerCase();
  const mdPath = path.join(GLOBAL_MD, `${safeRole}.md`);
  const customPath = path.join(CUSTOM_DIR, `${safeRole}.md`);

  // Only allow removing custom agents
  if (!fs.existsSync(customPath)) {
    console.error(`  ${c.red('✗')} Agent "${role}" is not a custom agent. Only custom agents can be removed.`);
    return;
  }

  // Remove from both locations
  if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
  if (fs.existsSync(customPath)) fs.unlinkSync(customPath);

  // Regenerate INDEX.md
  const catalog = new AgentCatalog(GLOBAL_BUILTIN, GLOBAL_EXTERNAL);
  await catalog.build();
  generateAgentIndex(catalog.listAll(), GLOBAL_MD);

  console.log(`  ${c.green('✓')} Agent ${c.bold(safeRole)} removed.`);
  console.log();
}
