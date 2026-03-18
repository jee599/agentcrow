import { AgentManager } from '../core/agent-manager.js';
import type { Task } from '../core/types.js';

export interface Agent {
  name: string;
  role: string;
  description: string;
  source: 'external' | 'builtin' | 'generated';
  tags: string[];
}

export interface Division {
  name: string;
  label: string;
  agents: Agent[];
}

export interface AgentsResponse {
  divisions: Division[];
  total: number;
}

export interface MatchResult {
  agent: Agent | null;
  matchType: 'exact' | 'fuzzy' | 'none';
  candidates?: Array<{ name: string; score: number }>;
}

const DIVISION_LABELS: Record<string, string> = {
  builtin: '커스텀 에이전트',
  engineering: 'Engineering Division',
  design: 'Design Division',
  'game-development': 'Game Development Division',
  marketing: 'Marketing Division',
  'paid-media': 'Paid Media Division',
  product: 'Product Division',
  'project-management': 'Project Management Division',
  sales: 'Sales Division',
  'spatial-computing': 'Spatial Computing Division',
  specialized: 'Specialized Division',
  strategy: 'Strategy Division',
  support: 'Support Division',
  testing: 'Testing Division',
  academic: 'Academic Division',
  integrations: 'Integrations Division',
};

function getDivisionLabel(name: string): string {
  if (DIVISION_LABELS[name]) return DIVISION_LABELS[name];

  // Fallback: capitalize and append "Division"
  const label = name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return `${label} Division`;
}

export async function createAgentsHandler(builtinDir: string, externalDir: string) {
  const manager = new AgentManager(builtinDir, externalDir);
  await manager.initialize();

  function listAgents(): AgentsResponse {
    const grouped = manager.listAgents();

    const divisions: Division[] = grouped.map((group) => ({
      name: group.division,
      label: getDivisionLabel(group.division),
      agents: group.agents.map((a) => ({
        name: a.name,
        role: a.role,
        description: a.description,
        source: a.source as 'external' | 'builtin' | 'generated',
        tags: [],
      })),
    }));

    const total = divisions.reduce((sum, d) => sum + d.agents.length, 0);

    return { divisions, total };
  }

  async function matchAgent(role: string, action: string): Promise<MatchResult> {
    const task: Task = {
      id: `api_${Date.now()}`,
      role,
      action,
      depends_on: [],
    };

    const result = await manager.matchAgent(task);

    const agent: Agent | null = result.agent
      ? {
          name: result.agent.name,
          role: result.agent.role,
          description: result.agent.description,
          source: result.agent.source.type as 'external' | 'builtin' | 'generated',
          tags: result.agent.tags,
        }
      : null;

    return {
      agent,
      matchType: result.matchType,
      candidates: result.candidates,
    };
  }

  return { listAgents, matchAgent };
}
