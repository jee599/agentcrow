#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import * as yaml from "yaml";

const ROOT = resolve(import.meta.dirname, "..");
const BUILTIN_DIR = join(ROOT, "agents", "builtin");
const EXTERNAL_DIR = join(ROOT, "agents", "external", "agency-agents");

// ─── 1. Load all agent roles ───
function loadAgentRoles(): Map<string, { name: string; description: string; prompt: string }> {
  const agents = new Map();

  // Builtin YAML
  if (existsSync(BUILTIN_DIR)) {
    for (const f of readdirSync(BUILTIN_DIR).filter(f => f.endsWith(".yaml"))) {
      const parsed = yaml.parse(readFileSync(join(BUILTIN_DIR, f), "utf-8"));
      agents.set(parsed.role, {
        name: parsed.name,
        description: parsed.description || "",
        prompt: [
          parsed.identity?.personality || "",
          parsed.critical_rules?.must?.length ? `MUST: ${parsed.critical_rules.must.join("; ")}` : "",
          parsed.critical_rules?.must_not?.length ? `MUST NOT: ${parsed.critical_rules.must_not.join("; ")}` : "",
        ].filter(Boolean).join("\n"),
      });
    }
  }

  // External .md (scan top-level only for speed)
  if (existsSync(EXTERNAL_DIR)) {
    const EXCLUDED = new Set(["scripts", "integrations", "examples", ".github", ".git"]);
    for (const div of readdirSync(EXTERNAL_DIR, { withFileTypes: true })) {
      if (!div.isDirectory() || EXCLUDED.has(div.name)) continue;
      walkMd(join(EXTERNAL_DIR, div.name), agents);
    }
  }

  return agents;
}

function walkMd(dir: string, agents: Map<string, any>) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { walkMd(full, agents); continue; }
    if (!entry.name.endsWith(".md") || entry.name === "README.md") continue;

    const prefixes = ["engineering-", "design-", "marketing-", "product-", "testing-", "support-", "sales-", "paid-media-", "project-management-", "specialized-", "game-development-", "academic-", "strategy-", "spatial-computing-"];
    let role = basename(entry.name, ".md");
    for (const p of prefixes) { if (role.startsWith(p)) { role = role.slice(p.length); break; } }
    role = role.replace(/-/g, "_");

    const content = readFileSync(full, "utf-8");
    const nameMatch = content.match(/^#\s+(.+)/m);
    const name = nameMatch ? nameMatch[1].replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim() : role;

    // Extract first paragraph as description
    const missionMatch = content.match(/##[^#]*(?:Core Mission|Mission)[^#]*\n([\s\S]*?)(?=\n##|\n$)/i);
    const desc = missionMatch ? missionMatch[1].trim().split("\n")[0].slice(0, 200) : "";

    agents.set(role, { name, description: desc, prompt: `You are ${name}. ${desc}` });
  }
}

// ─── 2. Smart decompose via claude -p ───
async function decompose(prompt: string): Promise<Array<{ role: string; action: string }>> {
  const allRoles = [...loadAgentRoles().keys()].join(", ");

  const sysPrompt = `You are a task decomposer. Given a user prompt, break it into tasks with agent roles.
Available roles: ${allRoles}
Output ONLY a JSON array: [{"role":"role_name","action":"specific task"}]
2-6 tasks. No explanation.`;

  return new Promise((resolve) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    const proc = spawn("claude", ["-p"], { env: env as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "pipe"] });
    proc.stdin.write(`${sysPrompt}\n\nUser prompt: "${prompt}"\n\nJSON array:`);
    proc.stdin.end();

    let out = "";
    proc.stdout.on("data", (d) => { out += d.toString(); });
    proc.on("close", () => {
      try {
        const match = out.match(/\[[\s\S]*\]/);
        if (match) resolve(JSON.parse(match[0]));
        else resolve([{ role: "frontend_developer", action: prompt }]);
      } catch {
        resolve([{ role: "frontend_developer", action: prompt }]);
      }
    });
  });
}

// ─── 3. Main ───
async function main() {
  const prompt = process.argv.slice(2).join(" ");
  if (!prompt) {
    console.log("Usage: agentcrow <prompt>");
    console.log('Example: agentcrow "React로 투두앱 만들고 테스트해줘"');
    process.exit(1);
  }

  const allAgents = loadAgentRoles();
  console.log(`\x1b[35m🐦 AgentCrow\x1b[0m — ${allAgents.size} agents loaded`);
  console.log(`\x1b[90mDecomposing: "${prompt}"\x1b[0m`);
  console.log();

  // Decompose
  const tasks = await decompose(prompt);

  // Match & build --agents JSON
  const agentsJson: Record<string, { description: string; prompt: string }> = {};
  const taskLines: string[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const agent = allAgents.get(t.role);
    const name = agent?.name || t.role.replace(/_/g, " ");
    const matched = agent ? "\x1b[32m✓\x1b[0m" : "\x1b[33m~\x1b[0m";

    console.log(`  ${matched} \x1b[1m${name}\x1b[0m \x1b[90m(${t.role})\x1b[0m`);
    console.log(`    ${t.action}`);

    if (agent) {
      agentsJson[t.role] = {
        description: agent.description || name,
        prompt: agent.prompt,
      };
    } else {
      agentsJson[t.role] = {
        description: name,
        prompt: `You are a ${name}. Complete the assigned task.`,
      };
    }

    taskLines.push(`${i + 1}. @${t.role} — ${t.action}`);
  }

  console.log();
  console.log(`\x1b[35m${tasks.length} agents matched. Launching Claude...\x1b[0m`);
  console.log();

  // Build system prompt that tells Claude to dispatch agents
  const systemPrompt = `You have a team of ${tasks.length} specialized agents. Execute these tasks in order by dispatching each agent:

${taskLines.join("\n")}

For each task, use the corresponding @agent to dispatch it. Do not do the work yourself — delegate to the agents.
After all agents complete, summarize what was accomplished.`;

  // Launch claude interactive with agents
  const claudePath = process.env.CLAUDE_PATH || "claude";
  const args = [
    "--agents", JSON.stringify(agentsJson),
    "--allowedTools", "Write,Edit,Read,Bash,Glob,Grep,Agent",
    "--append-system-prompt", systemPrompt,
  ];

  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;

  const claude = spawn(claudePath, args, {
    stdio: "inherit",
    env: env as NodeJS.ProcessEnv,
  });

  claude.on("close", (code) => {
    process.exit(code || 0);
  });
}

main().catch(console.error);
