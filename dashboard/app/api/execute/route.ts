import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { smartDecompose } from "@/lib/smart-decomposer";
import { decomposePrompt } from "@/lib/decomposer";
import { matchAgent } from "@/lib/agents-handler";

function runClaude(
  prompt: string,
  cwd: string,
  onChunk: (chunk: string) => void,
  timeoutMs: number = 600000,
): Promise<{ success: boolean; output: string; error?: string; durationMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    const proc = spawn("claude", ["-p", "--allowedTools", "Write,Edit,Read,Bash,Glob,Grep", prompt], {
      cwd,
      shell: false,
      timeout: timeoutMs,
      env,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => {
      const chunk = d.toString();
      stdout += chunk;
      onChunk(chunk);
    });

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
  const { prompt, workingDir } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let tasks;
  try {
    tasks = await smartDecompose(prompt);
  } catch {
    tasks = decomposePrompt(prompt);
  }
  const matched = await Promise.all(
    tasks.map(async (task) => {
      const result = await matchAgent(task.role, task.action);
      return { task, agent: result.agent };
    })
  );

  const executable = matched.filter((m) => m.agent !== null);
  if (executable.length === 0) {
    return new Response(JSON.stringify({ error: "No agents matched" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      const cwd = workingDir || process.cwd();
      const totalStart = Date.now();

      // Send initial plan
      send("plan", {
        tasks: executable.map((e) => ({
          id: e.task.id,
          role: e.task.role,
          agentName: e.agent!.name,
          depends_on: e.task.depends_on,
        })),
      });

      const collectedOutputs: Array<{ role: string; agentName: string; action: string; output: string; success: boolean }> = [];

      for (const { task, agent } of executable) {
        send("task_start", {
          taskId: task.id,
          role: task.role,
          agentName: agent!.name,
          status: "running",
        });

        const agentPrompt = [
          `You are ${agent!.name} (${agent!.role}).`,
          "",
          "[Task]",
          task.action,
          "",
          task.file_scope.length > 0 ? `[File Scope]\n${task.file_scope.join(", ")}` : "",
        ].filter(Boolean).join("\n");

        const result = await runClaude(agentPrompt, cwd, (chunk) => {
          send("task_output", { taskId: task.id, chunk });
        });

        collectedOutputs.push({
          role: task.role,
          agentName: agent!.name,
          action: task.action,
          output: result.output.slice(0, 2000),
          success: result.success,
        });

        send("task_done", {
          taskId: task.id,
          status: result.success ? "success" : "error",
          output: result.output,
          error: result.error,
          durationMs: result.durationMs,
        });
      }

      // Orchestrator — synthesize all agent outputs
      send("task_start", {
        taskId: "orchestrator",
        role: "orchestrator",
        agentName: "Orchestrator",
        status: "running",
      });

      const agentResults = collectedOutputs
        .map((o) => `## ${o.agentName} (${o.role})\nTask: ${o.action}\nStatus: ${o.success ? "SUCCESS" : "FAILED"}\nOutput:\n${o.output}`)
        .join("\n\n---\n\n");

      const orchestratorPrompt = `You are the Orchestrator — the final synthesizer of a multi-agent team.

Original request: "${prompt}"

${collectedOutputs.length} agents executed. Here are their results:

${agentResults}

Now produce a FINAL SYNTHESIS:
1. Summary of what each agent produced
2. How all pieces connect together
3. Gaps or conflicts between agent outputs
4. Concrete next steps (prioritized)

Write in the same language as the original request. Be structured and actionable.`;

      const orchResult = await runClaude(orchestratorPrompt, cwd, (chunk) => {
        send("task_output", { taskId: "orchestrator", chunk });
      });

      send("task_done", {
        taskId: "orchestrator",
        role: "orchestrator",
        agentName: "Orchestrator",
        status: orchResult.success ? "success" : "error",
        output: orchResult.output,
        error: orchResult.error,
        durationMs: orchResult.durationMs,
      });

      send("done", { totalDurationMs: Date.now() - totalStart });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
