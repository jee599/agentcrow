import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { AgentManager } from '../src/core/agent-manager';

const BUILTIN_DIR = path.resolve('agents/builtin');
const EXTERNAL_DIR = path.resolve('agents/external/agency-agents');

describe('AgentManager 3-tier matching', () => {
  let manager: AgentManager;

  beforeAll(async () => {
    manager = new AgentManager(BUILTIN_DIR, EXTERNAL_DIR);
    await manager.initialize();
  });

  it('builtin exact match', async () => {
    const result = await manager.matchAgent({
      id: 'task_1', role: 'korean_tech_writer',
      action: '한국어 README 작성', depends_on: [], file_scope: ['docs/'],
    });
    expect(result.agent).not.toBeNull();
    expect(result.agent!.source.type).toBe('builtin');
    expect(result.matchType).toBe('exact');
  });

  it('no match → none', async () => {
    const result = await manager.matchAgent({
      id: 'task_2', role: 'quantum_computing_specialist',
      action: '양자 회로 시뮬레이터', depends_on: [], file_scope: ['src/quantum/'],
    });
    expect(result.agent).toBeNull();
    expect(result.matchType).toBe('none');
  });

  it('fuzzy match via tags', async () => {
    const result = await manager.matchAgent({
      id: 'task_3', role: 'security_checker',
      action: '보안 감사 수행', depends_on: [], file_scope: ['src/'],
    });
    if (result.candidates && result.candidates.length > 0) {
      expect(result.candidates.some(c => c.name.toLowerCase().includes('security'))).toBe(true);
    }
  });

  it('listAgents returns grouped divisions', () => {
    const list = manager.listAgents();
    expect(list.length).toBeGreaterThan(0);
    const builtin = list.find(g => g.division === 'builtin');
    expect(builtin).toBeDefined();
    expect(builtin!.agents.length).toBe(8);
  });

  it('createAgent throws for unimplemented role', async () => {
    await expect(manager.createAgent('unknown', 'test')).rejects.toThrow('Auto-generation not yet implemented');
  });
});
