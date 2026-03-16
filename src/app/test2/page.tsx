"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadVault } from "@/lib/storage";

const FILE_LINES = [
  { file: "CLAUDE.md", lines: [
    "# Configuration Claude Code",
    "",
    "## Langue",
    "Toujours répondre en français.",
    "",
    "## Ton",
    "Professionnel et direct. Pas de politesses",
    "superflues.",
    "",
    "## Style de réponse",
    "Réponses concises. Pour le code, montre",
    "uniquement les blocs modifiés (diffs) avec",
    "le chemin du fichier au-dessus.",
    "",
    "## Sécurité",
    "- Ne jamais exécuter de commandes destructrices",
    "- Toujours vérifier les fichiers avant modification",
    "- Préférer les opérations réversibles",
  ]},
  { file: "settings.json", lines: [
    '{',
    '  "$schema": "https://json.schemastore.org/claude-code-settings.json",',
    '  "model": "claude-sonnet-4-6",',
    '  "language": "french",',
    '  "effortLevel": "high",',
    '  "alwaysThinkingEnabled": true,',
    '  "permissions": {',
    '    "allow": [',
    '      "Bash(npm run *)",',
    '      "Bash(npx *)",',
    '      "Bash(git *)"',
    '    ],',
    '    "deny": [',
    '      "Read(./.env)",',
    '      "Read(./.env.*)",',
    '      "Bash(rm -rf *)"',
    '    ],',
    '    "defaultMode": "acceptEdits"',
    '  },',
    '  "hooks": {',
    '    "PostToolUse": [{',
    '      "matcher": "Write|Edit",',
    '      "hooks": [{ "type": "command",',
    '        "command": "npx eslint --fix $FILE" }]',
    '    }]',
    '  }',
    '}',
  ]},
  { file: ".mcp.json", lines: [
    '{',
    '  "mcpServers": {',
    '    "github": {',
    '      "type": "http",',
    '      "url": "https://api.githubcopilot.com/mcp/"',
    '    },',
    '    "chrome-devtools": {',
    '      "command": "npx",',
    '      "args": ["-y", "chrome-devtools-mcp@latest"]',
    '    },',
    '    "sentry": {',
    '      "type": "http",',
    '      "url": "https://mcp.sentry.dev/mcp"',
    '    }',
    '  }',
    '}',
  ]},
  { file: ".claudeignore", lines: [
    "# Dependencies",
    "node_modules/",
    "",
    "# Build output",
    "dist/",
    ".next/",
    "build/",
    "",
    "# Environment",
    ".env",
    ".env.*",
    "",
    "# Secrets",
    "secrets/",
    "*.pem",
    "*.key",
  ]},
];

