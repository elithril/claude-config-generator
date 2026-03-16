"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadVault } from "@/lib/storage";

const FILE_LINES = [
  { file: "CLAUDE.md", lines: ["# Configuration Claude Code", "## Langue", "Toujours répondre en français.", "## Ton", "Professionnel et direct."] },
  { file: "settings.json", lines: ['{', '  "model": "claude-sonnet-4-6",', '  "language": "french",', '  "permissions": {', '    "allow": ["Bash(npm run *)"]', '  }', '}'] },
  { file: ".claudeignore", lines: ["node_modules/", "dist/", ".env", ".env.*", ".DS_Store"] },
];

export default function TestHomePage() {
  const router = useRouter();
  const [vaultCount, setVaultCount] = useState(0);
  const [activeFile, setActiveFile] = useState(0);

  useEffect(() => {
    setVaultCount(loadVault().length);
  }, []);

  // Cycle through files
  useEffect(() => {
    const timer = setInterval(() => setActiveFile(f => (f + 1) % FILE_LINES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const currentFile = FILE_LINES[activeFile];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero with pattern background */}
      <div className="relative overflow-hidden">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, #0D6E6E 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0FAFA] via-[#FAFAFA] to-[#FAFAFA]" />

        <div className="relative px-6 md:px-14 pt-10 md:pt-16 pb-10">
          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-4 block">
                CLAUDE CODE CONFIG
              </span>
              <h1 className="font-[family-name:var(--font-newsreader)] text-[36px] md:text-[48px] font-medium text-[#1A1A1A] tracking-[-2px] leading-[1.1] mb-5">
                Configure Claude Code<br />
                <span className="text-[#0D6E6E]">en quelques clics.</span>
              </h1>
              <p className="text-[15px] text-[#666666] leading-[1.7] max-w-md mx-auto lg:mx-0">
                Génère tes fichiers de configuration — CLAUDE.md, settings.json, hooks, MCP&nbsp;servers — prêts à déposer dans ton projet.
              </p>
            </div>

            {/* Right: File preview animation */}
            <div className="w-full lg:w-[340px] flex-shrink-0">
              <div className="bg-[#1A1A1A] rounded-xl overflow-hidden shadow-2xl shadow-black/10">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#252525] border-b border-[#333333]">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  </div>
                  {/* File tabs */}
                  <div className="flex gap-1 ml-3">
                    {FILE_LINES.map((f, i) => (
                      <button
                        key={f.file}
                        onClick={() => setActiveFile(i)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                          i === activeFile ? "bg-[#0D6E6E] text-white" : "text-[#666666] hover:text-[#888888]"
                        }`}
                      >
                        {f.file}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Code content */}
                <div className="p-4 min-h-[180px]">
                  {currentFile.lines.map((line, i) => (
                    <div
                      key={`${activeFile}-${i}`}
                      className="flex gap-3 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      <span className="text-[11px] font-mono text-[#555555] select-none w-4 text-right">{i + 1}</span>
                      <span className={`text-[12px] font-mono leading-[1.8] ${
                        line.startsWith("#") || line.startsWith("//") ? "text-[#0D6E6E]" :
                        line.includes(":") ? "text-[#E07B54]" :
                        "text-[#CCCCCC]"
                      }`}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two main paths */}
      <div className="px-6 md:px-14 pb-6 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/wizard")}
            className="group flex flex-col gap-4 p-6 md:p-8 bg-[#0D6E6E] rounded-xl text-left hover:bg-[#0A5555] transition-colors"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">✦</span>
            </div>
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Pas à pas</h2>
              <p className="text-[14px] text-white/70 leading-relaxed">
                Réponds à quelques questions, on génère tout pour toi. Idéal pour débuter.
              </p>
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors mt-auto">
              4 étapes · ~2 min →
            </span>
          </button>

          <button
            onClick={() => router.push("/expert")}
            className="group flex flex-col gap-4 p-6 md:p-8 bg-white border-2 border-[#E5E5E5] rounded-xl text-left hover:border-[#0D6E6E] transition-colors"
          >
            <div className="w-12 h-12 bg-[#F0F0F0] rounded-lg flex items-center justify-center group-hover:bg-[#F0FAFA] transition-colors">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h2 className="text-xl font-medium text-[#1A1A1A] mb-1">Configuration directe</h2>
              <p className="text-[14px] text-[#666666] leading-relaxed">
                Édite directement tes fichiers avec coloration syntaxique. Tu sais ce que tu veux.
              </p>
            </div>
            <span className="text-sm text-[#AAAAAA] group-hover:text-[#0D6E6E] transition-colors mt-auto">
              Éditeur complet →
            </span>
          </button>
        </div>
      </div>

      {/* Vault quick access */}
      {vaultCount > 0 && (
        <div className="px-6 md:px-14 pb-6 max-w-3xl mx-auto w-full">
          <button
            onClick={() => router.push("/vault")}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 bg-[#F0FAFA] rounded-lg flex items-center justify-center text-sm">🔐</span>
              <div className="text-left">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {vaultCount} configuration{vaultCount > 1 ? "s" : ""} sauvegardée{vaultCount > 1 ? "s" : ""}
                </span>
                <p className="text-xs text-[#888888]">Reprendre ou exporter une config existante</p>
              </div>
            </div>
            <span className="text-sm text-[#0D6E6E]">→</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 md:px-14 pb-20 md:pb-10 mt-auto max-w-3xl mx-auto w-full">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[#AAAAAA]">
          <span className="font-[family-name:var(--font-jetbrains)]">CLAUDE.md</span>
          <span>·</span>
          <span className="font-[family-name:var(--font-jetbrains)]">settings.json</span>
          <span>·</span>
          <span className="font-[family-name:var(--font-jetbrains)]">.claudeignore</span>
          <span>·</span>
          <span className="font-[family-name:var(--font-jetbrains)]">.mcp.json</span>
          <span>·</span>
          <span className="font-[family-name:var(--font-jetbrains)]">.claude/rules/</span>
        </div>
      </div>
    </div>
  );
}
