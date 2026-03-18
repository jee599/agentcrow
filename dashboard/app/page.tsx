"use client";

import ComposePanel from "@/components/ComposePanel";
import { useLocale } from "@/lib/locale-context";

export default function Home() {
  const { t } = useLocale();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">{t("app.title")}</h1>
      <p className="text-sm text-gray-500 mb-6">{t("app.subtitle")}</p>
      <ComposePanel />
    </div>
  );
}
