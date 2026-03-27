import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
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

  for (const entry of entries) {
    const agent = catalog.loadAgent(entry);
    if (agent) {
      agents[entry.role] = agent;
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
