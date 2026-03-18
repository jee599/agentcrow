import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { decomposePrompt } from "@/lib/decomposer";
import { matchAgent } from "@/lib/agents-handler";

interface ExecResult {
  taskId: string;
  role: string;
  agentName: string;
  status: "success" | "error";
  output: string;
  error?: string;
  durationMs: number;
}

function runClaude(prompt: string, cwd: string, timeoutMs: number = 600000): Promise<{ success: boolean; output: string; error?: string; durationMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn("claude", ["--print", "--dangerously-skip-permissions", "-m", prompt], {
      cwd,
      shell: true,
      timeout: timeoutMs,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      resolve({
        success: code === 0,
        output: stdout.trim(),
        error: code !== 0 ? (stderr.trim() || `Exit code: ${code}`) : undefined,
        durationMs: Date.now() - start,
      });
    });

    proc.on("error", (err) => {
      resolve({
        success: false,
        output: "",
        error: err.message,
        durationMs: Date.now() - start,
      });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, workingDir } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const tasks = decomposePrompt(prompt);
    const matched = await Promise.all(
      tasks.map(async (task) => {
        const result = await matchAgent(task.role, task.action);
        return { task, agent: result.agent };
      })
    );

    const executable = matched.filter((m) => m.agent !== null);
    if (executable.length === 0) {
      return NextResponse.json({ error: "No agents matched" }, { status: 400 });
    }

    const start = Date.now();
    const results: ExecResult[] = [];
    const completed = new Set<string>();
    const cwd = workingDir || process.cwd();

    // Execute in dependency order
    for (const { task, agent } of executable) {
      const depsMet = task.depends_on.every((d) => completed.has(d));
      if (!depsMet) {
        results.push({
          taskId: task.id,
          role: task.role,
          agentName: agent!.name,
          status: "error",
          output: "",
          error: "Dependencies not met",
          durationMs: 0,
        });
        continue;
      }

      // Build prompt with agent identity
      const agentPrompt = [
        `You are ${agent!.name} (${agent!.role}).`,
        ``,
        `[Task]`,
        task.action,
        ``,
        task.file_scope.length > 0 ? `[File Scope]\n${task.file_scope.join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const cliResult = await runClaude(agentPrompt, cwd);

      results.push({
        taskId: task.id,
        role: task.role,
        agentName: agent!.name,
        status: cliResult.success ? "success" : "error",
        output: cliResult.output,
        error: cliResult.error,
        durationMs: cliResult.durationMs,
      });

      if (cliResult.success) {
        completed.add(task.id);
      }
    }

    return NextResponse.json({
      results,
      totalDurationMs: Date.now() - start,
      summary: {
        total: results.length,
        success: results.filter((r) => r.status === "success").length,
        error: results.filter((r) => r.status === "error").length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Execution failed" },
      { status: 500 }
    );
  }
}
