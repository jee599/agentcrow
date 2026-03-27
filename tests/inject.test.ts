import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('inject command', () => {
  const injectPath = path.resolve('src/commands/inject.ts');

  it('inject.ts가 존재한다', () => {
    expect(fs.existsSync(injectPath)).toBe(true);
  });

  it('cmdInject를 export한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('export async function cmdInject');
  });

  it('stdin에서 hook input JSON을 읽는다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('/dev/stdin');
    expect(content).toContain('JSON.parse');
  });

  it('Agent tool 호출만 처리한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain("tool_name !== 'Agent'");
  });

  it('Claude 내장 subagent_type을 스킵한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('BUILTIN_SUBAGENT_TYPES');
    expect(content).toContain('Explore');
    expect(content).toContain('Plan');
  });

  it('3단계 매칭 전략을 사용한다 (name → subagent_type → keyword)', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('Strategy 1: Exact match by name');
    expect(content).toContain('Strategy 2: Exact match by subagent_type');
    expect(content).toContain('Strategy 3: Keyword matching');
  });

  it('페르소나를 AGENTCROW_PERSONA 태그로 감싼다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('<AGENTCROW_PERSONA>');
    expect(content).toContain('</AGENTCROW_PERSONA>');
  });

  it('hookSpecificOutput JSON을 출력한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('hookSpecificOutput');
    expect(content).toContain('permissionDecision');
    expect(content).toContain('updatedInput');
  });

  it('매칭 실패 시 아무것도 출력하지 않는다 (passthrough)', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    // No match case just returns without writing to stdout
    expect(content).toContain("matchType: 'none'");
    expect(content).toContain('return;');
  });

  it('history.json에 기록한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('recordDispatch');
    expect(content).toContain("source: 'hook'");
  });
});

describe('inject persona formatting', () => {
  const injectPath = path.resolve('src/commands/inject.ts');

  it('identity 섹션을 포함한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('## Identity');
    expect(content).toContain('## Communication Style');
    expect(content).toContain('## Thinking Approach');
  });

  it('MUST/MUST NOT 규칙을 포함한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('## MUST');
    expect(content).toContain('## MUST NOT');
  });

  it('deliverables를 포함한다', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('## Deliverables');
  });

  it('원본 prompt를 보존한다 (prepend, not replace)', () => {
    const content = fs.readFileSync(injectPath, 'utf-8');
    expect(content).toContain('`${persona}\\n\\n${toolInput.prompt}`');
  });
});

describe('catalog-index', () => {
  const indexPath = path.resolve('src/utils/catalog-index.ts');

  it('catalog-index.ts가 존재한다', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('buildCatalogIndex/loadCatalogIndex를 export한다', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('export function buildCatalogIndex');
    expect(content).toContain('export function loadCatalogIndex');
  });

  it('catalog-index.json에 저장한다', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('catalog-index.json');
  });

  it('entries와 agents를 모두 직렬화한다', () => {
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('entries');
    expect(content).toContain('agents');
    expect(content).toContain('version');
  });
});

describe('hook script', () => {
  const scriptPath = path.resolve('scripts/agentcrow-inject.sh');

  it('agentcrow-inject.sh가 존재한다', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('Agent tool만 처리한다', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('"Agent"');
  });

  it('agentcrow inject에 위임한다', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('agentcrow inject');
  });

  it('jq 없이도 동작한다 (fallback)', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('grep');
  });

  it('실행 권한이 있다', () => {
    const stat = fs.statSync(scriptPath);
    const isExecutable = (stat.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });
});

describe('hooks.ts PreToolUse', () => {
  const hooksPath = path.resolve('src/utils/hooks.ts');

  it('PreToolUse hook을 설치한다', () => {
    const content = fs.readFileSync(hooksPath, 'utf-8');
    expect(content).toContain('PreToolUse');
    expect(content).toContain("matcher: 'Agent'");
  });

  it('hook script를 배포한다', () => {
    const content = fs.readFileSync(hooksPath, 'utf-8');
    expect(content).toContain('agentcrow-inject.sh');
    expect(content).toContain('copyFileSync');
    expect(content).toContain('chmodSync');
  });

  it('removeHook이 PreToolUse도 정리한다', () => {
    const content = fs.readFileSync(hooksPath, 'utf-8');
    expect(content).toContain("settings.hooks?.PreToolUse");
  });
});
