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
  builtin: "커스텀 에이전트",
  engineering: "Engineering Division",
  design: "Design Division",
  "game-development": "Game Development Division",
  marketing: "Marketing Division",
  sales: "Sales Division",
  product: "Product Division",
  "project-management": "Project Management Division",
  testing: "Testing Division",
  support: "Support Division",
  strategy: "Strategy Division",
  specialized: "Specialized Division",
  "paid-media": "Paid Media Division",
  "spatial-computing": "Spatial Computing Division",
  academic: "Academic Division",
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
