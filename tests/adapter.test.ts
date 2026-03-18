import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  splitIntoSections,
  extractName,
  inferRoleFromFileName,
  extractBulletItems,
  extractBoldField,
  findSection,
  extractIdentity,
  extractCriticalRules,
  extractDeliverables,
  extractSuccessMetrics,
  extractDescription,
  extractTags,
  calculateConfidence,
  parseAgencyAgentMd,
  parseAllAgencyAgents,
} from '../src/core/adapter.js';

const SAMPLE_MD = `# 🤖 AI Engineer Agent

You are an **AI Engineer**, an expert AI/ML engineer.

## 🧠 Your Identity & Memory
- **Role**: AI/ML engineer and intelligent systems architect
- **Personality**: Data-driven, systematic, performance-focused, ethically-conscious
- **Communication**: Clear, precise, data-backed communication style
- **Thinking**: Analytical problem-solving with focus on scalability

## 🎯 Your Core Mission

### Intelligent System Development
- Build machine learning models for practical business applications
- Implement AI-powered features and intelligent automation systems
- Develop data pipelines and MLOps infrastructure

### Production AI Integration
- Deploy models to production with proper monitoring
- Implement real-time inference APIs and batch processing

## 🚨 Critical Rules You Must Follow

### Safety Standards
- Always implement bias testing across demographic groups
- Ensure model transparency and interpretability
- Never deploy without proper monitoring in place
- Never skip bias detection tests

## 📋 Your Core Capabilities
- **ML Frameworks**: TensorFlow, PyTorch, Scikit-learn
- **Languages**: Python, TypeScript, Rust

## 🎯 Your Success Metrics

You're successful when:
- Model accuracy meets business requirements (typically 85%+)
- Inference latency < 100ms for real-time applications
- Model serving uptime > 99.5% with proper error handling
- Data processing pipeline efficiency optimized
`;

describe('splitIntoSections', () => {
  it('## 헤딩으로 분리한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    expect(sections.length).toBeGreaterThan(0);
    const headings = sections.map((s) => s.heading);
    expect(headings).toContain('Your Identity & Memory');
    expect(headings).toContain('Your Core Mission');
  });

  it('### 헤딩으로 분리한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const h3 = sections.filter((s) => s.level === 3);
    expect(h3.length).toBeGreaterThan(0);
    expect(h3.some((s) => s.heading === 'Intelligent System Development')).toBe(true);
  });

  it('이모지를 제거한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    for (const s of sections) {
      expect(s.heading).not.toMatch(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
    }
  });
});

describe('extractName', () => {
  it('H1에서 이름을 추출한다', () => {
    expect(extractName(SAMPLE_MD)).toBe('AI Engineer');
  });

  it('이모지를 제거한다', () => {
    const name = extractName('# 🚀 Super Agent\nSome text');
    expect(name).toBe('Super');
  });

  it('H1이 없으면 에러를 던진다', () => {
    expect(() => extractName('## No H1 here')).toThrow('No H1 heading found');
  });
});

describe('inferRoleFromFileName', () => {
  it('division prefix를 제거하고 snake_case로 변환한다', () => {
    expect(inferRoleFromFileName('engineering-ai-data-engineer.md')).toBe('ai_data_engineer');
  });

  it('design prefix를 제거한다', () => {
    expect(inferRoleFromFileName('design-ui-architect.md')).toBe('ui_architect');
  });

  it('game-development prefix를 제거한다', () => {
    expect(inferRoleFromFileName('game-development-level-designer.md')).toBe('level_designer');
  });

  it('prefix가 없으면 그대로 snake_case 변환한다', () => {
    expect(inferRoleFromFileName('some-random-agent.md')).toBe('some_random_agent');
  });
});

describe('extractBulletItems', () => {
  it('불릿 아이템을 추출한다', () => {
    const text = '- First item here\n- Second item here\n* Third item here';
    const items = extractBulletItems(text);
    expect(items).toHaveLength(3);
    expect(items[0]).toBe('First item here');
  });

  it('짧은 아이템을 필터링한다', () => {
    const text = '- OK\n- This is a valid item';
    const items = extractBulletItems(text);
    expect(items).toHaveLength(1);
    expect(items[0]).toBe('This is a valid item');
  });
});

describe('extractBoldField', () => {
  it('볼드 필드 값을 추출한다', () => {
    const text = '- **Personality**: Data-driven, systematic\n- **Role**: Engineer';
    expect(extractBoldField(text, ['Personality'])).toBe('Data-driven, systematic');
  });

  it('레이블이 없으면 빈 문자열을 반환한다', () => {
    expect(extractBoldField('No bold here', ['Missing'])).toBe('');
  });

  it('여러 레이블 후보를 시도한다', () => {
    const text = '- **Thinking**: Analytical';
    expect(extractBoldField(text, ['Mind', 'Thinking'])).toBe('Analytical');
  });
});

