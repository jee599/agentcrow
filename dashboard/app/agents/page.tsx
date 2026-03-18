"use client";

import AgentLibrary from "@/components/AgentLibrary";
import { useLocale } from "@/lib/locale-context";

export default function AgentsPage() {
  const { t } = useLocale();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("agents.title")}</h1>
      <AgentLibrary />
    </div>
  );
}
