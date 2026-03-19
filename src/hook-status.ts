#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';

const cwd = process.cwd();
const agrDir = path.join(cwd, '.agr', 'agents');
const builtinDir = path.join(agrDir, 'builtin');

if (!fs.existsSync(builtinDir)) {
  process.exit(0);
}

const builtinFiles = fs.readdirSync(builtinDir).filter(f => f.endsWith('.yaml'));
const roles = builtinFiles.map(f => f.replace('.yaml', '').replace(/-/g, '_'));

const divider = '─'.repeat(50);
console.log(`\x1b[35m🐦 AgentCrow active\x1b[0m`);
console.log(`\x1b[90m${divider}\x1b[0m`);
console.log(`\x1b[90m${builtinFiles.length} builtin agents ready:\x1b[0m`);
for (const role of roles) {
  console.log(`\x1b[90m  · ${role}\x1b[0m`);
}

// Check external
const extDir = path.join(agrDir, 'external', 'agency-agents');
if (fs.existsSync(extDir)) {
  let extCount = 0;
  const EXCLUDED = new Set(['scripts', 'integrations', 'examples', '.github', '.git']);
  const divisions: string[] = [];

  for (const d of fs.readdirSync(extDir, { withFileTypes: true })) {
    if (!d.isDirectory() || EXCLUDED.has(d.name)) continue;
    divisions.push(d.name);
    const countMd = (dir: string): number => {
      let c = 0;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) c += countMd(path.join(dir, e.name));
        else if (e.name.endsWith('.md') && e.name !== 'README.md') c++;
      }
      return c;
    };
    extCount += countMd(path.join(extDir, d.name));
  }
  console.log(`\x1b[90m${extCount} external agents across ${divisions.length} divisions\x1b[0m`);
}

console.log(`\x1b[90m${divider}\x1b[0m`);
console.log(`\x1b[90mComplex prompts will be auto-decomposed into agent tasks.\x1b[0m`);