describe('findSection', () => {
  const sections = splitIntoSections(SAMPLE_MD);

  it('대소문자 무시하고 부분 매칭한다', () => {
    const found = findSection(sections, ['identity']);
    expect(found).not.toBeNull();
    expect(found!.heading).toContain('Identity');
  });

  it('매칭이 없으면 null을 반환한다', () => {
    expect(findSection(sections, ['nonexistent'])).toBeNull();
  });
});

describe('extractIdentity', () => {
  it('Identity 섹션에서 personality/communication/thinking을 추출한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const identity = extractIdentity(sections);
    expect(identity.personality).toContain('Data-driven');
    expect(identity.communication).toContain('Clear');
    expect(identity.thinking).toContain('Analytical');
  });
});

describe('extractCriticalRules', () => {
  it('ALWAYS/NEVER 규칙을 분리한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const rules = extractCriticalRules(sections);
    expect(rules.must.length).toBeGreaterThan(0);
    expect(rules.must_not.length).toBeGreaterThan(0);
    expect(rules.must.some((r) => r.includes('bias testing'))).toBe(true);
    expect(rules.must_not.some((r) => r.toLowerCase().includes('never'))).toBe(true);
  });
});

describe('extractDeliverables', () => {
  it('Core Mission 하위 ### 제목을 추출한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const deliverables = extractDeliverables(sections);
    expect(deliverables).toContain('Intelligent System Development');
    expect(deliverables).toContain('Production AI Integration');
  });
});

describe('extractSuccessMetrics', () => {
  it('Success Metrics 불릿 아이템을 추출한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const metrics = extractSuccessMetrics(sections);
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.some((m) => m.includes('accuracy'))).toBe(true);
  });
});

describe('extractDescription', () => {
  it('Core Mission에서 첫 번째 문장을 추출한다', () => {
    const sections = splitIntoSections(SAMPLE_MD);
    const desc = extractDescription(sections);
    expect(desc.length).toBeGreaterThan(0);
    expect(desc).toContain('machine learning models');
  });
});

describe('extractTags', () => {
  it('role, division, name, tech keyword에서 태그를 추출한다', () => {
    const tags = extractTags('AI Engineer', 'ai_engineer', 'engineering', SAMPLE_MD);
    expect(tags).toContain('engineer');
    expect(tags).toContain('engineering');
    expect(tags).toContain('python');
    expect(tags).toContain('typescript');
    expect(tags).toContain('rust');
    // Korean tags
    expect(tags).toContain('개발');
  });
});

describe('calculateConfidence', () => {
  it('정보가 풍부하면 높은 점수를 반환한다', () => {
    const score = calculateConfidence(
      { personality: 'Data-driven, systematic, focused', communication: 'Clear and precise', thinking: 'Analytical problem solver' },
      { must: ['Rule 1'], must_not: ['Anti 1'] },
      ['Deliverable 1'],
      ['Metric 1'],
    );
    expect(score).toBeGreaterThanOrEqual(0.8);
  });

  it('정보가 없으면 0을 반환한다', () => {
    const score = calculateConfidence(
      { personality: '', communication: '', thinking: '' },
      { must: [], must_not: [] },
      [],
      [],
    );
    expect(score).toBe(0);
  });
});

const AGENCY_AGENTS_PATH = join(process.cwd(), 'agents/external/agency-agents');
const hasSubmodule = existsSync(AGENCY_AGENTS_PATH);

describe.skipIf(!hasSubmodule)('parseAgencyAgentMd (real file)', () => {
  it('실제 .md 파일을 AgentDefinition으로 파싱한다', () => {
    const filePath = join(AGENCY_AGENTS_PATH, 'engineering', 'engineering-ai-engineer.md');
    const agent = parseAgencyAgentMd(filePath, 'engineering');
    expect(agent).not.toBeNull();
    expect(agent!.name).toContain('AI Engineer');
    expect(agent!.role).toBe('ai_engineer');
    expect(agent!.division).toBe('engineering');
    expect(agent!.source.type).toBe('external');
    expect(agent!.tags.length).toBeGreaterThan(0);
    expect(agent!.confidence).toBeGreaterThan(0);
  });
});

describe.skipIf(!hasSubmodule)('parseAllAgencyAgents (real scan)', () => {
  it('모든 에이전트를 파싱하고 confidence >= 0.3 필터링한다', () => {
    const agents = parseAllAgencyAgents(AGENCY_AGENTS_PATH);
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent.confidence).toBeGreaterThanOrEqual(0.3);
      expect(agent.name).toBeTruthy();
      expect(agent.role).toBeTruthy();
    }
  });
});
