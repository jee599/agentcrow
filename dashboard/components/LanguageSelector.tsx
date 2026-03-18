"use client";

import { useLocale } from "@/lib/locale-context";
import { LOCALES } from "@/lib/i18n";

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as typeof locale)}
      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-gray-500"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
