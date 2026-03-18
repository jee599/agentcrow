# SpoonCompose Remaining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 명세서 §9 assembler.ts, §10 대시보드(API + UI), §14 에러 핸들링을 구현하여 SpoonCompose 에이전트 시스템을 완성한다.

**Architecture:** assembler.ts는 AgentDefinition을 받아 실행용 프롬프트를 조립한다. 대시보드는 Next.js App Router로 구현하며, /api/agents REST 엔드포인트 + 에이전트 라이브러리 UI + 매칭 패널을 포함한다. 에러 핸들링은 catalog.build()의 graceful degradation을 보장한다.

**Tech Stack:** TypeScript, Next.js (App Router), React, Tailwind CSS, Vitest

---

## File Structure

```
spoon-compose/
├── src/
│   ├── core/
│   │   ├── assembler.ts          ← [신규] 프롬프트 조립
│   │   └── (기존 4파일 유지)
│   └── server/
│       └── api.ts                ← [신규] API 핸들러
├── dashboard/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              ← 메인 대시보드
│   │   ├── globals.css
│   │   ├── agents/
│   │   │   └── page.tsx          ← 에이전트 라이브러리
│   │   └── api/
│   │       └── agents/
│   │           └── route.ts      ← GET /api/agents
│   └── components/
│       ├── AgentMatchPanel.tsx
│       └── AgentLibrary.tsx
├── tests/
│   ├── assembler.test.ts
│   └── api.test.ts
```

---

### Task 1: assembler.ts — 프롬프트 조립

**Files:**
- Create: `src/core/assembler.ts`
- Test: `tests/assembler.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/assembler.test.ts
import { describe, it, expect } from 'vitest';
import { assembleAgentPrompt, assembleTeamPrompt } from '../src/core/assembler';
import type { AgentDefinition } from '../src/core/types';

const mockAgent: AgentDefinition = {
  name: 'Test Agent',
  role: 'test_agent',
  description: 'Test agent for unit tests',
  identity: {
    personality: 'Precise and methodical',
    communication: 'Direct and clear',
    thinking: 'Step by step analysis',
  },
  critical_rules: {
    must: ['Always validate input', 'Write tests first'],
    must_not: ['Skip error handling', 'Use any type'],
  },
  deliverables: ['Clean code', 'Test suite'],
  success_metrics: ['100% test pass', 'Zero lint errors'],
  source: { type: 'builtin', filePath: '/path/test.yaml' },
  tags: ['test'],
};

describe('assembleAgentPrompt', () => {
  it('AgentDefinition으로 실행용 프롬프트를 조립한다', () => {
    const prompt = assembleAgentPrompt(mockAgent, 'Fix the login bug');
    expect(prompt).toContain('Test Agent');
    expect(prompt).toContain('Precise and methodical');
    expect(prompt).toContain('Always validate input');
    expect(prompt).toContain('Skip error handling');
    expect(prompt).toContain('Fix the login bug');
  });

  it('source 타입에 관계없이 동일한 프롬프트를 생성한다', () => {
    const externalAgent = {
      ...mockAgent,
      source: { type: 'external' as const, repo: 'agency-agents' as const, filePath: '/path', division: 'engineering' },
    };
    const builtinPrompt = assembleAgentPrompt(mockAgent, 'task');
    const externalPrompt = assembleAgentPrompt(externalAgent, 'task');
    // source 정보 외에는 동일 구조
    expect(builtinPrompt.includes('[Identity]')).toBe(externalPrompt.includes('[Identity]'));
  });
});

describe('assembleTeamPrompt', () => {
  it('여러 에이전트를 하나의 팀 프롬프트로 조립한다', () => {
    const tasks = [
      { agent: mockAgent, task: { id: 't1', role: 'test_agent', action: 'Write tests', depends_on: [] } },
      { agent: { ...mockAgent, name: 'Agent B', role: 'agent_b' }, task: { id: 't2', role: 'agent_b', action: 'Review code', depends_on: ['t1'] } },
    ];
    const result = assembleTeamPrompt(tasks, 'Fix login system');
    expect(result.prompt).toContain('Test Agent');
    expect(result.prompt).toContain('Agent B');
    expect(result.prompt).toContain('Fix login system');
    expect(result.agentCount).toBe(2);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run tests/assembler.test.ts`

- [ ] **Step 3: assembler.ts 구현**

