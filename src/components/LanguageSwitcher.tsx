"use client";

import { useI18n } from "@/i18n";

interface LanguageSwitcherProps {
  variant?: "light" | "dark";
}

export default function LanguageSwitcher({ variant = "dark" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  const bgClass = variant === "dark" ? "bg-[#252525]" : "bg-[#F0F0F0]";
  const activeClass = variant === "dark" ? "bg-[#0D6E6E] text-white" : "bg-white text-[#0D6E6E] shadow-sm";
  const inactiveClass = variant === "dark" ? "text-[#666666] hover:text-[#888888]" : "text-[#888888] hover:text-[#666666]";

  return (
    <div className={`flex items-center ${bgClass} rounded-full p-0.5`}>
      <button
        onClick={() => setLocale("fr")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${locale === "fr" ? activeClass : inactiveClass}`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${locale === "en" ? activeClass : inactiveClass}`}
      >
        EN
      </button>
    </div>
  );
}
