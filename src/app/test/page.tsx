"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { loadVault } from "@/lib/storage";
import { TEMPLATES } from "@/data/templates";

const QUICK_PRESETS = TEMPLATES.filter(t => t.popular).slice(0, 4);

export default function TestHomePage() {
  const router = useRouter();
  const { dispatch } = useConfig();
  const { addToast } = useToast();
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    setVaultCount(loadVault().length);
  }, []);

  const handlePreset = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    dispatch({ type: "LOAD_TEMPLATE", config: template.config });
    addToast(`Preset "${template.title}" chargé`);
    router.push("/expert");
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero */}
      <div className="px-6 md:px-14 pt-10 md:pt-16 pb-8">
        <div className="max-w-2xl">
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-3 block">
            CLAUDE CODE CONFIG
          </span>
          <h1 className="font-[family-name:var(--font-newsreader)] text-[36px] md:text-[48px] font-medium text-[#1A1A1A] tracking-[-2px] leading-[1.1] mb-4">
            Configure Claude Code<br />
            <span className="text-[#0D6E6E]">en quelques clics.</span>
          </h1>
          <p className="text-[16px] text-[#666666] leading-[1.6] max-w-lg">
            Génère tes fichiers de configuration — CLAUDE.md, settings.json, hooks, MCP servers — prêts à déposer dans ton projet.
          </p>
        </div>
      </div>

      {/* Two main paths */}
      <div className="px-6 md:px-14 pb-8">
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
                Réponds à quelques questions, on génère tout pour toi. Idéal si tu débutes avec Claude Code.
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
                Édite directement tes fichiers avec coloration syntaxique. Pour ceux qui savent ce qu&apos;ils veulent.
              </p>
            </div>
            <span className="text-sm text-[#AAAAAA] group-hover:text-[#0D6E6E] transition-colors mt-auto">
              Éditeur complet →
            </span>
          </button>
        </div>
      </div>

      {/* Quick presets */}
      <div className="px-6 md:px-14 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#1A1A1A]">Démarrage rapide</h3>
            <p className="text-xs text-[#888888]">Pars d&apos;un preset, affine ensuite dans l&apos;éditeur.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset.id)}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors text-left"
            >
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: preset.iconBg, color: preset.iconColor }}
              >
                {preset.icon}
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-[#1A1A1A] block truncate">{preset.title}</span>
                <span className="text-[11px] text-[#888888] block truncate">{preset.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Vault quick access */}
      {vaultCount > 0 && (
        <div className="px-6 md:px-14 pb-20 md:pb-8">
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

      {/* Footer info */}
      <div className="px-6 md:px-14 pb-20 md:pb-10 mt-auto">
        <div className="flex flex-wrap gap-6 text-xs text-[#AAAAAA]">
          <span>Génère : CLAUDE.md · settings.json · .claudeignore · .mcp.json · .claude/rules/</span>
        </div>
      </div>
    </div>
  );
}
