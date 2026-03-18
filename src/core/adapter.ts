import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { AgentDefinition, AgentIdentity, AgentCriticalRules } from './types.js';

export interface Section {
  heading: string;
  level: number;
  content: string;
}

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

function stripEmojis(text: string): string {
  return text.replace(EMOJI_RE, '').trim();
}

export function splitIntoSections(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentHeading = '';
  let currentLevel = 0;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      if (currentHeading || currentLines.length > 0) {
        sections.push({
          heading: stripEmojis(currentHeading),
          level: currentLevel,
          content: currentLines.join('\n').trim(),
        });
      }
      currentLevel = match[1].length;
      currentHeading = match[2];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentHeading || currentLines.length > 0) {
    sections.push({
      heading: stripEmojis(currentHeading),
      level: currentLevel,
      content: currentLines.join('\n').trim(),
    });
  }

  return sections.filter((s) => s.heading !== '');
}

export function extractName(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) {
    throw new Error('No H1 heading found');
  }
  return stripEmojis(match[1]).replace(/\s+agent$/i, '').trim();
}

const DIVISION_PREFIXES = [
  'engineering-',
  'design-',
  'marketing-',
  'product-',
  'testing-',
  'support-',
  'sales-',
  'paid-media-',
  'project-management-',
  'specialized-',
  'game-development-',
  'academic-',
  'strategy-',
  'spatial-computing-',
];

export function inferRoleFromFileName(filePath: string): string {
  let name = basename(filePath, '.md');

  for (const prefix of DIVISION_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }

  return name.replace(/-/g, '_');
}

export function extractBulletItems(content: string): string[] {
  const lines = content.split('\n');
  const items: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s+(.+)$/);
    if (match) {
      const item = match[1].trim();
      if (item.length > 5 && item.length < 500) {
        items.push(item);
      }
    }
  }

  return items;
}

export function extractBoldField(content: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(`\\*\\*${label}\\*\\*:\\s*(.+)`, 'i');
    const match = content.match(re);
    if (match) {
      return match[1].trim();
    }
  }
  return '';
}

export function findSection(sections: Section[], candidates: string[]): Section | null {
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const found = sections.find((s) => s.heading.toLowerCase().includes(lower));
    if (found) return found;
  }
  return null;
}

export function extractIdentity(sections: Section[]): AgentIdentity {
  const section = findSection(sections, ['Identity', 'Memory', 'Identity & Memory']);
  const content = section?.content ?? '';

  return {
    personality: extractBoldField(content, ['Personality']),
    communication: extractBoldField(content, ['Communication', 'Communication Style']),
    thinking: extractBoldField(content, ['Thinking', 'Thinking Style', 'Memory']),
  };
}

export function extractCriticalRules(sections: Section[]): AgentCriticalRules {
  const section = findSection(sections, ['Critical Rules']);
  if (!section) {
    return { must: [], must_not: [] };
  }

  // Get all sections that come after Critical Rules
  const allSections = sections;
  const critIdx = allSections.indexOf(section);

  // Collect content from Critical Rules section and any ### subsections under it
  let fullContent = section.content;
  for (let i = critIdx + 1; i < allSections.length; i++) {
    if (allSections[i].level <= section.level) break;
    fullContent += '\n### ' + allSections[i].heading + '\n' + allSections[i].content;
  }

  const must: string[] = [];
  const mustNot: string[] = [];

  const lines = fullContent.split('\n');
  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (!bulletMatch) continue;
    const item = bulletMatch[1].trim();
    if (item.length <= 5) continue;

    const lower = item.toLowerCase();
    if (lower.startsWith('never ') || lower.startsWith('don\'t ') || lower.startsWith('do not ') || lower.startsWith('avoid ')) {
      mustNot.push(item);
    } else {
      must.push(item);
    }
  }

  return { must, must_not: mustNot };
}

export function extractDeliverables(sections: Section[]): string[] {
  const section = findSection(sections, ['Technical Deliverables', 'Deliverables', 'Core Mission']);
  if (!section) return [];

  const allSections = sections;
  const idx = allSections.indexOf(section);

  // Collect ### subsection titles under this section
  const titles: string[] = [];
  for (let i = idx + 1; i < allSections.length; i++) {
    if (allSections[i].level <= section.level) break;
    if (allSections[i].level === 3) {
      titles.push(allSections[i].heading);
    }
  }

  if (titles.length > 0) return titles;

  return extractBulletItems(section.content);
}

export function extractSuccessMetrics(sections: Section[]): string[] {
  const section = findSection(sections, ['Success Metrics', 'Metrics']);
  if (!section) return [];
  return extractBulletItems(section.content);
}

export function extractDescription(sections: Section[]): string {
  const section = findSection(sections, ['Core Mission', 'Mission']);
  if (!section) return '';

  // Get first subsection content or section content
  const allSections = sections;
  const idx = allSections.indexOf(section);
  let text = section.content;

  // If section has subsections, use content from first subsection
  for (let i = idx + 1; i < allSections.length; i++) {
    if (allSections[i].level <= section.level) break;
    if (allSections[i].level === 3) {
      text = allSections[i].content;
      break;
    }
  }

  // Get first bullet item or first sentence
  const bullets = extractBulletItems(text);
  if (bullets.length > 0) return bullets[0];

  const sentenceMatch = text.match(/[^.!?]+[.!?]/);
  return sentenceMatch ? sentenceMatch[0].trim() : text.trim().split('\n')[0];
}

