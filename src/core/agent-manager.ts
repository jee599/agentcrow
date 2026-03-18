import { AgentCatalog } from './catalog.js';
import type { AgentDefinition, Task } from './types.js';

export class AgentManager {
  private catalog: AgentCatalog;

  constructor(builtinDir: string, externalDir: string) {
    this.catalog = new AgentCatalog(builtinDir, externalDir);
  }

  async initialize(): Promise<void> {
    await this.catalog.build();
  }

  async matchAgent(task: Task): Promise<{
    agent: AgentDefinition | null;
    matchType: 'exact' | 'fuzzy' | 'none';
    candidates?: Array<{ name: string; score: number }>;
  }> {
    // 1. findByRole exact match
    const exactMatch = this.catalog.findByRole(task.role);
    if (exactMatch) {
      return { agent: exactMatch, matchType: 'exact' };
    }

    // 2. extractQueryTags → searchByTags
    const queryTags = this.extractQueryTags(task);
    const results = this.catalog.searchByTags(queryTags);

    if (results.length > 0) {
      const candidates = results.map((r) => ({
        name: r.entry.name,
        score: r.score,
      }));

      if (results[0].score >= 4) {
        const agent = this.catalog.loadAgent(results[0].entry);
        return { agent, matchType: 'fuzzy', candidates };
      }

      // results exist but top score < 4
      return { agent: null, matchType: 'none', candidates };
    }

    // 3. No results
    return { agent: null, matchType: 'none' };
  }

  async createAgent(role: string, _taskDescription: string): Promise<AgentDefinition> {
    throw new Error(`Auto-generation not yet implemented for role: ${role}`);
  }

  listAgents(): Array<{
    division: string;
    agents: Array<{ name: string; role: string; description: string; source: string }>;
  }> {
    const grouped = this.catalog.listByDivision();
    return Object.entries(grouped).map(([division, entries]) => ({
      division,
      agents: entries.map((e) => ({
        name: e.name,
        role: e.role,
        description: e.description,
        source: e.source.type,
      })),
    }));
  }

  private extractQueryTags(task: Task): string[] {
    const tags: string[] = [];
    const stopWords = new Set([
      'specialist', 'manager', 'checker', 'engineer', 'developer',
      'agent', 'handler', 'worker', 'processor', 'the', 'and', 'for',
      'with', 'from', 'that', 'this', 'are', 'was', 'will', 'can',
    ]);

    // From task.role (split _)
    const roleWords = task.role.split('_').filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));
    tags.push(...roleWords);

    // From task.action (words > 2 chars)
    const actionWords = task.action
      .split(/[\s,./]+/)
      .filter((w) => w.length > 2);
    tags.push(...actionWords);

    // From task.file_scope (infer domain)
    if (task.file_scope) {
      for (const scope of task.file_scope) {
        const parts = scope.replace(/\/$/, '').split('/').filter((p) => p.length > 1);
        tags.push(...parts);
      }
    }

    return [...new Set(tags)];
  }
}
