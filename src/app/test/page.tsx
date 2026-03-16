"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadVault } from "@/lib/storage";

const FILE_LINES = [
  { file: "CLAUDE.md", lines: ["# Configuration Claude Code", "", "## Langue", "Toujours répondre en français.", "", "## Ton", "Professionnel et direct.", "", "## Style de réponse", "Réponses concises. Diffs uniquement."] },
  { file: "settings.json", lines: ['{', '  "$schema": "https://json.schemastore.org/...",', '  "model": "claude-sonnet-4-6",', '  "language": "french",', '  "effortLevel": "high",', '  "permissions": {', '    "allow": ["Bash(npm run *)"],', '    "deny": ["Read(./.env)"]', '  }', '}'] },
  { file: ".claudeignore", lines: ["# Dependencies", "node_modules/", "", "# Build", "dist/", ".next/", "", "# Environment", ".env", ".env.*"] },
];

export default function TestHomePage() {
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
      {/* Title */}
      <div className="text-center pt-10 md:pt-14 pb-6 px-6">
        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-3 block">
          CLAUDE CODE CONFIG
        </span>
        <h1 className="font-[family-name:var(--font-newsreader)] text-[32px] md:text-[42px] font-medium text-[#1A1A1A] tracking-[-2px] leading-[1.1]">
          Configure Claude Code <span className="text-[#0D6E6E]">en quelques clics.</span>
        </h1>
      </div>

      {/* Terminal hero — full width centerpiece */}
      <div className="px-6 md:px-14 pb-8 max-w-4xl mx-auto w-full">
        <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          {/* Title bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#252525]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <span className="text-[11px] text-[#555555] font-mono">~/mon-projet</span>
            </div>
            {/* File tabs */}
            <div className="flex gap-1">
              {FILE_LINES.map((f, i) => (
                <button
                  key={f.file}
                  onClick={() => setActiveFile(i)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-mono transition-all ${
                    i === activeFile
                      ? "bg-[#0D6E6E] text-white"
                      : "text-[#555555] hover:text-[#888888] hover:bg-[#2A2A2A]"
                  }`}
                >
                  {f.file}
                </button>
              ))}
            </div>
          </div>
          {/* Code content */}
          <div className="p-6 md:p-8 min-h-[260px]">
            <div className="flex flex-col">
              {currentFile.lines.map((line, i) => (
                <div
                  key={`${activeFile}-${i}`}
                  className="flex gap-4 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  <span className="text-[12px] font-mono text-[#444444] select-none w-5 text-right flex-shrink-0">{i + 1}</span>
                  <span className={`text-[13px] font-mono leading-[1.9] ${
                    line === "" ? "h-[1.9em]" :
                    line.startsWith("#") ? "text-[#0D6E6E] font-medium" :
                    line.startsWith("//") ? "text-[#555555]" :
                    line.includes('":') ? "text-[#E07B54]" :
                    line.startsWith("  ") && (line.includes("{") || line.includes("}") || line.includes("[") || line.includes("]")) ? "text-[#888888]" :
                    "text-[#D4D4D4]"
                  }`}>
                    {line || "\u00A0"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom bar */}
          <div className="px-6 py-3 bg-[#252525] flex items-center justify-between">
            <div className="flex gap-4 text-[10px] font-mono text-[#555555]">
              <span>{currentFile.lines.length} lignes</span>
              <span>UTF-8</span>
            </div>
            <div className="flex gap-1">
              {FILE_LINES.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeFile ? "bg-[#0D6E6E]" : "bg-[#333333]"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[15px] text-[#888888] text-center px-6 pb-8 max-w-lg mx-auto">
        Génère CLAUDE.md, settings.json, hooks, MCP servers et .claudeignore — prêts à déposer dans ton projet.
      </p>

      {/* Two CTAs */}
      <div className="px-6 md:px-14 pb-6 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/wizard")}
            className="group flex items-center gap-4 p-5 bg-[#0D6E6E] rounded-xl text-left hover:bg-[#0A5555] transition-colors"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-lg text-white">✦</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-medium text-white">Pas à pas</h2>
              <p className="text-[12px] text-white/60">Guidé · 4 étapes · ~2 min</p>
            </div>
            <span className="text-white/40 group-hover:text-white/70 text-lg">→</span>
          </button>

          <button
            onClick={() => router.push("/expert")}
            className="group flex items-center gap-4 p-5 bg-white border-2 border-[#E5E5E5] rounded-xl text-left hover:border-[#0D6E6E] transition-colors"
          >
            <div className="w-10 h-10 bg-[#F0F0F0] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#F0FAFA] transition-colors">
              <span className="text-lg">⚡</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-medium text-[#1A1A1A]">Configuration directe</h2>
              <p className="text-[12px] text-[#888888]">Éditeur complet · Tu sais ce que tu veux</p>
            </div>
            <span className="text-[#CCCCCC] group-hover:text-[#0D6E6E] text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Vault */}
      {vaultCount > 0 && (
        <div className="px-6 md:px-14 pb-6 max-w-2xl mx-auto w-full">
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
        </div>
      )}

      <div className="pb-20 md:pb-10" />
    </div>
  );
}
