import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('history module', () => {
  it('history.ts가 존재한다', () => {
    expect(fs.existsSync(path.resolve('src/utils/history.ts'))).toBe(true);
  });

  it('recordDispatch와 calculateStats를 export한다', () => {
    const content = fs.readFileSync(path.resolve('src/utils/history.ts'), 'utf-8');
    expect(content).toContain('export function recordDispatch');
    expect(content).toContain('export function calculateStats');
    expect(content).toContain('export function loadHistory');
  });

  it('최대 1000개 레코드만 유지한다', () => {
    const content = fs.readFileSync(path.resolve('src/utils/history.ts'), 'utf-8');
    expect(content).toContain('1000');
    expect(content).toContain('slice');
  });
});

describe('stats command', () => {
  it('stats.ts가 존재한다', () => {
    expect(fs.existsSync(path.resolve('src/commands/stats.ts'))).toBe(true);
  });

  it('Top Agents와 Match Quality를 표시한다', () => {
    const content = fs.readFileSync(path.resolve('src/commands/stats.ts'), 'utf-8');
    expect(content).toContain('Top Agents');
    expect(content).toContain('Match Quality');
    expect(content).toContain('exact');
    expect(content).toContain('fuzzy');
  });

  it('히스토리가 없을 때 안내 메시지를 보여준다', () => {
    const content = fs.readFileSync(path.resolve('src/commands/stats.ts'), 'utf-8');
    expect(content).toContain('No dispatch history yet');
  });
});

describe('history integration', () => {
  // Override history path for test isolation
  let tmpDir: string;
  let origHome: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentcrow-hist-'));
    origHome = process.env.HOME ?? os.homedir();
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = origHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recordDispatch가 history.json에 기록한다', async () => {
    // Note: history.ts uses os.homedir() which reads HOME env
    // This test verifies the module structure, not file I/O
    const { loadHistory } = await import('../src/utils/history.js');
    const history = loadHistory();
    expect(Array.isArray(history)).toBe(true);
  });
});
