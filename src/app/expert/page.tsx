"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import {
  generateClaudeMd,
  generateSettingsJson,
  generateClaudeIgnore,
  generateMcpJson,
  generateRuleFiles,
  generateAllFiles,
} from "@/lib/generator";
import { downloadAsZip, downloadSingleFile, formatFileSize } from "@/lib/download";
import { saveToVault } from "@/lib/storage";
import type { GeneratedFile } from "@/types";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-white border border-[#E5E5E5] rounded-b-md rounded-tr-md">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0D6E6E] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#888888]">Chargement de l&apos;éditeur...</span>
      </div>
    </div>
  ),
});

interface EditorTab {
  id: string;
  label: string;
  language: "json" | "markdown" | "text";
  getValue: () => string;
  onUpdate?: (value: string) => void;
}

const DOC_LINKS = [
  {
    title: "CLAUDE.md",
    description: "Instructions, langue, ton, conventions de code.",
    url: "https://code.claude.com/docs/en/memory",
  },
  {
    title: "Settings",
    description: "Permissions, hooks, modele, environnement.",
    url: "https://code.claude.com/docs/en/settings",
  },
  {
    title: "Hooks",
    description: "Scripts qui s'executent automatiquement.",
    url: "https://code.claude.com/docs/en/hooks",
  },
  {
    title: "MCP Servers",
    description: "Connecter Claude a des outils externes.",
    url: "https://code.claude.com/docs/en/mcp",
  },
];