const TECH_KEYWORDS_RE = /\b(React|Vue|Angular|TypeScript|Python|Rust|Go|Swift|Kotlin|C\+\+|GAS|Unreal|Unity|Godot|Node\.js|Next\.js|Docker|Kubernetes|AWS|GCP|Azure|PostgreSQL|MongoDB|Redis|GraphQL|REST|gRPC|CI\/CD|Terraform|Ansible|Figma|Tailwind|SCSS|Jest|Vitest|Playwright|Cypress|Storybook)\b/gi;

const KOREAN_DIVISION_MAP: Record<string, string[]> = {
  engineering: ['개발', '엔지니어', '코드', '구현'],
  design: ['디자인', 'UI', 'UX', '시각'],
  'game-development': ['게임', '레벨', '전투', '시스템'],
  marketing: ['마케팅', '콘텐츠', '브랜드', '광고'],
  product: ['제품', '기획', '사용자', '분석'],
  testing: ['테스트', 'QA', '품질', '자동화'],
  support: ['지원', '고객', '서비스', '문의'],
  sales: ['영업', '판매', '제안', '계약'],
  'paid-media': ['광고', '미디어', '캠페인', '예산'],
  'project-management': ['프로젝트', '관리', '일정', '리소스'],
  specialized: ['전문', '특화', '분야', '도메인'],
};

export function extractTags(name: string, role: string, division: string, content: string): string[] {
  const tags = new Set<string>();

  // Role words
  const roleWords = role.split('_').filter((w) => w.length > 2);
  for (const word of roleWords) {
    tags.add(word.toLowerCase());
  }

  // Division
  if (division) {
    tags.add(division.toLowerCase());
  }

  // Name words
  const nameWords = name.split(/\s+/).filter((w) => w.length > 2);
  for (const word of nameWords) {
    tags.add(word.toLowerCase());
  }

  // Tech keywords from content
  const techMatches = content.match(TECH_KEYWORDS_RE);
  if (techMatches) {
    for (const m of techMatches) {
      tags.add(m.toLowerCase());
    }
  }

  // Korean division tags
  const koreanTags = KOREAN_DIVISION_MAP[division];
  if (koreanTags) {
    for (const tag of koreanTags) {
      tags.add(tag);
    }
  }

  return [...tags];
}

export function calculateConfidence(
  identity: AgentIdentity,
  rules: AgentCriticalRules,
  deliverables: string[],
  metrics: string[],
): number {
  let score = 0;

  if (identity.personality.length > 20) score += 1;
  if (identity.communication.length > 10) score += 0.5;
  if (identity.thinking.length > 10) score += 0.5;
  if (rules.must.length > 0) score += 1;
  if (rules.must_not.length > 0) score += 1;
  if (deliverables.length > 0) score += 1;
  if (metrics.length > 0) score += 1;

  return Math.min(score / 5, 1);
}

export function parseAgencyAgentMd(filePath: string, division: string): AgentDefinition | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');

    // Strip frontmatter
    const content = raw.replace(/^---[\s\S]*?---\n*/, '');

    const name = extractName(content);
    const role = inferRoleFromFileName(filePath);
    const sections = splitIntoSections(content);
    const identity = extractIdentity(sections);
    const critical_rules = extractCriticalRules(sections);
    const deliverables = extractDeliverables(sections);
    const success_metrics = extractSuccessMetrics(sections);
    const description = extractDescription(sections);
    const tags = extractTags(name, role, division, content);
    const confidence = calculateConfidence(identity, critical_rules, deliverables, success_metrics);

    return {
      name,
      role,
      description,
      identity,
      critical_rules,
      deliverables,
      success_metrics,
      source: {
        type: 'external',
        repo: 'agency-agents',
        filePath,
        division,
      },
      tags,
      division,
      confidence,
    };
  } catch {
    return null;
  }
}

const EXCLUDED_DIRS = new Set(['scripts', 'integrations', 'examples', '.github', '.git']);
const EXCLUDED_FILES = new Set(['README.md', 'CONTRIBUTING.md', 'LICENSE', 'CHANGELOG.md']);

export function parseAllAgencyAgents(basePath: string): AgentDefinition[] {
  const agents: AgentDefinition[] = [];

  if (!existsSync(basePath)) return agents;

  const entries = readdirSync(basePath);

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry)) continue;

    const dirPath = join(basePath, entry);
    if (!statSync(dirPath).isDirectory()) continue;

    const files = readdirSync(dirPath);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      if (EXCLUDED_FILES.has(file)) continue;

      const filePath = join(dirPath, file);
      const agent = parseAgencyAgentMd(filePath, entry);
      if (agent && (agent.confidence ?? 0) >= 0.3) {
        agents.push(agent);
      }
    }
  }

  return agents;
}
