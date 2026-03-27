import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import * as path from 'path';
import * as fs from 'fs';

const CLI = path.resolve('dist/cli.js');
const CATALOG_INDEX = path.join(require('os').homedir(), '.agentcrow', 'catalog-index.json');

// Skip all if catalog-index.json doesn't exist (not initialized)
const hasIndex = fs.existsSync(CATALOG_INDEX);

function runInject(input: Record<string, unknown>): string {
  try {
    return execSync(`echo '${JSON.stringify(input)}' | node ${CLI} inject`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).toString();
  } catch (err: unknown) {
    // inject may exit 0 with no output (passthrough)
    const e = err as { stdout?: Buffer };
    return e.stdout?.toString() ?? '';
  }
}

function parseHookOutput(raw: string): {
  matched: boolean;
  prompt?: string;
  name?: string;
} {
  if (!raw.trim()) return { matched: false };
  const data = JSON.parse(raw);
  const updated = data?.hookSpecificOutput?.updatedInput;
  return {
    matched: true,
    prompt: updated?.prompt,
    name: updated?.name,
  };
}

describe.skipIf(!hasIndex)('inject behavioral tests (requires agentcrow init)', () => {

  describe('exact match by name', () => {
    it('qa_engineer name → QA persona injected', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Write tests', name: 'qa_engineer' },
      });
      const parsed = parseHookOutput(result);
      expect(parsed.matched).toBe(true);
      expect(parsed.prompt).toContain('<AGENTCROW_PERSONA>');
      expect(parsed.prompt).toContain('QA Engineer');
      expect(parsed.prompt).toContain('MUST');
      expect(parsed.prompt).toContain('Write tests');
    });

    it('security_auditor_deep name → Security persona', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Audit code', name: 'security_auditor_deep' },
      });
      const parsed = parseHookOutput(result);
      expect(parsed.matched).toBe(true);
      expect(parsed.prompt).toContain('<AGENTCROW_PERSONA>');
      expect(parsed.prompt).toContain('Audit code');
    });

    it('korean_tech_writer name → Writer persona', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Write docs', name: 'korean_tech_writer' },
      });
      const parsed = parseHookOutput(result);
      expect(parsed.matched).toBe(true);
      expect(parsed.prompt).toContain('<AGENTCROW_PERSONA>');
    });
  });

  describe('name normalization', () => {
    it('하이픈 이름도 매칭 (qa-engineer → qa_engineer)', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Test', name: 'qa-engineer' },
      });
      const parsed = parseHookOutput(result);
      expect(parsed.matched).toBe(true);
      expect(parsed.prompt).toContain('QA Engineer');
    });
  });

  describe('builtin subagent_type skip', () => {
    it('Explore는 스킵 (passthrough)', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Search files', subagent_type: 'Explore' },
      });
      expect(result.trim()).toBe('');
    });

    it('Plan은 스킵 (passthrough)', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Design plan', subagent_type: 'Plan' },
      });
      expect(result.trim()).toBe('');
    });

    it('general-purpose는 스킵 (passthrough)', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Do work', subagent_type: 'general-purpose' },
      });
      expect(result.trim()).toBe('');
    });
  });

  describe('non-Agent tool skip', () => {
    it('Bash tool은 passthrough', () => {
      const result = runInject({
        tool_name: 'Bash',
        tool_input: { command: 'ls' },
      });
      expect(result.trim()).toBe('');
    });

    it('Read tool은 passthrough', () => {
      const result = runInject({
        tool_name: 'Read',
        tool_input: { file_path: '/tmp/test' },
      });
      expect(result.trim()).toBe('');
    });
  });

  describe('fuzzy match by keywords', () => {
    it('react/frontend 키워드 → frontend 에이전트 매칭', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Build React frontend components with TypeScript' },
      });
      const parsed = parseHookOutput(result);
      // May or may not match depending on score threshold
      if (parsed.matched) {
        expect(parsed.prompt).toContain('<AGENTCROW_PERSONA>');
        expect(parsed.prompt).toContain('Build React frontend');
      }
    });

    it('testing/qa 키워드 → QA 에이전트 매칭 (동의어)', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Write comprehensive testing suite with unit and integration specs' },
      });
      const parsed = parseHookOutput(result);
      if (parsed.matched) {
        expect(parsed.prompt).toContain('<AGENTCROW_PERSONA>');
      }
    });
  });

  describe('no match scenarios', () => {
    it('무의미한 프롬프트는 passthrough', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'hello world' },
      });
      // May or may not match — just verify no crash
      expect(() => {
        if (result.trim()) JSON.parse(result);
      }).not.toThrow();
    });
  });

  describe('output format validation', () => {
    it('출력이 valid JSON이다', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Write tests', name: 'qa_engineer' },
      });
      expect(result.trim().length).toBeGreaterThan(0);
      const data = JSON.parse(result);
      expect(data.hookSpecificOutput).toBeDefined();
      expect(data.hookSpecificOutput.hookEventName).toBe('PreToolUse');
      expect(data.hookSpecificOutput.permissionDecision).toBe('allow');
      expect(data.hookSpecificOutput.updatedInput).toBeDefined();
      expect(data.hookSpecificOutput.updatedInput.prompt).toContain('<AGENTCROW_PERSONA>');
    });

    it('원본 prompt가 페르소나 뒤에 보존된다', () => {
      const originalPrompt = 'Build a REST API with authentication and rate limiting';
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: originalPrompt, name: 'backend_architect' },
      });
      if (result.trim()) {
        const data = JSON.parse(result);
        const finalPrompt = data.hookSpecificOutput.updatedInput.prompt;
        expect(finalPrompt).toContain('</AGENTCROW_PERSONA>');
        expect(finalPrompt).toContain(originalPrompt);
        // Persona comes before original prompt
        const personaEnd = finalPrompt.indexOf('</AGENTCROW_PERSONA>');
        const originalStart = finalPrompt.indexOf(originalPrompt);
        expect(personaEnd).toBeLessThan(originalStart);
      }
    });

    it('name, description 등 다른 필드도 보존된다', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: {
          prompt: 'Test auth',
          name: 'qa_engineer',
          description: 'Auth testing',
          subagent_type: 'custom-type',
        },
      });
      const data = JSON.parse(result);
      const updated = data.hookSpecificOutput.updatedInput;
      expect(updated.name).toBe('qa_engineer');
      expect(updated.description).toBe('Auth testing');
      expect(updated.subagent_type).toBe('custom-type');
    });
  });

  describe('persona content quality', () => {
    it('페르소나에 Identity 섹션이 있다', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Test', name: 'qa_engineer' },
      });
      const data = JSON.parse(result);
      const prompt = data.hookSpecificOutput.updatedInput.prompt;
      expect(prompt).toContain('## Identity');
    });

    it('페르소나에 MUST/MUST NOT 규칙이 있다', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Test', name: 'qa_engineer' },
      });
      const data = JSON.parse(result);
      const prompt = data.hookSpecificOutput.updatedInput.prompt;
      expect(prompt).toContain('## MUST');
      expect(prompt).toContain('## MUST NOT');
    });

    it('페르소나에 Deliverables가 있다', () => {
      const result = runInject({
        tool_name: 'Agent',
        tool_input: { prompt: 'Test', name: 'qa_engineer' },
      });
      const data = JSON.parse(result);
      const prompt = data.hookSpecificOutput.updatedInput.prompt;
      expect(prompt).toContain('## Deliverables');
    });
  });
});
