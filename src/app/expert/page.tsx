"use client";

import { useState } from "react";
import { Layout, PageHeader } from "@/components";

const tabs = ["CLAUDE.md", "settings.json", ".claudeignore"];

const fileContents: Record<string, { text: string; highlight: boolean }[]> = {
  "CLAUDE.md": [
    { text: "# Configuration Claude Code", highlight: true },
    { text: "", highlight: false },
    { text: "## Langue", highlight: true },
    { text: "Toujours répondre en français.", highlight: false },
    { text: "", highlight: false },
    { text: "## Ton", highlight: true },
    { text: "Style décontracté et amical.", highlight: false },
    { text: "|", highlight: true },
  ],
  "settings.json": [
    { text: "{", highlight: false },
    { text: '  "model": "sonnet",', highlight: true },
    { text: '  "language": "fr",', highlight: false },
    { text: '  "permissions": {', highlight: false },
    { text: '    "allow": ["Read", "Write"],', highlight: false },
    { text: '    "deny": ["Bash"]', highlight: false },
    { text: "  },", highlight: false },
    { text: '  "style": "concise"', highlight: true },
    { text: "}", highlight: false },
  ],
  ".claudeignore": [
    { text: "# Fichiers à ignorer", highlight: true },
    { text: "node_modules/", highlight: false },
    { text: ".git/", highlight: false },
    { text: ".env", highlight: false },
    { text: "*.log", highlight: false },
    { text: "dist/", highlight: false },
  ],
};

const docItems = [
  {
    title: "Structure du fichier",
    description: "Comment organiser les sections et instructions.",
    highlight: false,
  },
  {
    title: "Variables disponibles",
    description: "Liste des variables et placeholders.",
    highlight: false,
  },
  {
    title: "💡 Astuce",
    description: "Utilise des sections markdown pour organiser tes instructions.",
    highlight: true,
  },
];

export default function ExpertPage() {
  const [activeTab, setActiveTab] = useState("CLAUDE.md");
  const [docSearch, setDocSearch] = useState("");

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          title="Éditeur de Configuration"
          subtitle="Édite directement tes fichiers de configuration Claude Code."
        />

        {/* Editor Area */}
        <div className="flex-1 flex gap-6 px-10 pb-10 overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="flex-1 flex flex-col">
            {/* Tabs */}
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 font-[family-name:var(--font-jetbrains)] text-[13px] rounded-t-md transition-colors ${
                    activeTab === tab
                      ? "bg-white text-[#0D6E6E] font-semibold border-t border-l border-r border-[#E5E5E5]"
                      : "bg-[#F5F5F5] text-[#888888]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div className="flex-1 bg-white border border-[#E5E5E5] rounded-b-md rounded-tr-md p-6 overflow-auto">
              <div className="flex flex-col gap-2">
                {fileContents[activeTab]?.map((line, index) => (
                  <span
                    key={index}
                    className={`font-[family-name:var(--font-jetbrains)] text-[13px] ${
                      line.highlight ? "text-[#0D6E6E]" : "text-[#666666]"
                    }`}
                  >
                    {line.text || "\u00A0"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Documentation */}
          <div className="w-80 flex flex-col gap-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded-lg p-5">
            {/* Doc Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                📚 Documentation
              </span>
              <a
                href="https://docs.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#0D6E6E] hover:underline"
              >
                docs.anthropic.com ↗
              </a>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-[#E0E0E0] rounded px-3 py-2.5">
              <span className="text-sm text-[#888888]">⌕</span>
              <input
                type="text"
                placeholder="Rechercher dans la doc..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="flex-1 text-[13px] text-[#1A1A1A] placeholder:text-[#AAAAAA] outline-none bg-transparent"
              />
            </div>

            {/* Section */}
            <div className="flex flex-col gap-3">
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#888888] tracking-[1px]">
                {activeTab.toUpperCase()}
              </span>

              {docItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 p-3 rounded-md border ${
                    item.highlight
                      ? "bg-[#F0FAFA] border-[#0D6E6E]"
                      : "bg-white border-[#E5E5E5]"
                  }`}
                >
                  <span
                    className={`text-[13px] font-medium ${
                      item.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-xs text-[#666666]">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
