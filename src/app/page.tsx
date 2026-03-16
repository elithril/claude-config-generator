"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, FeatureCard } from "@/components";
import { loadVault } from "@/lib/storage";

type ModeType = "guided" | "manual";

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<ModeType>("manual");
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    setVaultCount(loadVault().length);
  }, []);

  return (
      <div className="flex flex-col h-full overflow-auto">
        <PageHeader
          title="Configuration Generator"
          subtitle="Create, manage and share your Claude Code configuration files with elegance."
        />

        {/* Hero Section */}
        <div className="flex-1 bg-[#FAFAFA] px-6 md:px-14 pb-20 md:pb-8 min-h-0">
          {/* Mode Selector */}
          <div className="bg-[#F0F0F0] rounded-2xl p-10 flex flex-col items-center gap-4 mb-8">
            <h2 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] text-center">
              Comment veux-tu configurer ?
            </h2>
            <p className="text-[15px] text-[#1A1A1A] text-center">
              Choisis ton approche préférée.
            </p>

            <div className="flex gap-4 mt-2">
              {/* Bouton Guidé */}
              <button
                onClick={() => setSelectedMode("guided")}
                className={`flex flex-col items-center gap-2 px-8 py-5 rounded-lg transition-all w-40 border ${
                  selectedMode === "guided"
                    ? "bg-[#0D6E6E] border-[#0D6E6E]"
                    : "bg-white border-[#E07B54]"
                }`}
              >
                <span className={`text-3xl ${selectedMode === "guided" ? "text-white" : "text-[#E07B54]"}`}>✦</span>
                <span
                  className={`text-sm font-medium ${
                    selectedMode === "guided" ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  Guidé
                </span>
                <span className={`text-[11px] text-center ${selectedMode === "guided" ? "text-white/70" : "text-[#888888]"}`}>
                  Wizard pas à pas
                </span>
              </button>

              {/* Bouton Manuel */}
              <button
                onClick={() => setSelectedMode("manual")}
                className={`flex flex-col items-center gap-2 px-8 py-5 rounded-lg transition-all w-40 border ${
                  selectedMode === "manual"
                    ? "bg-[#0D6E6E] border-[#0D6E6E]"
                    : "bg-white border-[#E07B54]"
                }`}
              >
                <span className={`text-3xl ${selectedMode === "manual" ? "text-white" : "text-[#E07B54]"}`}>⌨</span>
                <span
                  className={`text-sm font-medium ${
                    selectedMode === "manual" ? "text-white" : "text-[#1A1A1A]"
                  }`}
                >
                  Manuel
                </span>
                <span
                  className={`text-[11px] text-center ${
                    selectedMode === "manual" ? "text-white/70" : "text-[#888888]"
                  }`}
                >
                  Édition directe
                </span>
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon="✦"
              iconBg="#0D6E6E"
              title="Wizard Mode"
              description="Answer guided questions to generate your perfect configuration step by step."
              buttonText="Start Wizard →"
              buttonHref="/wizard"
              buttonVariant="primary"
              stats={[
                { value: "5 steps", label: "Quick setup", highlight: true },
                { value: "~2 min", label: "Average time" },
              ]}
            />

            <FeatureCard
              icon="⚡"
              iconBg="#E07B54"
              title="Expert Mode"
              description="Skip the wizard and directly edit your configuration files with full control."
              buttonText="Open Editor"
              buttonHref="/expert"
              buttonVariant="secondary"
              stats={[
                { value: "Full control", label: "Advanced users", highlight: true },
                { value: "YAML/JSON", label: "Formats" },
              ]}
              disabled={selectedMode === "guided"}
            />

            <FeatureCard
              icon="◈"
              iconBg="#1A1A1A"
              title="Template Library"
              description="Browse and use pre-made templates for common development setups."
              buttonText="Browse Templates"
              buttonHref="/library"
              buttonVariant="secondary"
              stats={[
                { value: "20+", label: "Templates" },
                { value: "Community", label: "Contributed" },
              ]}
            />
          </div>

          {/* Vault quick access */}
          {vaultCount > 0 && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-[#E5E5E5] flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {vaultCount} configuration{vaultCount > 1 ? "s" : ""} sauvegardée{vaultCount > 1 ? "s" : ""}
                </span>
                <p className="text-xs text-[#888888]">Restaurez ou exportez vos configs depuis le Vault.</p>
              </div>
              <Link
                href="/vault"
                className="text-sm font-medium text-[#0D6E6E] hover:underline"
              >
                Ouvrir le Vault
              </Link>
            </div>
          )}
        </div>
      </div>
  );
}
