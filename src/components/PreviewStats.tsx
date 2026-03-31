"use client";

import { useAnimatedValue } from "@/hooks/useAnimatedValue";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

interface PreviewStatsProps {
  fileCount: number;
  tokenCount: number;
  totalBytes: number;
  labels: [string, string, string];
}

export default function PreviewStats({ fileCount, tokenCount, totalBytes, labels }: PreviewStatsProps) {
  const animFiles = useAnimatedValue(fileCount);
  const animTokens = useAnimatedValue(tokenCount);
  const animBytes = useAnimatedValue(totalBytes);

  return (
    <div className="flex gap-3">
      <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
        <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#1A1A1A]">{animFiles}</span>
        <span className="text-[11px] text-[#0D6E6E]">{labels[0]}</span>
      </div>
      <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
        <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#1A1A1A]">~{animTokens}</span>
        <span className="text-[11px] text-[#0D6E6E]">{labels[1]}</span>
      </div>
      <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
        <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#1A1A1A]">{formatSize(animBytes)}</span>
        <span className="text-[11px] text-[#0D6E6E]">{labels[2]}</span>
      </div>
    </div>
  );
}
