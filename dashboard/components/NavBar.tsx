"use client";

import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import { useLocale } from "@/lib/locale-context";

export default function NavBar() {
  const { t } = useLocale();

  return (
    <nav className="border-b border-gray-800 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">{t("app.title")}</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            {t("nav.dashboard")}
          </Link>
          <Link href="/agents" className="text-sm text-gray-400 hover:text-white">
            {t("nav.agents")}
          </Link>
        </div>
        <LanguageSelector />
      </div>
    </nav>
  );
}
