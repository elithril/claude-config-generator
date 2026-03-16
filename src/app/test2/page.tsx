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
            <h1 className="font-[family-name:var(--font-newsreader)] text-[32px] lg:text-[40px] font-medium text-white tracking-[-1.5px] leading-[1.25] mb-10">
              Claude Code, optimisé pour <span className="text-[#0D6E6E] italic">ton</span> workflow.
            </h1>
            <p className="text-[16px] text-[#888888] leading-[1.8]">
              La plupart des devs utilisent Claude Code avec les réglages par défaut. Permissions, hooks, MCP&nbsp;servers, rules — en 2&nbsp;minutes, configure tout pour que Claude comprenne ton projet, respecte tes conventions, et travaille comme tu veux.
            </p>
          </div>

          {/* Value points — top of middle zone */}
          <div className="relative z-10 flex flex-col gap-3 mt-auto">
            {[
              { icon: "✦", text: "Découvre des options que tu ne connaissais pas" },
              { icon: "↓", text: "Télécharge un ZIP prêt à déposer dans ton projet" },
              { icon: "◆", text: "Sauvegarde tes configs par projet dans le Vault" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-[#0D6E6E] text-xs w-4 text-center flex-shrink-0">{icon}</span>
                <span className="text-[13px] text-[#777777]">{text}</span>
              </div>
            ))}
          </div>

          {/* CTAs — centered between value points and vault */}
          <div className="relative z-10 flex flex-col gap-3 my-auto">
            <button
              onClick={() => router.push("/wizard")}
              className="group w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#0D6E6E] rounded-xl cursor-pointer hover:bg-[#0A5555] transition-all hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-[#0D6E6E]/20"
            >
              <span className="text-white text-[15px] font-medium">
                Optimiser mon setup
              </span>
              <svg className="text-white/60 group-hover:text-white transition-colors" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/expert")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl cursor-pointer border border-[#333333] hover:border-[#0D6E6E] text-[#777777] hover:text-[#0D6E6E] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="text-[13px] font-medium">Éditer directement</span>
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
                <span className={`text-[13px] font-mono leading-[2] whitespace-pre ${
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
