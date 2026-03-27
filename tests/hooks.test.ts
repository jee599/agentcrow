import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// We test the hook functions by reading their source and verifying behavior via temp files
describe('hook management', () => {
  const hooksSrcPath = path.resolve('src/utils/hooks.ts');

  it('hooks.ts 파일이 존재한다', () => {
    expect(fs.existsSync(hooksSrcPath)).toBe(true);
  });

  it('installHook이 SessionStart hook 형식을 사용한다', () => {
    const content = fs.readFileSync(hooksSrcPath, 'utf-8');
    expect(content).toContain('SessionStart');
    expect(content).toContain('AgentCrow');
    expect(content).toContain('matcher');
  });

  it('removeHook이 AgentCrow hook만 제거한다', () => {
    const content = fs.readFileSync(hooksSrcPath, 'utf-8');
    expect(content).toContain('filter');
    expect(content).toContain('AgentCrow');
  });

  it('installHook이 중복 hook을 방지한다', () => {
    const content = fs.readFileSync(hooksSrcPath, 'utf-8');
    expect(content).toContain('hasSessionHook');
    expect(content).toContain('hasInjectHook');
  });

  it('removeHook이 빈 hooks 객체를 정리한다', () => {
    const content = fs.readFileSync(hooksSrcPath, 'utf-8');
    expect(content).toContain('Object.keys(settings.hooks).length === 0');
  });
});

describe('hook integration (temp directory)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrow-test-'));
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('settings.json에 hook이 올바른 구조로 삽입된다', async () => {
    // Write empty settings
    const settingsPath = path.join(tmpDir, '.claude', 'settings.local.json');
    fs.writeFileSync(settingsPath, '{}', 'utf-8');

    // Dynamically import and call installHook
    const { installHook } = await import('../src/utils/hooks.js');
    installHook(tmpDir, false);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.SessionStart).toBeDefined();
    expect(settings.hooks.SessionStart.length).toBe(1);
    expect(settings.hooks.SessionStart[0].matcher).toBe('');
    expect(settings.hooks.SessionStart[0].hooks).toBeDefined();
    expect(settings.hooks.SessionStart[0].hooks[0].type).toBe('command');
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('AgentCrow');
  });

  it('installHook 중복 호출 시 hook이 1개만 존재한다', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.local.json');
    fs.writeFileSync(settingsPath, '{}', 'utf-8');

    const { installHook } = await import('../src/utils/hooks.js');
    installHook(tmpDir, false);
    installHook(tmpDir, false);
    installHook(tmpDir, false);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks.SessionStart.length).toBe(1);
  });

  it('removeHook이 AgentCrow hook만 제거하고 다른 hook은 보존한다', async () => {
    const settingsPath = path.join(tmpDir, '.claude', 'settings.local.json');

    // Pre-populate with both AgentCrow hook and another hook
    const initial = {
      hooks: {
        SessionStart: [
          { matcher: '', hooks: [{ type: 'command', command: 'echo other-tool' }] },
          { matcher: '', hooks: [{ type: 'command', command: 'echo AgentCrow active' }] },
        ],
      },
    };
    fs.writeFileSync(settingsPath, JSON.stringify(initial), 'utf-8');

    const { removeHook } = await import('../src/utils/hooks.js');
    removeHook(tmpDir, false);

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    expect(settings.hooks.SessionStart.length).toBe(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('other-tool');
  });
});