```typescript
// src/core/assembler.ts
import type { AgentDefinition, Task } from './types.js';

interface TaskWithAgent {
  agent: AgentDefinition;
  task: Task;
}

interface AssemblyResult {
  prompt: string;
  agentCount: number;
  tokenEstimate: number;
}

export function assembleAgentPrompt(agent: AgentDefinition, taskAction: string): string {
  const sections: string[] = [];

  sections.push(`# ${agent.name}`);
  sections.push(`> ${agent.description}`);
  sections.push('');

  // Identity
  sections.push('[Identity]');
  if (agent.identity.personality) sections.push(`Personality: ${agent.identity.personality}`);
  if (agent.identity.communication) sections.push(`Communication: ${agent.identity.communication}`);
  if (agent.identity.thinking) sections.push(`Thinking: ${agent.identity.thinking}`);
  sections.push('');

  // Critical Rules
  if (agent.critical_rules.must.length > 0) {
    sections.push('[MUST]');
    for (const rule of agent.critical_rules.must) {
      sections.push(`- ${rule}`);
    }
    sections.push('');
  }

  if (agent.critical_rules.must_not.length > 0) {
    sections.push('[MUST NOT]');
    for (const rule of agent.critical_rules.must_not) {
      sections.push(`- ${rule}`);
    }
    sections.push('');
  }

  // Deliverables
  if (agent.deliverables.length > 0) {
    sections.push('[Deliverables]');
    for (const d of agent.deliverables) {
      sections.push(`- ${d}`);
    }
    sections.push('');
  }

  // Success Metrics
  if (agent.success_metrics.length > 0) {
    sections.push('[Success Metrics]');
    for (const m of agent.success_metrics) {
      sections.push(`- ${m}`);
    }
    sections.push('');
  }

  // Task
  sections.push('[Task]');
  sections.push(taskAction);

  return sections.join('\n');
}

