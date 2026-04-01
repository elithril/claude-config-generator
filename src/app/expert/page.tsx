"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import Modal from "@/components/Modal";
import { useT } from "@/i18n";

import CodeEditor from "@/components/CodeEditor";

interface EditorTab {
  id: string;
  label: string;
  language: "json" | "markdown" | "text";
  getValue: () => string;
  onUpdate?: (value: string) => void;
}

const DOC_LINK_KEYS = [
  { title: "CLAUDE.md", descKey: "expert.docClaudeMd", url: "https://code.claude.com/docs/en/memory" },
  { title: "Settings", descKey: "expert.docSettings", url: "https://code.claude.com/docs/en/settings" },
  { title: "Hooks", descKey: "expert.docHooks", url: "https://code.claude.com/docs/en/hooks" },
  { title: "MCP Servers", descKey: "expert.docMcp", url: "https://code.claude.com/docs/en/mcp" },
];

export default function ExpertPage() {
  const { config, dispatch, setHasUnsavedChanges, hasUnsavedChanges } = useConfig();
  const { addToast } = useToast();
  const t = useT();
  const [activeTab, setActiveTab] = useState("CLAUDE.md");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Track local edits — synced to context on save
  const [localClaudeMd, setLocalClaudeMd] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<string | null>(null);
  const [localClaudeIgnore, setLocalClaudeIgnore] = useState<string | null>(null);
  const [localMcpJson, setLocalMcpJson] = useState<string | null>(null);
  const [localRules, setLocalRules] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);

  // Warn before closing tab with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

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
        onUpdate: (v: string) => { setLocalClaudeMd(v); setHasUnsavedChanges(true); },
      },
      {
        id: "settings.json",
        label: "settings.json",
        language: "json",
        getValue: () => localSettings ?? generatedSettings,
        onUpdate: (v: string) => { setLocalSettings(v); setHasUnsavedChanges(true); },
      },
      {
        id: ".claudeignore",
        label: ".claudeignore",
        language: "text",
        getValue: () => localClaudeIgnore ?? generatedClaudeIgnore,
        onUpdate: (v: string) => { setLocalClaudeIgnore(v); setHasUnsavedChanges(true); },
      },
    ];

    if (config.enableMCP && generatedMcpJson) {
      t.push({
        id: ".mcp.json",
        label: ".mcp.json",
        language: "json",
        getValue: () => localMcpJson ?? generatedMcpJson,
        onUpdate: (v: string) => { setLocalMcpJson(v); setHasUnsavedChanges(true); },
      });
    }

    if (config.enableRules) {
      for (const rule of generatedRules) {
        const ruleId = rule.path;
        t.push({
          id: ruleId,
          label: rule.path.split("/").pop() || rule.path,
          language: "markdown",
          getValue: () => localRules[ruleId] ?? rule.content,
          onUpdate: (v: string) => { setLocalRules(prev => ({ ...prev, [ruleId]: v })); setHasUnsavedChanges(true); },
        });
      }
    }

    return t;
  }, [config, generatedClaudeMd, generatedSettings, generatedClaudeIgnore, generatedMcpJson, generatedRules, localClaudeMd, localSettings, localClaudeIgnore, localMcpJson, localRules]);

  const activeTabDef = tabs.find((t) => t.id === activeTab) || tabs[0];

  // JSON validation for settings.json and .mcp.json
  const jsonError = useMemo(() => {
    if (activeTabDef.language !== "json") return null;
    const value = activeTabDef.getValue();
    try { JSON.parse(value); return null; }
    catch (e) { return (e as Error).message; }
  }, [activeTabDef]);

  const hasLocalEdit = activeTab === "CLAUDE.md" ? localClaudeMd !== null
    : activeTab === "settings.json" ? localSettings !== null
    : activeTab === ".claudeignore" ? localClaudeIgnore !== null
    : activeTab === ".mcp.json" ? localMcpJson !== null
    : !!localRules[activeTab];

  const revertToGenerated = () => {
    if (activeTab === "CLAUDE.md") setLocalClaudeMd(null);
    else if (activeTab === "settings.json") setLocalSettings(null);
    else if (activeTab === ".claudeignore") setLocalClaudeIgnore(null);
    else if (activeTab === ".mcp.json") setLocalMcpJson(null);
    else setLocalRules(prev => { const next = { ...prev }; delete next[activeTab]; return next; });
  };

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

    for (const rule of generatedRules) {
      const content = localRules[rule.path] ?? rule.content;
      files.push({ path: rule.path, content, size: new TextEncoder().encode(content).length });
    }

    return files;
  }, [localClaudeMd, localSettings, localClaudeIgnore, localMcpJson, localRules, generatedClaudeMd, generatedSettings, generatedClaudeIgnore, generatedMcpJson, generatedRules, config.enableMCP]);

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
    // settings.json and .mcp.json are synced via the config snapshot in handleSaveToVault
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsZip(allFiles);
      addToast(t("toast.downloaded"));
    } catch {
      addToast(t("toast.downloadError"), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!saveName.trim()) return;
    syncEditsToContext();
    // Build config snapshot with ALL local edits
    const configSnapshot = {
      ...config,
      ...(localClaudeMd !== null ? { claudeMdContent: localClaudeMd, claudeMdImported: true } : {}),
      ...(localClaudeIgnore !== null ? { claudeIgnoreContent: localClaudeIgnore } : {}),
      ...(localSettings !== null ? { settingsJsonOverride: localSettings } : {}),
      ...(localMcpJson !== null ? { mcpJsonOverride: localMcpJson } : {}),
      ...(Object.keys(localRules).length > 0 ? { rulesOverrides: localRules } : {}),
    };
    saveToVault(saveName.trim(), configSnapshot);
    setHasUnsavedChanges(false);
    addToast(t("toast.saved"));
    setShowSaveDialog(false);
    setSaveName("");
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          breadcrumb={t("expert.breadcrumb")}
          title={t("expert.title")}
          subtitle={t("expert.subtitle")}
        />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-10 pb-20 md:pb-10 overflow-hidden">
          {/* Left Panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Configuration files">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls="editor-panel"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 font-[family-name:var(--font-jetbrains)] text-[13px] rounded-t-md transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-[#0D6E6E] font-semibold border-t border-l border-r border-[#E5E5E5]"
                      : "bg-[#F5F5F5] text-[#888888] hover:text-[#666666] hover:bg-[#EBEBEB] hover:-translate-y-[1px]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div id="editor-panel" role="tabpanel" className="flex-1 bg-white border border-[#E5E5E5] rounded-b-md rounded-tr-md overflow-hidden">
              <CodeEditor
                key={activeTabDef.id}
                value={activeTabDef.getValue()}
                onChange={(val: string) => activeTabDef.onUpdate?.(val)}
                language={activeTabDef.language}
                height="100%"
              />
            </div>

            {/* JSON validation error */}
            {jsonError && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded-b-md -mt-[1px]">
                {jsonError}
              </div>
            )}

            {/* Action bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-3">
              <div className="flex items-center gap-4 text-xs text-[#888888]">
                <span>{allFiles.length} {t("common.files")}</span>
                <span>{formatFileSize(totalSize)}</span>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {hasLocalEdit && (
                  <button
                    onClick={revertToGenerated}
                    className="px-4 py-2 text-sm text-[#E07B54] border border-[#E07B54]/30 rounded-lg hover:bg-[#FFF5F0] transition-colors"
                  >
                    {t("expert.revert")}
                  </button>
                )}
                <button
                  onClick={() => {
                    const content = activeTabDef.getValue();
                    navigator.clipboard.writeText(content);
                    addToast(t("toast.copied"));
                  }}
                  className="px-4 py-2 text-sm text-[#888888] border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  {t("expert.copy")}
                </button>
                <button
                  onClick={() => {
                    const file = allFiles.find(f => f.path === activeTab) || allFiles.find(f => f.path.endsWith(activeTab));
                    if (file) { downloadSingleFile(file); addToast(t("toast.fileSaved", { path: file.path })); }
                  }}
                  className="px-4 py-2 text-sm text-[#888888] border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  {t("expert.singleFile")}
                </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="px-4 py-2 text-sm text-[#0D6E6E] border border-[#0D6E6E] rounded-lg hover:bg-[#F0FAFA] transition-colors"
                >
                  {t("expert.saveVault")}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded-lg hover:bg-[#0A5555] transition-colors disabled:opacity-60"
                >
                  {isDownloading ? t("expert.downloading") : t("expert.download")}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Documentation */}
          <div className="hidden lg:flex w-80 flex-col gap-4 bg-[#F8F8F8] border border-[#E5E5E5] rounded-lg p-5 flex-shrink-0 mt-[46px]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {t("expert.docs")}
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
              {DOC_LINK_KEYS.map((item) => (
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
                    {t(item.descKey)}
                  </span>
                </a>
              ))}
            </div>

            {/* Quick tips */}
            <div className="mt-auto p-3 bg-[#F0FAFA] border border-[#0D6E6E] rounded-md">
              <span className="text-[13px] font-medium text-[#0D6E6E]">{t("expert.tip")}</span>
              <p className="text-xs text-[#666666] mt-1">
                {t("expert.tipText")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showSaveDialog} onClose={() => setShowSaveDialog(false)} title={t("modal.saveTitle")}>
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSaveToVault()}
          placeholder={t("modal.savePlaceholder")}
          className="w-full px-3 py-2 border border-[#E5E5E5] rounded mb-4 focus:outline-none focus:border-[#0D6E6E]"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm text-[#666666] hover:text-[#1A1A1A]">{t("modal.cancel")}</button>
          <button onClick={handleSaveToVault} className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]">{t("modal.save")}</button>
        </div>
      </Modal>
    </>
  );
}