export default function Test2HomePage() {
  const router = useRouter();
  const [vaultCount, setVaultCount] = useState(0);
  const [activeFile, setActiveFile] = useState(0);

  useEffect(() => { setVaultCount(loadVault().length); }, []);
  // Auto-cycle with reset on manual click
  const [cycleKey, setCycleKey] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveFile(f => (f + 1) % FILE_LINES.length), 5000);
    return () => clearInterval(timer);
  }, [cycleKey]);

  const selectFile = (i: number) => {
    setActiveFile(i);
    setCycleKey(k => k + 1); // reset timer
  };

  const currentFile = FILE_LINES[activeFile];

  return (
    <div className="flex flex-col h-full">
      {/* Split hero — fills viewport, no scroll */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* Left: dark — 40% */}
        <div className="lg:w-[40%] bg-[#1A1A1A] relative overflow-hidden flex flex-col justify-between p-8 md:p-12 lg:p-14">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(#0D6E6E 1px, transparent 1px), linear-gradient(90deg, #0D6E6E 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Top: title */}
          <div className="relative z-10">
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-5 block">
              CLAUDE CODE CONFIG
            </span>
            <h1 className="font-[family-name:var(--font-newsreader)] text-[34px] lg:text-[44px] font-medium text-white tracking-[-2px] leading-[1.15] mb-6">
              Configure<br />Claude Code<br />
              <span className="text-[#0D6E6E]">en quelques clics.</span>
            </h1>
            <p className="text-[15px] text-[#777777] leading-[1.8] max-w-sm">
              Génère tes fichiers de configuration — CLAUDE.md, settings.json, hooks, MCP&nbsp;servers — prêts à déposer dans ton projet.
            </p>
          </div>

          {/* Middle: CTAs */}
          <div className="relative z-10 flex flex-col gap-3 my-6 lg:my-0">
            <button
              onClick={() => router.push("/wizard")}
              className="group flex items-center justify-between px-5 py-3.5 bg-[#0D6E6E] rounded-lg hover:bg-[#0A5555] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-white text-lg">✦</span>
                <div>
                  <span className="text-white text-sm font-medium block">Pas à pas</span>
                  <span className="text-white/50 text-[11px]">Guidé · 4 étapes · ~2 min</span>
                </div>
              </div>
              <span className="text-white/40 group-hover:text-white/80 text-lg">→</span>
            </button>
            <button
              onClick={() => router.push("/expert")}
              className="group flex items-center justify-between px-5 py-3.5 border border-[#333333] rounded-lg hover:border-[#0D6E6E] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">⚡</span>
                <div>
                  <span className="text-[#CCCCCC] text-sm font-medium block">Configuration directe</span>
                  <span className="text-[#555555] text-[11px]">Éditeur complet · Tu sais ce que tu veux</span>
                </div>
              </div>
              <span className="text-[#555555] group-hover:text-[#0D6E6E] text-lg">→</span>
            </button>
          </div>

          {/* Bottom: vault + file chips */}
          <div className="relative z-10 flex flex-col gap-3">
            {vaultCount > 0 && (
              <button
                onClick={() => router.push("/vault")}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#2A2A2A] hover:border-[#0D6E6E] transition-colors"
              >
                <span className="text-sm">🔐</span>
                <span className="text-[12px] text-[#888888]">{vaultCount} config{vaultCount > 1 ? "s" : ""} sauvegardée{vaultCount > 1 ? "s" : ""}</span>
                <span className="text-[#555555] text-xs ml-auto">→</span>
              </button>
            )}
            <div className="flex flex-wrap gap-1.5">
              {["CLAUDE.md", "settings.json", ".claudeignore", ".mcp.json", "rules/"].map(file => (
                <span key={file} className="px-2 py-1 rounded text-[10px] font-mono text-[#555555] bg-[#252525]">
                  {file}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: code preview — 60% */}
        <div className="lg:w-[60%] bg-[#111111] flex flex-col relative overflow-hidden">
          {/* Gradient blend from left panel */}
          <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10" />

          {/* Top bar with tabs */}
          <div className="flex items-center justify-between px-6 lg:pl-28 pr-6 pt-5 pb-3 relative z-20">
            <div className="flex gap-1">
              {FILE_LINES.map((f, i) => (
                <button
                  key={f.file}
                  onClick={() => selectFile(i)}
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
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
          </div>

          {/* Code area */}
          <div className="flex-1 px-6 lg:pl-28 pr-8 pb-6 overflow-auto relative z-20">
            {currentFile.lines.map((line, i) => (
              <div
                key={`${activeFile}-${i}`}
                className="flex gap-4 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <span className="text-[12px] font-mono text-[#333333] select-none w-5 text-right flex-shrink-0">{i + 1}</span>
                <span className={`text-[13px] font-mono leading-[2] ${
                  line === "" ? "h-[2em]" :
                  line.startsWith("#") ? "text-[#0D6E6E] font-medium" :
                  line.startsWith("//") ? "text-[#444444]" :
                  line.includes('":') ? "text-[#E07B54]" :
                  line.startsWith("  ") && /^[\s{}[\]]/.test(line.trim()) ? "text-[#555555]" :
                  "text-[#999999]"
                }`}>
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom: progress */}
          <div className="flex items-center justify-between px-6 lg:pl-28 pr-6 pb-5 relative z-20">
            <span className="text-[10px] font-mono text-[#333333]">{currentFile.lines.length} lignes · UTF-8</span>
            <div className="flex gap-2">
              {FILE_LINES.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === activeFile ? "bg-[#0D6E6E] w-6" : "bg-[#252525] w-1.5"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