export function assembleTeamPrompt(
  tasks: TaskWithAgent[],
  projectContext: string,
): AssemblyResult {
  const sections: string[] = [];

  sections.push('# Agent Team Execution Plan');
  sections.push('');
  sections.push(`## Project Context`);
  sections.push(projectContext);
  sections.push('');

  sections.push(`## Team (${tasks.length} agents)`);
  sections.push('');

  for (const { agent, task } of tasks) {
    sections.push(`### ${task.id}: ${agent.name} (${agent.role})`);
    sections.push(`Action: ${task.action}`);
    if (task.depends_on.length > 0) {
      sections.push(`Depends on: ${task.depends_on.join(', ')}`);
    }
    if (task.file_scope && task.file_scope.length > 0) {
      sections.push(`File scope: ${task.file_scope.join(', ')}`);
    }
    sections.push('');
    sections.push(assembleAgentPrompt(agent, task.action));
    sections.push('');
    sections.push('---');
    sections.push('');
  }

  const prompt = sections.join('\n');

  return {
    prompt,
    agentCount: tasks.length,
    tokenEstimate: Math.ceil(prompt.length / 4),
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run tests/assembler.test.ts`

- [ ] **Step 5: 커밋**

```bash
git add src/core/assembler.ts tests/assembler.test.ts
git commit -m "feat: add assembler.ts — prompt assembly for agents and teams"
```

---

### Task 2: src/server/api.ts — API 핸들러

**Files:**
- Create: `src/server/api.ts`
- Test: `tests/api.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/api.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { createAgentsHandler } from '../src/server/api';

const BUILTIN_DIR = path.resolve('agents/builtin');
const EXTERNAL_DIR = path.resolve('agents/external/agency-agents');

describe('createAgentsHandler', () => {
  let handler: Awaited<ReturnType<typeof createAgentsHandler>>;

  beforeAll(async () => {
    handler = await createAgentsHandler(BUILTIN_DIR, EXTERNAL_DIR);
  });

  it('listAgents가 divisions 배열을 반환한다', () => {
    const result = handler.listAgents();
    expect(result.divisions).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
    const builtin = result.divisions.find(d => d.name === 'builtin');
    expect(builtin).toBeDefined();
    expect(builtin!.agents.length).toBe(8);
  });

  it('각 division에 label이 있다', () => {
    const result = handler.listAgents();
    for (const div of result.divisions) {
      expect(div.label).toBeTruthy();
    }
  });

  it('각 agent에 source 타입이 있다', () => {
    const result = handler.listAgents();
    for (const div of result.divisions) {
      for (const agent of div.agents) {
        expect(['external', 'builtin', 'generated']).toContain(agent.source);
      }
    }
  });

  it('matchAgent가 매칭 결과를 반환한다', async () => {
    const result = await handler.matchAgent('korean_tech_writer', '한국어 문서 작성');
    expect(result.agent).not.toBeNull();
    expect(result.matchType).toBe('exact');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

- [ ] **Step 3: api.ts 구현**

```typescript
// src/server/api.ts
import { AgentManager } from '../core/agent-manager.js';

interface AgentsResponse {
  divisions: Array<{
    name: string;
    label: string;
    agents: Array<{
      name: string;
      role: string;
      description: string;
      source: 'external' | 'builtin' | 'generated';
      tags: string[];
    }>;
  }>;
  total: number;
}

const DIVISION_LABELS: Record<string, string> = {
  builtin: '커스텀 에이전트',
  engineering: 'Engineering Division',
  design: 'Design Division',
  'game-development': 'Game Development Division',
  marketing: 'Marketing Division',
  sales: 'Sales Division',
  product: 'Product Division',
  'project-management': 'Project Management Division',
  testing: 'Testing Division',
  support: 'Support Division',
  strategy: 'Strategy Division',
  specialized: 'Specialized Division',
  'paid-media': 'Paid Media Division',
  'spatial-computing': 'Spatial Computing Division',
  academic: 'Academic Division',
};

export async function createAgentsHandler(builtinDir: string, externalDir: string) {
  const manager = new AgentManager(builtinDir, externalDir);
  await manager.initialize();

  return {
    listAgents(): AgentsResponse {
      const groups = manager.listAgents();
      const divisions = groups.map(g => ({
        name: g.division,
        label: DIVISION_LABELS[g.division] || `${g.division} Division`,
        agents: g.agents.map(a => ({
          name: a.name,
          role: a.role,
          description: a.description,
          source: a.source as 'external' | 'builtin' | 'generated',
          tags: [] as string[],
        })),
      }));

      const total = divisions.reduce((sum, d) => sum + d.agents.length, 0);

      return { divisions, total };
    },

    async matchAgent(role: string, action: string) {
      return manager.matchAgent({
        id: `match_${Date.now()}`,
        role,
        action,
        depends_on: [],
      });
    },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```bash
git add src/server/api.ts tests/api.test.ts
git commit -m "feat: add server API handler for agent listing and matching"
```

---

### Task 3: Next.js 대시보드 셋업

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/next.config.ts`
- Create: `dashboard/tailwind.config.ts`
- Create: `dashboard/postcss.config.mjs`
- Create: `dashboard/app/globals.css`
- Create: `dashboard/app/layout.tsx`

- [ ] **Step 1: Next.js + Tailwind 설치**

```bash
cd /Users/jidong/agentochester
mkdir -p dashboard
cd dashboard
npx create-next-app@latest . --ts --tailwind --app --no-src-dir --no-eslint --import-alias "@/*" --use-npm
```

- [ ] **Step 2: layout.tsx 수정 (최소 레이아웃)**

```tsx
// dashboard/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SpoonCompose Dashboard',
  description: 'Agent Teams Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">SpoonCompose</h1>
            <a href="/" className="text-sm text-gray-400 hover:text-white">Dashboard</a>
            <a href="/agents" className="text-sm text-gray-400 hover:text-white">Agents</a>
          </div>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add dashboard/
git commit -m "chore: init Next.js dashboard with Tailwind CSS"
```

---

### Task 4: GET /api/agents 라우트

**Files:**
- Create: `dashboard/app/api/agents/route.ts`

- [ ] **Step 1: API route 구현**

```typescript
// dashboard/app/api/agents/route.ts
import { NextResponse } from 'next/server';
import * as path from 'path';
import { createAgentsHandler } from '../../../src-bridge';

let handlerCache: Awaited<ReturnType<typeof createAgentsHandler>> | null = null;

async function getHandler() {
  if (handlerCache) return handlerCache;
  const builtinDir = path.resolve(process.cwd(), '..', 'agents', 'builtin');
  const externalDir = path.resolve(process.cwd(), '..', 'agents', 'external', 'agency-agents');
  handlerCache = await createAgentsHandler(builtinDir, externalDir);
  return handlerCache;
}

export async function GET(request: Request) {
  try {
    const handler = await getHandler();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const action = searchParams.get('action');

    if (role && action) {
      const result = await handler.matchAgent(role, action);
      return NextResponse.json(result);
    }

    const agents = handler.listAgents();
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load agents' },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: src-bridge.ts (대시보드에서 core 모듈 접근)**

```typescript
// dashboard/src-bridge.ts
export { createAgentsHandler } from '../src/server/api.js';
```

Note: dashboard의 tsconfig에서 paths로 core 모듈을 참조하도록 설정.

- [ ] **Step 3: 커밋**

```bash
git add dashboard/app/api/ dashboard/src-bridge.ts
git commit -m "feat: add GET /api/agents route"
```

---

### Task 5: AgentLibrary 컴포넌트 + agents/page.tsx

**Files:**
- Create: `dashboard/components/AgentLibrary.tsx`
- Create: `dashboard/app/agents/page.tsx`

- [ ] **Step 1: AgentLibrary 컴포넌트**

```tsx
// dashboard/components/AgentLibrary.tsx
'use client';

import { useEffect, useState } from 'react';

interface Agent {
  name: string;
  role: string;
  description: string;
  source: 'external' | 'builtin' | 'generated';
  tags: string[];
}

interface Division {
  name: string;
  label: string;
  agents: Agent[];
}

interface AgentsResponse {
  divisions: Division[];
  total: number;
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  external: { label: 'agency-agents', color: 'bg-blue-900 text-blue-300' },
  builtin: { label: 'builtin', color: 'bg-green-900 text-green-300' },
  generated: { label: 'generated', color: 'bg-yellow-900 text-yellow-300' },
};

export default function AgentLibrary() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [filter, setFilter] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-gray-500">Loading agents...</div>;

  const filteredDivisions = data.divisions
    .filter(d => !selectedDivision || d.name === selectedDivision)
    .map(d => ({
      ...d,
      agents: d.agents.filter(a =>
        !filter ||
        a.name.toLowerCase().includes(filter.toLowerCase()) ||
        a.role.includes(filter.toLowerCase()) ||
        a.description.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter(d => d.agents.length > 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search agents..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-gray-500"
        />
        <select
          value={selectedDivision || ''}
          onChange={e => setSelectedDivision(e.target.value || null)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        >
          <option value="">All Divisions</option>
          {data.divisions.map(d => (
            <option key={d.name} value={d.name}>{d.label} ({d.agents.length})</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">Total: {data.total} agents</span>
      </div>

      {filteredDivisions.map(division => (
        <div key={division.name} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">{division.label}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {division.agents.map(agent => {
              const badge = SOURCE_BADGE[agent.source];
              return (
                <div key={agent.role} className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{agent.role}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{agent.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: agents/page.tsx**

```tsx
// dashboard/app/agents/page.tsx
import AgentLibrary from '../../components/AgentLibrary';

export default function AgentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Library</h1>
      <AgentLibrary />
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add dashboard/components/AgentLibrary.tsx dashboard/app/agents/
git commit -m "feat: add agent library page with search and division filter"
```

---

### Task 6: AgentMatchPanel 컴포넌트

**Files:**
- Create: `dashboard/components/AgentMatchPanel.tsx`
- Modify: `dashboard/app/page.tsx`

- [ ] **Step 1: AgentMatchPanel 구현**

```tsx
// dashboard/components/AgentMatchPanel.tsx
'use client';

import { useState } from 'react';

interface MatchResult {
  agent: { name: string; role: string; source: { type: string } } | null;
  matchType: 'exact' | 'fuzzy' | 'none';
  candidates?: Array<{ name: string; score: number }>;
}

const MATCH_ICON: Record<string, string> = {
  exact: '✅',
  fuzzy: '🔍',
  none: '⚠️',
};

const SOURCE_LABEL: Record<string, string> = {
  external: 'agency-agents',
  builtin: 'builtin',
  generated: 'auto-generated',
};

export default function AgentMatchPanel() {
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    if (!role || !action) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents?role=${encodeURIComponent(role)}&action=${encodeURIComponent(action)}`);
      const data = await res.json();
      setResults(prev => [...prev, data]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Agent Matching</h2>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Role (e.g. frontend_developer)"
          value={role}
          onChange={e => setRole(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-gray-500"
        />
        <input
          type="text"
          placeholder="Action (e.g. React 컴포넌트 구현)"
          value={action}
          onChange={e => setAction(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={handleMatch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {loading ? 'Matching...' : 'Match'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
              <span>{MATCH_ICON[result.matchType]}</span>
              {result.agent ? (
                <>
                  <span className="font-medium">{result.agent.name}</span>
                  <span className="text-gray-500">[{SOURCE_LABEL[result.agent.source.type] || result.agent.source.type}]</span>
                </>
              ) : (
                <span className="text-yellow-500">매칭 없음</span>
              )}
              {result.candidates && result.candidates.length > 0 && (
                <span className="text-gray-500 text-xs">
                  후보: {result.candidates.slice(0, 3).map(c => `${c.name}(${c.score})`).join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 메인 대시보드 페이지 업데이트**

```tsx
// dashboard/app/page.tsx
import AgentMatchPanel from '../components/AgentMatchPanel';

export default function Home() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">SpoonCompose Dashboard</h1>
      <AgentMatchPanel />
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add dashboard/components/AgentMatchPanel.tsx dashboard/app/page.tsx
git commit -m "feat: add AgentMatchPanel with role/action matching UI"
```

---

### Task 7: 대시보드 빌드 검증 + 최종 테스트

- [ ] **Step 1: 대시보드 빌드 확인**

Run: `cd dashboard && npm run build`

- [ ] **Step 2: 코어 전체 테스트 재확인**

Run: `cd /Users/jidong/agentochester && npx vitest run`

- [ ] **Step 3: 최종 커밋 + push**

```bash
git add -A
git commit -m "chore: final build verification"
git push
```
