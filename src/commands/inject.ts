import * as fs from 'node:fs';
import { loadCatalogIndex } from '../utils/catalog-index.js';
import { recordDispatch, loadHistory } from '../utils/history.js';
import type { AgentDefinition } from '../core/types.js';

// Claude Code built-in subagent types — do NOT inject persona for these
const BUILTIN_SUBAGENT_TYPES = new Set([
  'Explore', 'Plan', 'general-purpose',
  'statusline-setup', 'claude-code-guide',
]);

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was',
  'will', 'can', 'has', 'have', 'been', 'into', 'not', 'but', 'also',
  'just', 'than', 'then', 'when', 'what', 'how', 'all', 'each',
  'about', 'would', 'make', 'like', 'use', 'using', 'used',
  'create', 'build', 'implement', 'add', 'write', 'update', 'fix',
  'should', 'need', 'want', 'please', 'help', 'code', 'file', 'new',
]);

// Synonym map: keyword → expanded terms for better fuzzy matching
const SYNONYMS: Record<string, string[]> = {
  test: ['testing', 'qa', 'test', 'spec', 'jest', 'vitest', 'playwright'],
  tests: ['testing', 'qa', 'test', 'spec'],
  testing: ['test', 'qa', 'spec'],
  frontend: ['react', 'vue', 'angular', 'ui', 'css', 'frontend'],
  react: ['frontend', 'ui', 'jsx', 'tsx'],
  vue: ['frontend', 'ui'],
  backend: ['api', 'server', 'database', 'backend', 'rest', 'graphql'],
  api: ['backend', 'rest', 'server', 'endpoint'],
  database: ['backend', 'sql', 'postgres', 'mongodb'],
  security: ['audit', 'vulnerability', 'auth', 'security'],
  auth: ['security', 'authentication', 'authorization'],
  devops: ['deploy', 'ci', 'cd', 'docker', 'kubernetes', 'devops', 'sre'],
  deploy: ['devops', 'ci', 'cd'],
  docker: ['devops', 'container', 'kubernetes'],
  design: ['ui', 'ux', 'figma', 'design', 'layout'],
  ux: ['design', 'usability', 'user', 'research'],
  docs: ['documentation', 'readme', 'technical', 'writer'],
  documentation: ['docs', 'writer', 'technical'],
  mobile: ['ios', 'android', 'react-native', 'flutter'],
  game: ['unity', 'unreal', 'godot', 'gamedev'],
  ai: ['ml', 'machine', 'learning', 'model', 'neural'],
  ml: ['ai', 'machine', 'learning', 'model'],
  marketing: ['seo', 'content', 'social', 'brand'],
  seo: ['marketing', 'search', 'optimization'],
  stripe: ['payment', 'billing', 'checkout'],
  payment: ['stripe', 'billing', 'checkout'],
  refactor: ['refactoring', 'cleanup', 'restructure'],
  performance: ['optimization', 'speed', 'benchmark', 'profiling'],
  landing: ['frontend', 'ui', 'page', 'marketing'],
  dashboard: ['frontend', 'ui', 'charts', 'analytics'],
  charts: ['frontend', 'dashboard', 'visualization', 'data'],
};

