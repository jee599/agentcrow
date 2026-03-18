"use client";

import { useState } from "react";

interface MatchResult {
  agent: { name: string; role: string; source: { type: string } } | null;
  matchType: "exact" | "fuzzy" | "none";
  candidates?: Array<{ name: string; score: number }>;
}

const MATCH_ICON: Record<string, string> = {
  exact: "\u2705",
  fuzzy: "\uD83D\uDD0D",
  none: "\u26A0\uFE0F",
};

const SOURCE_LABEL: Record<string, string> = {
  external: "agency-agents",
  builtin: "builtin",
  generated: "auto-generated",
};

export default function AgentMatchPanel() {
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleMatch = async () => {
    if (!role || !action) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/agents?role=${encodeURIComponent(role)}&action=${encodeURIComponent(action)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults((prev) => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed");
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
          onChange={(e) => setRole(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-gray-500"
        />
        <input
          type="text"
          placeholder="Action (e.g. React 컴포넌트 구현)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={handleMatch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {loading ? "Matching..." : "Match"}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm py-2 border-b border-gray-800 last:border-0"
            >
              <span>{MATCH_ICON[result.matchType]}</span>
              {result.agent ? (
                <>
                  <span className="font-medium">{result.agent.name}</span>
                  <span className="text-gray-500">
                    [
                    {SOURCE_LABEL[result.agent.source.type] ||
                      result.agent.source.type}
                    ]
                  </span>
                </>
              ) : (
                <span className="text-yellow-500">매칭 없음</span>
              )}
              {result.candidates && result.candidates.length > 0 && (
                <span className="text-gray-500 text-xs">
                  후보:{" "}
                  {result.candidates
                    .slice(0, 3)
                    .map((c) => `${c.name}(${c.score})`)
                    .join(", ")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
