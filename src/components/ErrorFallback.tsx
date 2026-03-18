"use client";

import { useT } from "@/i18n";

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const t = useT();

  return (
    <div className="flex items-center justify-center h-screen bg-[#FAFAFA]">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-[#dc2626] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">!</span>
        </div>
        <h2 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[#1A1A1A] mb-2">
          {t("error.title")}
        </h2>
        <p className="text-sm text-[#666666] mb-4">
          {error?.message || t("error.description")}
        </p>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-[#0D6E6E] text-white rounded-lg text-sm hover:bg-[#0A5555] cursor-pointer"
        >
          {t("error.reload")}
        </button>
      </div>
    </div>
  );
}