function extractKeywords(text: string): string[] {
  const raw = text
    .toLowerCase()
    .split(/[\s,./:()\[\]{}"'`]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Expand with synonyms
  const expanded = new Set(raw);
  for (const word of raw) {
    const syns = SYNONYMS[word];
    if (syns) {
      for (const syn of syns) expanded.add(syn);
    }
  }

  return [...expanded];
}

function formatPersona(agent: AgentDefinition): string {
  const lines: string[] = ['<AGENTCROW_PERSONA>'];

  lines.push(`You are ${agent.name} — ${agent.description}`);
  lines.push('');

  if (agent.identity.personality) {
    lines.push('## Identity');
    lines.push(agent.identity.personality);
    lines.push('');
  }

  if (agent.identity.communication) {
    lines.push('## Communication Style');
    lines.push(agent.identity.communication);
    lines.push('');
  }

  if (agent.identity.thinking) {
    lines.push('## Thinking Approach');
    lines.push(agent.identity.thinking);
    lines.push('');
  }

  if (agent.critical_rules.must.length > 0) {
    lines.push('## MUST');
    for (const rule of agent.critical_rules.must) {
      lines.push(`- ${rule}`);
    }
    lines.push('');
  }

  if (agent.critical_rules.must_not.length > 0) {
    lines.push('## MUST NOT');
    for (const rule of agent.critical_rules.must_not) {
      lines.push(`- ${rule}`);
    }
    lines.push('');
  }

  if (agent.deliverables.length > 0) {
    lines.push('## Deliverables');
    for (const d of agent.deliverables) {
      lines.push(`- ${d}`);
    }
    lines.push('');
  }

  lines.push('</AGENTCROW_PERSONA>');
  return lines.join('\n');
}

export async function cmdInject(): Promise<void> {
  // Read hook input from stdin
  let rawInput = '';
  try {
    rawInput = fs.readFileSync('/dev/stdin', 'utf-8');
  } catch {
    return; // No stdin, exit silently
  }

  let hookInput: {
    tool_name?: string;
    tool_input?: {
      prompt?: string;
      name?: string;
      subagent_type?: string;
      description?: string;
    };
  };

  try {
    hookInput = JSON.parse(rawInput);
  } catch {
    return; // Invalid JSON, passthrough
  }

  // Only process Agent tool calls
  if (hookInput.tool_name !== 'Agent') return;

  const toolInput = hookInput.tool_input;
  if (!toolInput?.prompt) return;

  // Skip Claude Code built-in subagent types (unless name explicitly matches an agent)
  if (toolInput.subagent_type && BUILTIN_SUBAGENT_TYPES.has(toolInput.subagent_type) && !toolInput.name) {
    return;
  }

  // Load pre-built catalog index
  const index = loadCatalogIndex();
  if (!index) return;

  let matchedAgent: AgentDefinition | null = null;
  let matchType: 'exact' | 'fuzzy' | 'none' = 'none';

  // Strategy 1: Exact match by name
  if (toolInput.name) {
    const normalized = toolInput.name.toLowerCase().replace(/[-\s]/g, '_');
    if (index.agents[normalized]) {
      matchedAgent = index.agents[normalized];
      matchType = 'exact';
    }
  }

  // Strategy 2: Exact match by subagent_type (if it looks like a role name)
  if (!matchedAgent && toolInput.subagent_type && !BUILTIN_SUBAGENT_TYPES.has(toolInput.subagent_type)) {
    const normalized = toolInput.subagent_type.toLowerCase().replace(/[-\s]/g, '_');
    if (index.agents[normalized]) {
      matchedAgent = index.agents[normalized];
      matchType = 'exact';
    }
  }

  // Strategy 3: Keyword matching from prompt + description (with history learning)
  if (!matchedAgent) {
    const searchText = [toolInput.prompt, toolInput.description ?? '', toolInput.name ?? ''].join(' ');
    const keywords = extractKeywords(searchText);

    // Build history frequency map for learning bonus
    const historyBonus: Record<string, number> = {};
    try {
      const history = loadHistory();
      for (const record of history) {
        if (record.matchType !== 'none' && record.role) {
          historyBonus[record.role] = (historyBonus[record.role] || 0) + 1;
        }
      }
    } catch {
      // history unavailable, no bonus
    }

    if (keywords.length > 0) {
      let bestScore = 0;
      let bestRole = '';

      for (const entry of index.entries) {
        let score = 0;
        for (const kw of keywords) {
          // Tag match
          if (entry.tags.some((t) => t.toLowerCase() === kw)) score += 2;
          else if (entry.tags.some((t) => t.toLowerCase().startsWith(kw) && kw.length >= 3)) score += 1;

          // Role match
          if (entry.role.toLowerCase().includes(kw)) score += 3;
          // Name match
          if (entry.name.toLowerCase().includes(kw)) score += 2;
          // Description match
          if (entry.description.toLowerCase().includes(kw)) score += 1;
        }

        // Builtin bonus
        if (score > 0 && entry.source.type === 'builtin') score += 0.5;

        // History learning bonus: frequently matched agents get a boost
        if (score > 0 && historyBonus[entry.role]) {
          const freq = historyBonus[entry.role];
          score += Math.min(freq * 0.5, 3); // Max +3 from history (6+ uses)
        }

        if (score > bestScore) {
          bestScore = score;
          bestRole = entry.role;
        }
      }

      if (bestScore >= 4 && index.agents[bestRole]) {
        matchedAgent = index.agents[bestRole];
        matchType = 'fuzzy';
      }
    }
  }

  // No match — passthrough (output nothing, exit 0)
  if (!matchedAgent) {
    recordDispatch({
      timestamp: new Date().toISOString(),
      role: toolInput.name ?? 'unknown',
      action: (toolInput.prompt ?? '').slice(0, 100),
      matchType: 'none',
      agentName: null,
      source: 'hook',
    });
    return;
  }

  // Format persona and prepend to original prompt
  const persona = formatPersona(matchedAgent);
  const enhancedPrompt = `${persona}\n\n${toolInput.prompt}`;

  // Record dispatch
  recordDispatch({
    timestamp: new Date().toISOString(),
    role: matchedAgent.role,
    action: (toolInput.prompt ?? '').slice(0, 100),
    matchType,
    agentName: matchedAgent.name,
    source: 'hook',
  });

  // Output hook response with updatedInput
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: {
        ...toolInput,
        prompt: enhancedPrompt,
      },
    },
  };

  process.stdout.write(JSON.stringify(output));
}
