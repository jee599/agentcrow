"use client";

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";

interface TaskResult {
  task: {
    id: string;
    role: string;
    action: string;
    depends_on: string[];
    file_scope: string[];
  };
  match: {
    agent: { name: string; role: string; source: { type: string }; description: string } | null;
    matchType: "exact" | "fuzzy" | "none";
    candidates?: Array<{ name: string; score: number }>;
  };
}

interface ComposeResult {
  prompt: string;
  tasks: TaskResult[];
  summary: {
    totalTasks: number;
    matched: number;
    unmatched: number;
  };
}

const MATCH_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  exact: { label: "exact", bg: "bg-green-900/50", text: "text-green-300" },
  fuzzy: { label: "fuzzy", bg: "bg-blue-900/50", text: "text-blue-300" },
  none: { label: "none", bg: "bg-yellow-900/50", text: "text-yellow-300" },
};

const SOURCE_STYLE: Record<string, { label: string; color: string }> = {
  external: { label: "agency-agents", color: "text-blue-400" },
  builtin: { label: "builtin", color: "text-green-400" },
  generated: { label: "generated", color: "text-yellow-400" },
};

interface ExecutionResult {
  results: Array<{
    taskId: string;
    role: string;
    agentName: string;
    status: "success" | "error" | "skipped";
    output: string;
    error?: string;
    durationMs: number;
  }>;
  totalDurationMs: number;
  summary: { total: number; success: number; error: number; skipped: number };
}

