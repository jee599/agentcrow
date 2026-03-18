import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

interface Agent {
  name: string;
  role: string;
  description: string;
  source: "external" | "builtin" | "generated";
  tags: string[];
}

interface Division {
  name: string;
  label: string;
  agents: Agent[];
}

export interface AgentsResponse {
  divisions: Division[];
  total: number;
}

const DIVISION_LABELS: Record<string, string> = {
  builtin: "Custom Agents",
  engineering: "Engineering",
  design: "Design",
  "game-development": "Game Development",
  marketing: "Marketing",
  sales: "Sales",
  product: "Product",
  "project-management": "Project Management",
  testing: "Testing",
  support: "Support",
  strategy: "Strategy",
  specialized: "Specialized",
  "paid-media": "Paid Media",
  "spatial-computing": "Spatial Computing",
  academic: "Academic",
};

let cachedResponse: AgentsResponse | null = null;

function loadBuiltinAgents(builtinDir: string): Agent[] {
  if (!fs.existsSync(builtinDir)) return [];
  return fs
    .readdirSync(builtinDir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => {
      const content = fs.readFileSync(path.join(builtinDir, f), "utf-8");
      const parsed = yaml.parse(content);
      return {
        name: parsed.name ?? f.replace(".yaml", ""),
        role: parsed.role ?? f.replace(".yaml", "").replace(/-/g, "_"),
        description: parsed.description ?? "",
        source: "builtin" as const,
        tags: parsed.tags ?? [],
      };
    });
}

function scanExternalAgents(externalDir: string): Division[] {
  if (!fs.existsSync(externalDir)) return [];
  const EXCLUDED = new Set([
    "scripts",
    "integrations",
    "examples",
    ".github",
    ".git",
  ]);
  const divisions: Division[] = [];

  const dirs = fs.readdirSync(externalDir, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory() || EXCLUDED.has(dir.name)) continue;

    const agents: Agent[] = [];
    const divPath = path.join(externalDir, dir.name);

    function walk(dirPath: string) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (
          entry.name.endsWith(".md") &&
          !["README.md", "CONTRIBUTING.md", "LICENSE", "CHANGELOG.md"].includes(
            entry.name
          )
        ) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const nameMatch = content.match(/^#\s+(.+)/m);
          const name = nameMatch
            ? nameMatch[1]
                .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
                .trim()
            : entry.name.replace(".md", "");
          const role = entry.name
            .replace(".md", "")
            .replace(
              /^(engineering|design|marketing|product|testing|support|sales|paid-media|project-management|specialized|game-development|academic|strategy|spatial-computing)-/,
              ""
            )
            .replace(/-/g, "_");

          agents.push({
            name,
            role,
            description: "",
            source: "external",
            tags: [],
          });
        }
      }
    }

    walk(divPath);

    if (agents.length > 0) {
      divisions.push({
        name: dir.name,
        label: DIVISION_LABELS[dir.name] || `${dir.name} Division`,
        agents,
      });
    }
  }

  return divisions;
}

export function getAgentsResponse(): AgentsResponse {
  if (cachedResponse) return cachedResponse;

  const builtinDir = path.resolve(process.cwd(), "..", "agents", "builtin");
  const externalDir = path.resolve(
    process.cwd(),
    "..",
    "agents",
    "external",
    "agency-agents"
  );

  const builtinAgents = loadBuiltinAgents(builtinDir);
  const externalDivisions = scanExternalAgents(externalDir);

  const divisions: Division[] = [
    {
      name: "builtin",
      label: DIVISION_LABELS["builtin"],
      agents: builtinAgents,
    },
    ...externalDivisions,
  ];

  const total = divisions.reduce((sum, d) => sum + d.agents.length, 0);
  cachedResponse = { divisions, total };
  return cachedResponse;
}

interface MatchResult {
  agent: { name: string; role: string; source: { type: string }; description: string } | null;
  matchType: "exact" | "fuzzy" | "none";
  candidates?: Array<{ name: string; score: number }>;
}

export async function matchAgent(role: string, action: string): Promise<MatchResult> {
  const data = getAgentsResponse();

  // Exact match by role
  for (const div of data.divisions) {
    const found = div.agents.find((a) => a.role === role);
    if (found) {
      return {
        agent: { name: found.name, role: found.role, source: { type: found.source }, description: found.description },
        matchType: "exact",
      };
    }
  }

  // Fuzzy match by keywords in role/action
  const queryWords = [...role.split("_"), ...action.split(/\s+/)].filter((w) => w.length > 2).map((w) => w.toLowerCase());
  const scored: Array<{ agent: Agent; division: string; score: number }> = [];

  for (const div of data.divisions) {
    for (const agent of div.agents) {
      let score = 0;
      for (const q of queryWords) {
        if (agent.role.includes(q)) score += 3;
        if (agent.name.toLowerCase().includes(q)) score += 2;
        if (agent.tags.some((t) => t.toLowerCase().includes(q))) score += 1;
      }
      if (score > 0) scored.push({ agent, division: div.name, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 5).map((s) => ({ name: s.agent.name, score: s.score }));

  if (scored.length > 0 && scored[0].score >= 4) {
    const top = scored[0].agent;
    return {
      agent: { name: top.name, role: top.role, source: { type: top.source }, description: top.description },
      matchType: "fuzzy",
      candidates,
    };
  }

  return { agent: null, matchType: "none", candidates };
}
