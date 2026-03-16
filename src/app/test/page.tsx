"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadVault } from "@/lib/storage";

export default function TestHomePage() {
  const router = useRouter();
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    setVaultCount(loadVault().length);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero */}
      <div className="px-6 md:px-14 pt-12 md:pt-20 pb-10 text-center">
        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-4 block">
          CLAUDE CODE CONFIG
        </span>
        <h1 className="font-[family-name:var(--font-newsreader)] text-[36px] md:text-[48px] font-medium text-[#1A1A1A] tracking-[-2px] leading-[1.1] mb-5">
          Configure Claude Code<br />
          <span className="text-[#0D6E6E]">en quelques clics.</span>
        </h1>
        <p className="text-[16px] text-[#666666] leading-[1.6] max-w-lg mx-auto">
          Génère tes fichiers de configuration — CLAUDE.md, settings.json, hooks, MCP&nbsp;servers — prêts à déposer dans ton projet.
        </p>
      </div>

      {/* Two main paths */}
      <div className="px-6 md:px-14 pb-6 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Path 1: Guided */}
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

          {/* Path 2: Direct */}
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

      {/* What gets generated */}
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