export default function ComposePanel() {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompose = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compose failed");
    } finally {
      setLoading(false);
    }
  };

  const [liveOutputs, setLiveOutputs] = useState<Record<string, string>>({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({});

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setExecuting(true);
    setError(null);
    setExecResult(null);
    setLiveOutputs({});
    setTaskStatuses({});

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const results: ExecutionResult["results"] = [];
      let totalDurationMs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (eventType === "task_start") {
              setTaskStatuses((prev) => ({ ...prev, [data.taskId]: data.status }));
            } else if (eventType === "task_output") {
              setLiveOutputs((prev) => ({
                ...prev,
                [data.taskId]: (prev[data.taskId] || "") + data.chunk,
              }));
            } else if (eventType === "task_done") {
              setTaskStatuses((prev) => ({ ...prev, [data.taskId]: data.status }));
              results.push({
                taskId: data.taskId,
                role: data.role || "",
                agentName: data.agentName || "",
                status: data.status,
                output: data.output || "",
                error: data.error,
                durationMs: data.durationMs || 0,
              });
            } else if (eventType === "done") {
              totalDurationMs = data.totalDurationMs;
            }
          }
        }
      }

      setExecResult({
        results,
        totalDurationMs,
        summary: {
          total: results.length,
          success: results.filter((r) => r.status === "success").length,
          error: results.filter((r) => r.status === "error").length,
          skipped: 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCompose();
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="border border-gray-800 rounded-lg p-4">
        <label className="block text-sm text-gray-400 mb-2">
          {t("compose.label")}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("compose.placeholder")}
          rows={3}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-600">{t("compose.hint")}</span>
          <button
            onClick={handleCompose}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? t("compose.composing") : t("compose.button")}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-900 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                {result.summary.totalTasks} {t("compose.tasks_decomposed")}
              </span>
              <span className="text-green-400">
                {result.summary.matched} {t("compose.matched")}
              </span>
              {result.summary.unmatched > 0 && (
                <span className="text-yellow-400">
                  {result.summary.unmatched} {t("compose.unmatched")}
                </span>
              )}
            </div>
            <button
              onClick={handleExecute}
              disabled={executing || result.summary.matched === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {executing ? t("compose.executing") : t("compose.execute")}
            </button>
          </div>

          {/* Task Cards */}
          <div className="space-y-3">
            {result.tasks.map((tr) => {
              const matchStyle = MATCH_STYLE[tr.match.matchType];
              const sourceStyle = tr.match.agent
                ? SOURCE_STYLE[tr.match.agent.source.type] ?? { label: tr.match.agent.source.type, color: "text-gray-400" }
                : null;

              return (
                <div
                  key={tr.task.id}
                  className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-mono">{tr.task.id}</span>
                      <span className="text-sm font-medium text-gray-200">
                        {t(`role.${tr.task.role}`) !== `role.${tr.task.role}` ? t(`role.${tr.task.role}`) : tr.task.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${matchStyle.bg} ${matchStyle.text}`}>
                      {matchStyle.label}
                    </span>
                  </div>

                  {/* Role description */}
                  {t(`role.${tr.task.role}.desc`) !== `role.${tr.task.role}.desc` && (
                    <p className="text-xs text-gray-600 mb-2">{t(`role.${tr.task.role}.desc`)}</p>
                  )}

                  {/* Action */}
                  <p className="text-sm text-gray-400 mb-2">{tr.task.action}</p>

                  {/* Match type explanation */}
                  <p className="text-xs text-gray-700 mb-3">{t(`match.${tr.match.matchType}`)}</p>

                  {/* Matched Agent */}
                  {tr.match.agent ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">→</span>
                      <span className="font-medium text-white">{tr.match.agent.name}</span>
                      <span className={`text-xs ${sourceStyle?.color}`}>[{sourceStyle?.label}]</span>
                    </div>
                  ) : (
                    <div className="text-sm text-yellow-500">
                      {t("compose.no_match")}
                      {tr.match.candidates && tr.match.candidates.length > 0 && (
                        <span className="text-gray-500 ml-2">
                          candidates: {tr.match.candidates.slice(0, 3).map((c) => c.name).join(", ")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Dependencies */}
                  {tr.task.depends_on.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      depends on: {tr.task.depends_on.join(", ")}
                    </div>
                  )}

                  {/* File Scope */}
                  {tr.task.file_scope.length > 0 && (
                    <div className="mt-1 text-xs text-gray-700 font-mono">
                      {tr.task.file_scope.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Execution Progress */}
      {executing && Object.keys(taskStatuses).length > 0 && (
        <div className="space-y-3 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="animate-pulse text-blue-400">●</span>
            <span className="font-medium text-white">Executing...</span>
          </div>
          {Object.entries(taskStatuses).map(([taskId, status]) => (
            <div key={taskId} className="border border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  status === "running" ? "bg-blue-900/50 text-blue-300 animate-pulse" :
                  status === "success" ? "bg-green-900/50 text-green-300" :
                  "bg-red-900/50 text-red-300"
                }`}>{status}</span>
                <span className="text-sm text-gray-300">{taskId}</span>
              </div>
              {liveOutputs[taskId] && (
                <pre className="text-xs text-gray-400 bg-gray-900 rounded p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {liveOutputs[taskId]}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Execution Result */}
      {execResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm border-t border-gray-800 pt-4">
            <span className="font-medium text-white">Execution Result</span>
            <span className="text-gray-400">
              {(execResult.totalDurationMs / 1000).toFixed(1)}s
            </span>
            <span className="text-green-400">{execResult.summary.success} success</span>
            {execResult.summary.error > 0 && (
              <span className="text-red-400">{execResult.summary.error} error</span>
            )}
            {execResult.summary.skipped > 0 && (
              <span className="text-yellow-400">{execResult.summary.skipped} skipped</span>
            )}
          </div>

          <div className="space-y-3">
            {execResult.results.map((r) => (
              <div
                key={r.taskId}
                className={`border rounded-lg p-4 ${
                  r.status === "success"
                    ? "border-green-900/50"
                    : r.status === "error"
                    ? "border-red-900/50"
                    : "border-yellow-900/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      r.status === "success" ? "bg-green-900/50 text-green-300" :
                      r.status === "error" ? "bg-red-900/50 text-red-300" :
                      "bg-yellow-900/50 text-yellow-300"
                    }`}>
                      {r.status}
                    </span>
                    <span className="text-sm font-medium">{r.agentName}</span>
                    <span className="text-xs text-gray-600">{r.role}</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {(r.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                {r.output && (
                  <pre className="text-xs text-gray-400 bg-gray-900 rounded p-3 mt-2 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {r.output}
                  </pre>
                )}
                {r.error && (
                  <div className="text-xs text-red-400 mt-2">{r.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
