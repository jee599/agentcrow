import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { AgentCatalog } from '../src/core/catalog';

const BUILTIN_DIR = path.resolve('agents/builtin');
const EXTERNAL_DIR = path.resolve('agents/external/agency-agents');
const hasExternal = fs.existsSync(EXTERNAL_DIR) &&
  fs.readdirSync(EXTERNAL_DIR).length > 0;

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

  it('searchByTags: 빈 쿼리는 결과 없음', () => {
    const results = catalog.searchByTags([]);
    expect(results).toHaveLength(0);
  });

  it('searchByTags: 매칭 없는 쿼리는 결과 없음', () => {
    const results = catalog.searchByTags(['zzzznonexistenttag']);
    expect(results).toHaveLength(0);
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

describe('AgentCatalog findByRole builtin priority', () => {
  it('같은 role이면 builtin이 external보다 우선한다', async () => {
    // builtin에 있는 role을 검색하면 항상 builtin을 반환해야 한다
    const catalog = new AgentCatalog(BUILTIN_DIR, EXTERNAL_DIR);
    await catalog.build();

    const agent = catalog.findByRole('korean_tech_writer');
    expect(agent).not.toBeNull();
    expect(agent!.source.type).toBe('builtin');
  });

  it('findByRole은 하이픈과 공백을 언더스코어로 정규화한다', async () => {
    const catalog = new AgentCatalog(BUILTIN_DIR, EXTERNAL_DIR);
    await catalog.build();

    // 하이픈 → 언더스코어 변환
    const agent = catalog.findByRole('korean-tech-writer');
    expect(agent).not.toBeNull();
    expect(agent!.role).toBe('korean_tech_writer');

    // 공백 → 언더스코어 변환
    const agent2 = catalog.findByRole('korean tech writer');
    expect(agent2).not.toBeNull();
    expect(agent2!.role).toBe('korean_tech_writer');
  });
});