export default function ExpertPage() {
  const { config, dispatch } = useConfig();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("CLAUDE.md");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Track local edits — synced to context on save
  const [localClaudeMd, setLocalClaudeMd] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<string | null>(null);
  const [localClaudeIgnore, setLocalClaudeIgnore] = useState<string | null>(null);
  const [localMcpJson, setLocalMcpJson] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const generatedClaudeMd = useMemo(() => generateClaudeMd(config), [config]);
  const generatedSettings = useMemo(() => generateSettingsJson(config), [config]);
  const generatedClaudeIgnore = useMemo(() => generateClaudeIgnore(config), [config]);
  const generatedMcpJson = useMemo(() => generateMcpJson(config), [config]);
  const generatedRules = useMemo(() => generateRuleFiles(config), [config]);

  // Build tabs dynamically
  const tabs: EditorTab[] = useMemo(() => {
    const t: EditorTab[] = [
      {
        id: "CLAUDE.md",
        label: "CLAUDE.md",
        language: "markdown",
        getValue: () => localClaudeMd ?? generatedClaudeMd,
        onUpdate: (v: string) => setLocalClaudeMd(v),
      },
      {
        id: "settings.json",
        label: "settings.json",
        language: "json",
        getValue: () => localSettings ?? generatedSettings,
        onUpdate: (v: string) => setLocalSettings(v),
      },
      {
        id: ".claudeignore",
        label: ".claudeignore",
        language: "text",
        getValue: () => localClaudeIgnore ?? generatedClaudeIgnore,
        onUpdate: (v: string) => setLocalClaudeIgnore(v),
      },
    ];

    if (config.enableMCP && generatedMcpJson) {
      t.push({
        id: ".mcp.json",
        label: ".mcp.json",
        language: "json",
        getValue: () => localMcpJson ?? generatedMcpJson,
        onUpdate: (v: string) => setLocalMcpJson(v),
      });
    }

    if (config.enableRules) {
      for (const rule of generatedRules) {
        t.push({
          id: rule.path,
          label: rule.path.split("/").pop() || rule.path,
          language: "markdown",
          getValue: () => rule.content,
        });
      }
    }

    return t;
  }, [config, generatedClaudeMd, generatedSettings, generatedClaudeIgnore, generatedMcpJson, generatedRules, localClaudeMd, localSettings, localClaudeIgnore, localMcpJson]);

  const activeTabDef = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Build files for download (using local edits if any)
  const getFilesForDownload = useCallback((): GeneratedFile[] => {
    const files: GeneratedFile[] = [];

    const claudeMd = localClaudeMd ?? generatedClaudeMd;
    files.push({ path: "CLAUDE.md", content: claudeMd, size: new TextEncoder().encode(claudeMd).length });

    const settings = localSettings ?? generatedSettings;
    files.push({ path: ".claude/settings.json", content: settings, size: new TextEncoder().encode(settings).length });

    const claudeIgnore = localClaudeIgnore ?? generatedClaudeIgnore;
    files.push({ path: ".claudeignore", content: claudeIgnore, size: new TextEncoder().encode(claudeIgnore).length });

    if (config.enableMCP && generatedMcpJson) {
      const mcpContent = localMcpJson ?? generatedMcpJson;
      files.push({ path: ".mcp.json", content: mcpContent, size: new TextEncoder().encode(mcpContent).length });
    }

    files.push(...generatedRules);

    return files;
  }, [localClaudeMd, localSettings, localClaudeIgnore, localMcpJson, generatedClaudeMd, generatedSettings, generatedClaudeIgnore, generatedMcpJson, generatedRules, config.enableMCP]);

  const allFiles = getFilesForDownload();
  const totalSize = allFiles.reduce((a, f) => a + f.size, 0);

  // Sync all local edits to ConfigContext
  const syncEditsToContext = () => {
    if (localClaudeMd !== null) {
      dispatch({ type: "IMPORT_CLAUDE_MD", content: localClaudeMd });
    }
    if (localClaudeIgnore !== null) {
      dispatch({ type: "SET_FIELD", field: "claudeIgnoreContent", value: localClaudeIgnore });
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsZip(allFiles);
      addToast("Configuration téléchargée !");
    } catch {
      addToast("Erreur lors du téléchargement", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!saveName.trim()) return;
    // Sync edits then save with the actual file contents
    syncEditsToContext();
    // Build a config snapshot with synced edits
    const configSnapshot = {
      ...config,
      ...(localClaudeMd !== null ? { claudeMdContent: localClaudeMd, claudeMdImported: true } : {}),
      ...(localClaudeIgnore !== null ? { claudeIgnoreContent: localClaudeIgnore } : {}),
    };
    saveToVault(saveName.trim(), configSnapshot);
    addToast("Sauvegardé dans le Vault");
    setShowSaveDialog(false);
    setSaveName("");
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          breadcrumb="EXPERT MODE"
          title="Éditeur de Configuration"
          subtitle="Édite directement tes fichiers de configuration Claude Code."
        />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-10 pb-20 md:pb-10 overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 font-[family-name:var(--font-jetbrains)] text-[13px] rounded-t-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-[#0D6E6E] font-semibold border-t border-l border-r border-[#E5E5E5]"
                      : "bg-[#F5F5F5] text-[#888888] hover:text-[#666666]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div className="flex-1 bg-white border border-[#E5E5E5] rounded-b-md rounded-tr-md overflow-hidden">
              <CodeEditor
                key={activeTabDef.id}
                value={activeTabDef.getValue()}
                onChange={(val: string) => activeTabDef.onUpdate?.(val)}
                language={activeTabDef.language}
                height="100%"
              />
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4 text-xs text-[#888888]">
                <span>{allFiles.length} fichiers</span>
                <span>{formatFileSize(totalSize)}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const file = allFiles.find(f => f.path === activeTab) || allFiles.find(f => f.path.endsWith(activeTab));
                    if (file) { downloadSingleFile(file); addToast(`${file.path} téléchargé`); }
                  }}
                  className="px-4 py-2 text-sm text-[#888888] border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors"
                >
                  Fichier seul
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 text-sm text-[#0D6E6E] border border-[#0D6E6E] rounded-lg hover:bg-[#F0FAFA] transition-colors"
                >
                  Sauver dans le Vault
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded-lg hover:bg-[#0A5555] transition-colors disabled:opacity-60"
                >
                  {isDownloading ? "Téléchargement..." : "Télécharger le ZIP"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Documentation */}
          <div className="hidden lg:flex w-80 flex-col gap-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded-lg p-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                Documentation
              </span>
              <a
                href="https://code.claude.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#0D6E6E] hover:underline"
              >
                code.claude.com/docs
              </a>
            </div>

            <div className="flex flex-col gap-3">
              {DOC_LINKS.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 p-3 rounded-md border bg-white border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors"
                >
                  <span className="text-[13px] font-medium text-[#1A1A1A]">
                    {item.title}
                  </span>
                  <span className="text-xs text-[#666666]">
                    {item.description}
                  </span>
                </a>
              ))}
            </div>

            {/* Quick tips */}
            <div className="mt-auto p-3 bg-[#F0FAFA] border border-[#0D6E6E] rounded-md">
              <span className="text-[13px] font-medium text-[#0D6E6E]">Astuce</span>
              <p className="text-xs text-[#666666] mt-1">
                Les modifications dans l&apos;editeur sont en temps reel. Telecharge le ZIP quand tu es satisfait.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Sauvegarder la configuration">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">Nom de la configuration</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveToVault()}
              placeholder="Ma config Claude..."
              className="w-full px-3 py-2 border border-[#E5E5E5] rounded mb-4 focus:outline-none focus:border-[#0D6E6E]"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-sm text-[#666666] hover:text-[#1A1A1A]"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveToVault}
                className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
