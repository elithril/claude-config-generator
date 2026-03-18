"use client";

import { useT } from "@/i18n";

export default function EditorLoading() {
  const t = useT();

  return (
    <div className="flex-1 flex items-center justify-center bg-white border border-[#E5E5E5] rounded-b-md rounded-tr-md">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0D6E6E] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#888888]">{t("expert.loading")}</span>
      </div>
    </div>
  );
}
