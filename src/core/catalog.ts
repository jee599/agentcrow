import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { AgentDefinition, AgentSource, CatalogEntry } from './types.js';
import { parseAllAgencyAgents, parseAgencyAgentMd } from './adapter.js';

export class AgentCatalog {
  private entries: CatalogEntry[] = [];
  private agentCache: Map<string, AgentDefinition> = new Map();

  constructor(private builtinDir: string, private externalDir: string) {}

  async build(): Promise<void> {
    this.entries = [];
    this.agentCache.clear();

    // 1. Load builtin YAML entries
    const builtinEntries = this.loadBuiltinEntries();
    this.entries.push(...builtinEntries);

    // 2. If externalDir exists, parseAllAgencyAgents and add to entries + cache
    if (fs.existsSync(this.externalDir)) {
      const externalAgents = parseAllAgencyAgents(this.externalDir);
      for (const agent of externalAgents) {
        this.agentCache.set(agent.role, agent);
        this.entries.push({
          name: agent.name,
          role: agent.role,
          description: agent.description,
          tags: agent.tags,
          division: agent.division ?? 'external',
          source: agent.source,
          filePath: (agent.source as { filePath: string }).filePath,
        });
      }
      console.log(`[Catalog] Loaded ${externalAgents.length} external agents`);
    } else {
      console.warn(`[Catalog] External directory not found: ${this.externalDir}`);
    }

    console.log(`[Catalog] Loaded ${builtinEntries.length} builtin agents`);
    console.log(`[Catalog] Total: ${this.entries.length} agents`);
  }

  findByRole(role: string): AgentDefinition | null {
    const normalized = role.toLowerCase().replace(/[-\s]/g, '_');

    // Priority: external first, then builtin
    const externalEntry = this.entries.find(
      (e) => e.source.type === 'external' && e.role === normalized,
    );
    if (externalEntry) {
      return this.loadAgent(externalEntry);
    }

    const builtinEntry = this.entries.find(
      (e) => e.source.type === 'builtin' && e.role === normalized,
    );
    if (builtinEntry) {
      return this.loadAgent(builtinEntry);
    }

    return null;
  }

  searchByTags(
    queryTags: string[],
    limit: number = 5,
  ): Array<{ entry: CatalogEntry; score: number }> {
    const normalizedQuery = queryTags.map((t) => t.toLowerCase());

    const scored = this.entries.map((entry) => {
      let score = 0;

      for (const q of normalizedQuery) {
        // exact tag match +2
        if (entry.tags.some((t) => t.toLowerCase() === q)) {
          score += 2;
        }
        // role contains +3
        if (entry.role.toLowerCase().includes(q)) {
          score += 3;
        }
        // name contains +2
        if (entry.name.toLowerCase().includes(q)) {
          score += 2;
        }
        // description contains +1
        if (entry.description.toLowerCase().includes(q)) {
          score += 1;
        }
        // partial tag match +1
        if (
          score === 0 ||
          !entry.tags.some((t) => t.toLowerCase() === q)
        ) {
          if (entry.tags.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))) {
            // Only add partial if no exact match already counted
            if (!entry.tags.some((t) => t.toLowerCase() === q)) {
              score += 1;
            }
          }
        }
      }

      // External source bonus
      if (entry.source.type === 'external') {
        score += 0.1;
      }

      return { entry, score };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  listAll(): CatalogEntry[] {
    return [...this.entries];
  }

  listByDivision(): Record<string, CatalogEntry[]> {
    const grouped: Record<string, CatalogEntry[]> = {};
    for (const entry of this.entries) {
      const key = entry.source.type === 'builtin' ? 'builtin' : entry.division;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
    return grouped;
  }

  loadAgent(entry: CatalogEntry): AgentDefinition | null {
    // Check cache first
    if (this.agentCache.has(entry.role)) {
      return this.agentCache.get(entry.role)!;
    }

    // Load from file based on source type
    if (entry.source.type === 'builtin') {
      const agent = this.loadBuiltinAgent(entry.filePath);
      if (agent) {
        this.agentCache.set(entry.role, agent);
      }
      return agent;
    }

    if (entry.source.type === 'external') {
      const agent = parseAgencyAgentMd(entry.filePath, entry.division);
      if (agent) {
        this.agentCache.set(entry.role, agent);
      }
      return agent;
    }

    return null;
  }

  private loadBuiltinEntries(): CatalogEntry[] {
    const entries: CatalogEntry[] = [];

    if (!fs.existsSync(this.builtinDir)) return entries;

    const files = fs.readdirSync(this.builtinDir).filter((f) => f.endsWith('.yaml'));

    for (const file of files) {
      const filePath = path.join(this.builtinDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = yaml.parse(content);

        entries.push({
          name: parsed.name ?? file.replace('.yaml', ''),
          role: parsed.role ?? file.replace('.yaml', '').replace(/-/g, '_'),
          description: parsed.description ?? '',
          tags: parsed.tags ?? [],
          division: 'builtin',
          source: { type: 'builtin', filePath },
          filePath,
        });
      } catch {
        console.warn(`[Catalog] Failed to parse builtin YAML: ${filePath}`);
      }
    }

    return entries;
  }

  private loadBuiltinAgent(filePath: string): AgentDefinition | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = yaml.parse(content);

      const agent: AgentDefinition = {
        name: parsed.name ?? '',
        role: parsed.role ?? '',
        description: parsed.description ?? '',
        identity: {
          personality: parsed.identity?.personality?.trim() ?? '',
          communication: parsed.identity?.communication?.trim() ?? '',
          thinking: parsed.identity?.thinking?.trim() ?? '',
        },
        critical_rules: {
          must: parsed.critical_rules?.must ?? [],
          must_not: parsed.critical_rules?.must_not ?? [],
        },
        deliverables: parsed.deliverables ?? [],
        success_metrics: parsed.success_metrics ?? [],
        source: { type: 'builtin', filePath },
        tags: parsed.tags ?? [],
      };

      return agent;
    } catch {
      return null;
    }
  }
}
