import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const HISTORY_PATH = path.join(os.homedir(), '.agentcrow', 'history.json');

export interface DispatchRecord {
  timestamp: string;
  role: string;
  action: string;
  matchType: 'exact' | 'fuzzy' | 'none';
  agentName: string | null;
  source: 'cli' | 'mcp' | 'hook';
}

export function recordDispatch(record: DispatchRecord): void {
  const history = loadHistory();
  history.push(record);

  // Keep last 1000 records
  const trimmed = history.slice(-1000);

  fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
}

export function loadHistory(): DispatchRecord[] {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

export interface DispatchStats {
  totalDispatches: number;
  uniqueRoles: number;
  topAgents: Array<{ role: string; count: number }>;
  matchTypeBreakdown: { exact: number; fuzzy: number; none: number };
  recentDispatches: DispatchRecord[];
  firstDispatch: string | null;
  lastDispatch: string | null;
}

export function calculateStats(): DispatchStats {
  const history = loadHistory();

  if (history.length === 0) {
    return {
      totalDispatches: 0,
      uniqueRoles: 0,
      topAgents: [],
      matchTypeBreakdown: { exact: 0, fuzzy: 0, none: 0 },
      recentDispatches: [],
      firstDispatch: null,
      lastDispatch: null,
    };
  }

  // Count by role
  const roleCounts: Record<string, number> = {};
  const matchCounts = { exact: 0, fuzzy: 0, none: 0 };

  for (const record of history) {
    const role = record.role;
    roleCounts[role] = (roleCounts[role] || 0) + 1;
    matchCounts[record.matchType]++;
  }

  // Sort by count descending
  const topAgents = Object.entries(roleCounts)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalDispatches: history.length,
    uniqueRoles: Object.keys(roleCounts).length,
    topAgents,
    matchTypeBreakdown: matchCounts,
    recentDispatches: history.slice(-5).reverse(),
    firstDispatch: history[0]?.timestamp ?? null,
    lastDispatch: history[history.length - 1]?.timestamp ?? null,
  };
}
