import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { createAgentsHandler } from '../src/server/api';
import type { AgentsResponse } from '../src/server/api';

const BUILTIN_DIR = path.resolve('agents/builtin');
const EXTERNAL_DIR = path.resolve('agents/external/agency-agents');

describe('createAgentsHandler', () => {
  let handler: Awaited<ReturnType<typeof createAgentsHandler>>;
  let response: AgentsResponse;

  beforeAll(async () => {
    handler = await createAgentsHandler(BUILTIN_DIR, EXTERNAL_DIR);
    response = handler.listAgents();
  });

  it('listAgents returns divisions array with builtin having 8 agents', () => {
    const builtin = response.divisions.find((d) => d.name === 'builtin');
    expect(builtin).toBeDefined();
    expect(builtin!.agents.length).toBe(8);
  });

  it('each division has a label', () => {
    for (const division of response.divisions) {
      expect(division.label).toBeTruthy();
      expect(typeof division.label).toBe('string');
    }
  });

  it('each agent has a valid source type', () => {
    const validSources = ['external', 'builtin', 'generated'];
    for (const division of response.divisions) {
      for (const agent of division.agents) {
        expect(validSources).toContain(agent.source);
      }
    }
  });

  it('matchAgent returns result for korean_tech_writer', async () => {
    const result = await handler.matchAgent('korean_tech_writer', '한국어 기술 문서 작성');
    expect(result.agent).not.toBeNull();
    expect(result.agent!.role).toBe('korean_tech_writer');
    expect(result.matchType).toBe('exact');
  });

  it('total count is correct', () => {
    const counted = response.divisions.reduce((sum, d) => sum + d.agents.length, 0);
    expect(response.total).toBe(counted);
  });
});
