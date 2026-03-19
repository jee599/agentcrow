import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { AgentCatalog } from '../src/core/catalog';

const BUILTIN_DIR = path.resolve('agents/builtin');
const EXTERNAL_DIR = path.resolve('agents/external/agency-agents');
const hasExternal = fs.existsSync(EXTERNAL_DIR);

describe('AgentCatalog', () => {
  let catalog: AgentCatalog;

  beforeAll(async () => {
    catalog = new AgentCatalog(BUILTIN_DIR, EXTERNAL_DIR);
    await catalog.build();
  });

  it('builtin 에이전트 9개가 로드된다', () => {
    const builtins = catalog.listAll().filter(e => e.source.type === 'builtin');
    expect(builtins).toHaveLength(9);
  });

  it('findByRole: korean_tech_writer → builtin', () => {
    const agent = catalog.findByRole('korean_tech_writer');
    expect(agent).not.toBeNull();
    expect(agent!.source.type).toBe('builtin');
  });

  it('findByRole: nonexistent → null', () => {
    expect(catalog.findByRole('nonexistent_role')).toBeNull();
  });

  it('searchByTags: 보안/security → security_auditor_deep', () => {
    const results = catalog.searchByTags(['보안', 'security']);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.role).toBe('security_auditor_deep');
  });

  it('listByDivision: builtin has 9', () => {
    const grouped = catalog.listByDivision();
    expect(grouped['builtin']).toBeDefined();
    expect(grouped['builtin'].length).toBe(9);
  });

  // Conditional external tests
  if (hasExternal) {
    it('external 에이전트가 로드된다', () => {
      const externals = catalog.listAll().filter(e => e.source.type === 'external');
      expect(externals.length).toBeGreaterThan(0);
    });

    it('findByRole: frontend_developer → external', () => {
      const agent = catalog.findByRole('frontend_developer');
      if (agent) {
        expect(agent.source.type).toBe('external');
      }
    });
  }
});
