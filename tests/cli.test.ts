import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('cli module', () => {
  const cliSrcPath = path.resolve('src/cli.ts');

  it('src/cli.ts 파일이 존재한다', () => {
    expect(fs.existsSync(cliSrcPath)).toBe(true);
  });

  it('cli.ts에 모든 커맨드 모듈 import가 포함되어 있다', () => {
    const content = fs.readFileSync(cliSrcPath, 'utf-8');
    expect(content).toContain("from './commands/init.js'");
    expect(content).toContain("from './commands/lifecycle.js'");
    expect(content).toContain("from './commands/agents.js'");
    expect(content).toContain("from './commands/compose.js'");
    expect(content).toContain("from './commands/update.js'");
    expect(content).toContain("from './commands/doctor.js'");
    expect(content).toContain("from './commands/uninstall.js'");
  });

  it('cli.ts에 모든 서브커맨드가 정의되어 있다', () => {
    const content = fs.readFileSync(cliSrcPath, 'utf-8');
    const expectedCommands = ['init', 'on', 'off', 'status', 'agents', 'compose', 'update', 'doctor', 'uninstall', 'add', 'remove', 'serve'];
    for (const cmd of expectedCommands) {
      expect(content).toContain(`'${cmd}'`);
    }
  });

  it('package.json bin이 dist/cli.js를 가리킨다', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
    expect(pkg.bin.agentcrow).toBe('./dist/cli.js');
  });

  it('cli.ts에 shebang이 포함되어 있다', () => {
    const content = fs.readFileSync(cliSrcPath, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });
});

describe('command modules', () => {
  const commandFiles = [
    'src/commands/init.ts',
    'src/commands/lifecycle.ts',
    'src/commands/agents.ts',
    'src/commands/compose.ts',
    'src/commands/update.ts',
    'src/commands/doctor.ts',
    'src/commands/uninstall.ts',
  ];

  for (const file of commandFiles) {
    it(`${file}이 존재한다`, () => {
      expect(fs.existsSync(path.resolve(file))).toBe(true);
    });
  }

  it('init.ts가 cmdInit을 export한다', () => {
    const content = fs.readFileSync(path.resolve('src/commands/init.ts'), 'utf-8');
    expect(content).toContain('export async function cmdInit');
  });

  it('lifecycle.ts가 on/off/status를 export한다', () => {
    const content = fs.readFileSync(path.resolve('src/commands/lifecycle.ts'), 'utf-8');
    expect(content).toContain('export function cmdOff');
    expect(content).toContain('export function cmdOn');
    expect(content).toContain('export function cmdStatus');
  });

  it('init.ts가 --lang 파라미터를 사용한다', () => {
    const content = fs.readFileSync(path.resolve('src/commands/init.ts'), 'utf-8');
    expect(content).toContain('lang');
    expect(content).toContain('isKo');
  });
});

describe('utils modules', () => {
  it('constants.ts가 VERSION을 export한다', () => {
    const content = fs.readFileSync(path.resolve('src/utils/constants.ts'), 'utf-8');
    expect(content).toContain('export const VERSION');
    expect(content).toContain('package.json');
  });

  it('hooks.ts가 installHook/removeHook을 export한다', () => {
    const content = fs.readFileSync(path.resolve('src/utils/hooks.ts'), 'utf-8');
    expect(content).toContain('export function installHook');
    expect(content).toContain('export function removeHook');
  });
});
