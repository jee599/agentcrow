import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AgentCatalog } from '../core/catalog.js';
import { AgentManager } from '../core/agent-manager.js';
import { GLOBAL_BUILTIN, GLOBAL_EXTERNAL, BUILTIN_DIR, EXTERNAL_DIR, VERSION } from '../utils/constants.js';
import * as fs from 'node:fs';
import { recordDispatch } from '../utils/history.js';

function getAgentDirs(): { bDir: string; eDir: string } {
  const bDir = fs.existsSync(GLOBAL_BUILTIN) ? GLOBAL_BUILTIN : BUILTIN_DIR;
  const eDir = fs.existsSync(GLOBAL_EXTERNAL) ? GLOBAL_EXTERNAL : EXTERNAL_DIR;
  return { bDir, eDir };
}

export async function cmdServe(): Promise<void> {
  const { bDir, eDir } = getAgentDirs();

  // Pre-build catalog
  const catalog = new AgentCatalog(bDir, eDir);
  await catalog.build();
  const manager = new AgentManager(bDir, eDir);
  await manager.initialize();

  const server = new McpServer({
    name: 'agentcrow',
    version: VERSION,
  });

  // Tool 1: agentcrow_match — find best agent for a task
  server.tool(
    'agentcrow_match',
    'Find the best matching agent for a given role and task description. Returns the matched agent definition with identity, rules, and deliverables.',
    {
      role: z.string().describe('The agent role to match (e.g. "frontend_developer", "qa_engineer", "security_auditor")'),
      action: z.string().describe('Description of what the agent should do'),
    },
    async ({ role, action }) => {
      const result = await manager.matchAgent({
        id: 'mcp_match',
        role,
        action,
        depends_on: [],
      });

      // Record dispatch history
      recordDispatch({
        timestamp: new Date().toISOString(),
        role,
        action,
        matchType: result.matchType,
        agentName: result.agent?.name ?? null,
        source: 'mcp',
      });

      if (!result.agent) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              matched: false,
              matchType: result.matchType,
              candidates: result.candidates ?? [],
              suggestion: 'Try a different role name or use agentcrow_search to find available agents.',
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            matched: true,
            matchType: result.matchType,
            agent: {
              name: result.agent.name,
              role: result.agent.role,
              description: result.agent.description,
              identity: result.agent.identity,
              critical_rules: result.agent.critical_rules,
              deliverables: result.agent.deliverables,
              tags: result.agent.tags,
              division: result.agent.division,
            },
            candidates: result.candidates,
          }, null, 2),
        }],
      };
    },
  );

  // Tool 2: agentcrow_search — search agents by keyword
  server.tool(
    'agentcrow_search',
    'Search for agents by keywords. Returns a ranked list of matching agents with scores.',
    {
      query: z.string().describe('Search keywords (space-separated, e.g. "react frontend ui")'),
      limit: z.number().optional().default(10).describe('Max results to return (default: 10)'),
    },
    async ({ query, limit }) => {
      const queryTags = query.split(/[\s,]+/).filter((t) => t.length > 0);
      const results = catalog.searchByTags(queryTags, limit);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            query,
            count: results.length,
            results: results.map(({ entry, score }) => ({
              name: entry.name,
              role: entry.role,
              description: entry.description,
              division: entry.division,
              score,
              source: entry.source.type,
            })),
          }, null, 2),
        }],
      };
    },
  );

  // Tool 3: agentcrow_list — list all agents by division
  server.tool(
    'agentcrow_list',
    'List all available agents grouped by division. Use this to see the full agent catalog.',
    {
      division: z.string().optional().describe('Filter by division name (e.g. "engineering", "design", "builtin"). Omit to list all.'),
    },
    async ({ division }) => {
      const allDivisions = manager.listAgents();

      const filtered = division
        ? allDivisions.filter((d) => d.division.toLowerCase().includes(division.toLowerCase()))
        : allDivisions;

      const totalCount = filtered.reduce((sum, d) => sum + d.agents.length, 0);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalAgents: totalCount,
            divisions: filtered.map((d) => ({
              division: d.division,
              count: d.agents.length,
              agents: d.agents.map((a) => ({
                name: a.name,
                role: a.role,
                description: a.description,
              })),
            })),
          }, null, 2),
        }],
      };
    },
  );

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
