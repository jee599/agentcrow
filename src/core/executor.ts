import { ClaudeCLIBridge, type BridgeResult } from './bridge.js';
import { assembleAgentPrompt } from './assembler.js';
import type { AgentDefinition, Task } from './types.js';

interface TaskWithAgent {
  task: Task;
  agent: AgentDefinition;
}

export interface TaskExecutionResult {
  taskId: string;
  role: string;
  agentName: string;
  status: 'success' | 'error' | 'skipped';
  output: string;
  error?: string;
  durationMs: number;
}

export interface ExecutionResult {
  results: TaskExecutionResult[];
  totalDurationMs: number;
  summary: {
    total: number;
    success: number;
    error: number;
    skipped: number;
  };
}

export class Executor {
  private bridge: ClaudeCLIBridge;

  constructor(bridge?: ClaudeCLIBridge) {
    this.bridge = bridge ?? new ClaudeCLIBridge();
  }

  async execute(
    tasks: TaskWithAgent[],
    projectContext: string,
    workingDir?: string,
    onProgress?: (result: TaskExecutionResult) => void,
  ): Promise<ExecutionResult> {
    const start = Date.now();
    const results: TaskExecutionResult[] = [];
    const completed = new Set<string>();

    // Sort tasks by dependency order
    const sorted = this.topologicalSort(tasks);

    for (const { task, agent } of sorted) {
      // Check if dependencies are met
      const depsMet = task.depends_on.every((dep) => completed.has(dep));

      if (!depsMet) {
        const result: TaskExecutionResult = {
          taskId: task.id,
          role: task.role,
          agentName: agent.name,
          status: 'skipped',
          output: '',
          error: `Dependencies not met: ${task.depends_on.filter((d) => !completed.has(d)).join(', ')}`,
          durationMs: 0,
        };
        results.push(result);
        onProgress?.(result);
        continue;
      }

      // Build context with previous results
      const prevContext = results
        .filter((r) => r.status === 'success' && task.depends_on.includes(r.taskId))
        .map((r) => `[${r.taskId} output]\n${r.output}`)
        .join('\n\n');

      const fullPrompt = this.buildPrompt(agent, task, projectContext, prevContext);

      // Execute via Claude CLI
      const bridgeResult = await this.bridge.execute(fullPrompt, workingDir);

      const result: TaskExecutionResult = {
        taskId: task.id,
        role: task.role,
        agentName: agent.name,
        status: bridgeResult.success ? 'success' : 'error',
        output: bridgeResult.output,
        error: bridgeResult.error,
        durationMs: bridgeResult.durationMs,
      };

      results.push(result);
      onProgress?.(result);

      if (bridgeResult.success) {
        completed.add(task.id);
      }
    }

    const totalDurationMs = Date.now() - start;

    return {
      results,
      totalDurationMs,
      summary: {
        total: results.length,
        success: results.filter((r) => r.status === 'success').length,
        error: results.filter((r) => r.status === 'error').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
      },
    };
  }

  private buildPrompt(
    agent: AgentDefinition,
    task: Task,
    projectContext: string,
    previousOutputs: string,
  ): string {
    const sections: string[] = [];

    sections.push(`[Project Context]\n${projectContext}`);

    if (previousOutputs) {
      sections.push(`[Previous Task Outputs]\n${previousOutputs}`);
    }

    if (task.file_scope && task.file_scope.length > 0) {
      sections.push(`[File Scope]\n${task.file_scope.join(', ')}`);
    }

    sections.push(assembleAgentPrompt(agent, task.action));

    return sections.join('\n\n');
  }

  private topologicalSort(tasks: TaskWithAgent[]): TaskWithAgent[] {
    const taskMap = new Map(tasks.map((t) => [t.task.id, t]));
    const visited = new Set<string>();
    const sorted: TaskWithAgent[] = [];

    function visit(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      const tw = taskMap.get(id);
      if (!tw) return;
      for (const dep of tw.task.depends_on) {
        visit(dep);
      }
      sorted.push(tw);
    }

    for (const t of tasks) {
      visit(t.task.id);
    }

    return sorted;
  }
}
