"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadVault } from "@/lib/storage";

const FILE_LINES = [
  { file: "CLAUDE.md", lines: ["# Configuration Claude Code", "", "## Langue", "Toujours répondre en français.", "", "## Ton", "Professionnel et direct."] },
  { file: "settings.json", lines: ['{', '  "model": "claude-sonnet-4-6",', '  "language": "french",', '  "effortLevel": "high",', '  "permissions": {', '    "allow": ["Bash(npm run *)"]', '  }', '}'] },
  { file: ".claudeignore", lines: ["node_modules/", "dist/", ".next/", ".env", ".env.*", ".DS_Store"] },
];

export default function Test2HomePage() {
  const router = useRouter();
  const [vaultCount, setVaultCount] = useState(0);
  const [activeFile, setActiveFile] = useState(0);

  useEffect(() => { setVaultCount(loadVault().length); }, []);
  useEffect(() => {
    const timer = setInterval(() => setActiveFile(f => (f + 1) % FILE_LINES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const currentFile = FILE_LINES[activeFile];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Split hero */}
      <div className="flex flex-col lg:flex-row min-h-[480px]">
        {/* Left: dark */}
        <div className="flex-1 bg-[#1A1A1A] relative overflow-hidden flex flex-col justify-center p-8 md:p-14">
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(#0D6E6E 1px, transparent 1px), linear-gradient(90deg, #0D6E6E 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div className="relative z-10">
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-4 block">
              CLAUDE CODE CONFIG
            </span>
            <h1 className="font-[family-name:var(--font-newsreader)] text-[36px] md:text-[46px] font-medium text-white tracking-[-2px] leading-[1.1] mb-5">
              Configure<br />Claude Code<br />
              <span className="text-[#0D6E6E]">en quelques clics.</span>
            </h1>
            <p className="text-[15px] text-[#888888] leading-[1.7] max-w-sm mb-8">
              Génère tes fichiers de configuration prêts à déposer dans ton projet.
            </p>

            {/* CTAs inline */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("/wizard")}
                className="group flex items-center gap-3 px-5 py-3 bg-[#0D6E6E] rounded-lg hover:bg-[#0A5555] transition-colors"
              >
                <span className="text-white text-sm font-medium">Pas à pas</span>
                <span className="text-white/50 group-hover:text-white/80 text-xs">~2 min →</span>
              </button>
              <button
                onClick={() => router.push("/expert")}
                className="group flex items-center gap-3 px-5 py-3 border border-[#333333] rounded-lg hover:border-[#0D6E6E] transition-colors"
              >
                <span className="text-[#CCCCCC] text-sm font-medium">Configuration directe</span>
                <span className="text-[#555555] group-hover:text-[#0D6E6E] text-xs">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: code preview */}
        <div className="flex-1 bg-[#111111] flex flex-col relative overflow-hidden">
          {/* Diagonal separator on large screens */}
          <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10" />

          {/* File tabs */}
          <div className="flex items-center gap-1 px-6 pt-6 pb-3">
            {FILE_LINES.map((f, i) => (
              <button
                key={f.file}
                onClick={() => setActiveFile(i)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                  i === activeFile
                    ? "bg-[#0D6E6E]/20 text-[#0D6E6E] border border-[#0D6E6E]/30"
                    : "text-[#444444] hover:text-[#666666]"
                }`}
              >
                {f.file}
              </button>
            ))}
          </div>

          {/* Code */}
          <div className="flex-1 px-6 pb-6 overflow-auto">
            {currentFile.lines.map((line, i) => (
              <div
                key={`${activeFile}-${i}`}
                className="flex gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <span className="text-[12px] font-mono text-[#333333] select-none w-5 text-right flex-shrink-0">{i + 1}</span>
                <span className={`text-[13px] font-mono leading-[2] ${
                  line === "" ? "h-[2em]" :
                  line.startsWith("#") ? "text-[#0D6E6E]" :
                  line.includes('":') ? "text-[#E07B54]" :
                  "text-[#777777]"
                }`}>
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pb-6">
            {FILE_LINES.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeFile ? "bg-[#0D6E6E] w-4" : "bg-[#333333]"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section: what gets generated + vault */}
      <div className="bg-[#FAFAFA] flex-1">
        <div className="max-w-3xl mx-auto px-6 md:px-14 py-8">
          {/* Files generated */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {["CLAUDE.md", "settings.json", ".claudeignore", ".mcp.json", ".claude/rules/"].map(file => (
              <span key={file} className="px-3 py-1.5 bg-white rounded-full border border-[#E5E5E5] text-[11px] font-mono text-[#666666]">
                {file}
              </span>
            ))}
          </div>

          {/* Vault */}
          {vaultCount > 0 && (
            <button
              onClick={() => router.push("/vault")}
              className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[#F0FAFA] rounded-lg flex items-center justify-center text-sm">🔐</span>
                <div className="text-left">
                  <span className="text-sm font-medium text-[#1A1A1A]">{vaultCount} config{vaultCount > 1 ? "s" : ""} sauvegardée{vaultCount > 1 ? "s" : ""}</span>
                  <p className="text-xs text-[#888888]">Reprendre ou exporter</p>
                </div>
              </div>
              <span className="text-sm text-[#0D6E6E]">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
