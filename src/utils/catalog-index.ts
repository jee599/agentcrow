import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { AgentDefinition, CatalogEntry } from '../core/types.js';
import type { AgentCatalog } from '../core/catalog.js';

const CATALOG_INDEX_PATH = path.join(os.homedir(), '.agentcrow', 'catalog-index.json');

export interface CatalogIndex {
  version: number;
  generatedAt: string;
  entries: CatalogEntry[];
  agents: Record<string, AgentDefinition>;
}

export function buildCatalogIndex(catalog: AgentCatalog): void {
  const entries = catalog.listAll();
  const agents: Record<string, AgentDefinition> = {};

  // Load all agents. Builtin takes priority — load directly from YAML (bypass cache)
  for (const entry of entries) {
    if (entry.source.type === 'builtin') {
      // Direct YAML load to bypass catalog cache (which may have external)
      try {
        const content = fs.readFileSync(entry.filePath, 'utf-8');
        const parsed = yaml.parse(content);
        const agent: AgentDefinition = {
          name: parsed.name ?? '',
          role: parsed.role ?? entry.role,
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
          source: { type: 'builtin', filePath: entry.filePath },
          tags: parsed.tags ?? [],
        };
        agents[entry.role] = agent; // Always overwrite
      } catch {
        // skip malformed YAML
      }
    } else {
      const agent = catalog.loadAgent(entry);
      if (agent && !agents[entry.role]) {
        agents[entry.role] = agent;
      }
    }
  }

  const index: CatalogIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries,
    agents,
  };

  fs.mkdirSync(path.dirname(CATALOG_INDEX_PATH), { recursive: true });
  fs.writeFileSync(CATALOG_INDEX_PATH, JSON.stringify(index), 'utf-8');
}

export function loadCatalogIndex(): CatalogIndex | null {
  if (!fs.existsSync(CATALOG_INDEX_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CATALOG_INDEX_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export { CATALOG_INDEX_PATH };
