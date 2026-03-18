"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";

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

interface AgentsResponse {
  divisions: Division[];
  total: number;
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  external: { label: "agency-agents", color: "bg-blue-900 text-blue-300" },
  builtin: { label: "builtin", color: "bg-green-900 text-green-300" },
  generated: { label: "generated", color: "bg-yellow-900 text-yellow-300" },
};

export default function AgentLibrary() {
  const { t } = useLocale();
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="text-red-400">{t("agents.load_error")}: {error}</div>;
  if (!data) return <div className="text-gray-500">{t("agents.loading")}</div>;

  const filteredDivisions = data.divisions
    .filter((d) => !selectedDivision || d.name === selectedDivision)
    .map((d) => ({
      ...d,
      agents: d.agents.filter(
        (a) =>
          !filter ||
          a.name.toLowerCase().includes(filter.toLowerCase()) ||
          a.role.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter((d) => d.agents.length > 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder={t("agents.search")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:border-gray-500"
        />
        <select
          value={selectedDivision || ""}
          onChange={(e) => setSelectedDivision(e.target.value || null)}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        >
          <option value="">{t("agents.all_divisions")}</option>
          {data.divisions.map((d) => (
            <option key={d.name} value={d.name}>
              {d.label} ({d.agents.length})
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{t("agents.total")}: {data.total}</span>
      </div>

      {filteredDivisions.map((division) => (
        <div key={division.name} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">
            {division.label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {division.agents.map((agent) => {
              const badge = SOURCE_BADGE[agent.source] ?? { label: agent.source, color: "bg-gray-800 text-gray-400" };
              return (
                <div
                  key={`${division.name}-${agent.role}`}
                  className="border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{agent.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
