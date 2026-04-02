"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/i18n";
import { loadVault, deleteVaultEntry, toggleStar, saveToVault, updateVaultEntry } from "@/lib/storage";
import { generateAllFiles } from "@/lib/generator";
import { downloadAsZip, formatFileSize } from "@/lib/download";
import { importFromZip } from "@/lib/import";
import type { SavedConfig, ClaudeConfig } from "@/types";
import Modal from "@/components/Modal";

export default function VaultPage() {
  const router = useRouter();
  const { dispatch } = useConfig();
  const { addToast } = useToast();
  const { locale, t } = useI18n();
  const [vault, setVault] = useState<SavedConfig[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "name" | "starred">("date");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setVault(loadVault());
  }, []);

  const refreshVault = () => setVault(loadVault());

  const sortedVault = useMemo(() => {
    const filtered = search ? vault.filter(e => e.name.toLowerCase().includes(search.toLowerCase())) : vault;
    const sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "starred") {
      sorted.sort((a, b) => {
        if (a.starred === b.starred) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return a.starred ? -1 : 1;
      });
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return sorted;
  }, [vault, sortBy, search]);

  // Pre-compute file info for all vault entries to avoid regenerating on every render
  const vaultFileInfo = useMemo(() => {
    const info: Record<string, { fileCount: number; totalSize: number }> = {};
    for (const entry of vault) {
      const files = generateAllFiles(entry.config);
      info[entry.id] = {
        fileCount: files.length,
        totalSize: files.reduce((a, f) => a + f.size, 0),
      };
    }
    return info;
  }, [vault]);

  const stats = useMemo(() => [
    { value: String(vault.length), label: t("vault.savedConfigs") },
    {
      value: String(vault.filter((c) => c.starred).length),
      label: t("vault.favorites"),
      highlight: true,
    },
  ], [vault, t]);

  const handleToggleStar = (id: string) => {
    const entry = vault.find(e => e.id === id);
    toggleStar(id);
    refreshVault();
    addToast(entry?.starred ? t("vault.unstarred") : t("vault.starred"));
  };

  const handleExport = async (entry: SavedConfig) => {
    try {
      const files = generateAllFiles(entry.config);
      await downloadAsZip(files, entry.name);
      addToast(t("toast.exported", { name: entry.name }));
    } catch {
      addToast(t("toast.downloadError"), "error");
    }
  };

  const [restoreTarget, setRestoreTarget] = useState<SavedConfig | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<SavedConfig | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [renameTarget, setRenameTarget] = useState<SavedConfig | null>(null);
  const [renameName, setRenameName] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importedConfig, setImportedConfig] = useState<{ config: ClaudeConfig; suggestedName: string } | null>(null);
  const [importName, setImportName] = useState("");

  const handleRestore = (entry: SavedConfig, target: "wizard" | "expert") => {
    dispatch({ type: "SET_CONFIG", config: entry.config });
    addToast(t("toast.restored", { name: entry.name }));
    setRestoreTarget(null);
    router.push(`/${target}`);
  };

  const handleDuplicate = () => {
    if (!duplicateTarget || !duplicateName.trim()) return;
    saveToVault(duplicateName.trim(), duplicateTarget.config);
    refreshVault();
    addToast(t("vault.duplicated", { name: duplicateName.trim() }));
    setDuplicateTarget(null);
    setDuplicateName("");
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const config = await importFromZip(file);
      const suggestedName = file.name.replace(/\.zip$/i, "");
      setImportedConfig({ config, suggestedName });
      setImportName(suggestedName);
    } catch {
      addToast(t("vault.importError"), "error");
    }
    if (importInputRef.current) importInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    if (!importedConfig || !importName.trim()) return;
    saveToVault(importName.trim(), importedConfig.config);
    refreshVault();
    addToast(t("vault.imported", { name: importName.trim() }));
    setImportedConfig(null);
    setImportName("");
  };

  const handleRename = () => {
    if (!renameTarget || !renameName.trim()) return;
    updateVaultEntry(renameTarget.id, { name: renameName.trim() });
    refreshVault();
    addToast(t("vault.renamed", { name: renameName.trim() }));
    setRenameTarget(null);
    setRenameName("");
  };

  const handleDelete = (entry: SavedConfig) => {
    if (!window.confirm(t("vault.confirmDelete", { name: entry.name }))) return;
    deleteVaultEntry(entry.id);
    refreshVault();
    addToast(t("toast.deleted", { name: entry.name }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("vault.justNow");
    if (diffMins < 60) return t("vault.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("vault.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("vault.daysAgo", { count: diffDays });
    return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US");
  };

  return (
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          breadcrumb={t("vault.breadcrumb")}
          title={t("vault.title")}
          subtitle={t("vault.subtitle")}
        />

        {/* Stats */}
        <div className="flex gap-3 px-6 md:px-10 py-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex-1 flex flex-col gap-1 p-4 rounded-md border ${
                stat.highlight
                  ? "bg-[#F0FAFA] border-[#0D6E6E]"
                  : "bg-white border-[#E5E5E5]"
              }`}
            >
              <span
                className={`font-[family-name:var(--font-jetbrains)] text-[32px] font-semibold ${
                  stat.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"
                }`}
              >
                {stat.value}
              </span>
              <span
                className={`text-xs ${
                  stat.highlight ? "text-[#0D6E6E]" : "text-[#888888]"
                }`}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Config List */}
        <div className="flex-1 px-6 md:px-10 overflow-auto pb-20 md:pb-10">
          <div className="flex flex-col md:flex-row md:items-center mb-4 gap-3">
            <h2 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] flex-shrink-0">
              {t("vault.configurations")}
            </h2>
            <div className="flex items-center gap-2 md:mx-auto">
              {/* Search with icon */}
              <div className="relative flex-1 md:flex-none">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#AAAAAA]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("vault.search")}
                  className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#0D6E6E] w-full md:w-44"
                />
              </div>

              {/* Sort with icon */}
              <div className="relative flex-shrink-0">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "name" | "starred")}
                  className="pl-8 pr-6 py-1.5 text-xs text-[#1A1A1A] bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#0D6E6E] appearance-none"
                >
                  <option value="date">{t("vault.sortDate")}</option>
                  <option value="starred">{t("vault.sortStarred")}</option>
                  <option value="name">{t("vault.sortName")}</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-[#AAAAAA] pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>

              {/* Import button */}
              <input ref={importInputRef} type="file" accept=".zip" onChange={handleImportZip} className="hidden" />
              <button
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5555] transition-colors flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M21 15H8"/><path d="m15 18-3-3 3-3"/></svg>
                {t("vault.import")}
              </button>
            </div>
          </div>

          {sortedVault.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-md border border-[#E5E5E5]">
              <p className="text-[#888888] text-sm mb-2">{t("vault.empty")}</p>
              <p className="text-[#AAAAAA] text-xs mb-4">{t("vault.emptyHint")}</p>
              <button
                onClick={() => router.push("/wizard")}
                className="text-sm text-[#0D6E6E] hover:underline"
              >
                {t("vault.startWizard")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedVault.map((entry) => {
                const info = vaultFileInfo[entry.id] || { fileCount: 0, totalSize: 0 };

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-md border border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleStar(entry.id)}
                        className="text-lg hover:scale-110 transition-transform"
                      >
                        {entry.starred ? (
                          <span className="text-[#E6B800]">★</span>
                        ) : (
                          <span className="text-[#CCCCCC]">☆</span>
                        )}
                      </button>
                      <div className="flex flex-col gap-1">
                        <span className="font-[family-name:var(--font-jetbrains)] text-sm font-medium text-[#1A1A1A]">
                          {entry.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[#888888]">
                          <span>{formatDate(entry.updatedAt)}</span>
                          <span>.</span>
                          <span>{info.fileCount} {t("vault.files")}</span>
                          <span>.</span>
                          <span>{formatFileSize(info.totalSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.tags.map((tag) => {
                        const label = t(`vault.tag.${tag}`);
                        return (
                          <span
                            key={tag}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F0FAFA] text-[#0D6E6E]"
                          >
                            {label !== `vault.tag.${tag}` ? label : tag}
                          </span>
                        );
                      })}
                      <button onClick={() => setRestoreTarget(entry)} title={t("vault.restore")} className="p-1.5 rounded hover:bg-[#F0FAFA] text-[#0D6E6E] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 1 9 9"/><path d="M3 12V3"/><path d="M3 12H12"/></svg>
                      </button>
                      <button onClick={() => { setRenameTarget(entry); setRenameName(entry.name); }} title={t("vault.rename")} className="p-1.5 rounded hover:bg-[#F0FAFA] text-[#888888] hover:text-[#0D6E6E] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button onClick={() => { setDuplicateTarget(entry); setDuplicateName(`${entry.name} (copie)`); }} title={t("vault.duplicate")} className="p-1.5 rounded hover:bg-[#F0FAFA] text-[#888888] hover:text-[#0D6E6E] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                      <button onClick={() => handleExport(entry)} title={t("vault.export")} className="p-1.5 rounded hover:bg-[#F0FAFA] text-[#888888] hover:text-[#0D6E6E] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      </button>
                      <button onClick={() => handleDelete(entry)} title={t("vault.delete")} className="p-1.5 rounded hover:bg-red-50 text-[#888888] hover:text-red-500 transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rename modal */}
        <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title={t("vault.renameTitle")}>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
              autoFocus
            />
            <button
              onClick={handleRename}
              disabled={!renameName.trim()}
              className="w-full py-2.5 bg-[#0D6E6E] text-white rounded-lg text-sm font-medium hover:bg-[#0A5555] transition-colors disabled:opacity-40"
            >
              {t("vault.renameConfirm")}
            </button>
          </div>
        </Modal>

        {/* Import modal */}
        <Modal open={!!importedConfig} onClose={() => setImportedConfig(null)} title={t("vault.importTitle")}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#666666]">{t("vault.importDesc")}</p>
            <input
              type="text"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirmImport(); }}
              placeholder={t("vault.importPlaceholder")}
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
              autoFocus
            />
            <button
              onClick={handleConfirmImport}
              disabled={!importName.trim()}
              className="w-full py-2.5 bg-[#0D6E6E] text-white rounded-lg text-sm font-medium hover:bg-[#0A5555] transition-colors disabled:opacity-40"
            >
              {t("vault.importConfirm")}
            </button>
          </div>
        </Modal>

        {/* Duplicate modal */}
        <Modal open={!!duplicateTarget} onClose={() => setDuplicateTarget(null)} title={t("vault.duplicateTitle")}>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDuplicate(); }}
              placeholder={t("vault.duplicatePlaceholder")}
              className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
              autoFocus
            />
            <button
              onClick={handleDuplicate}
              disabled={!duplicateName.trim()}
              className="w-full py-2.5 bg-[#0D6E6E] text-white rounded-lg text-sm font-medium hover:bg-[#0A5555] transition-colors disabled:opacity-40"
            >
              {t("vault.duplicateConfirm")}
            </button>
          </div>
        </Modal>

        {/* Restore choice modal */}
        <Modal open={!!restoreTarget} onClose={() => setRestoreTarget(null)} title={t("vault.restoreTitle")}>
          <p className="text-sm text-[#666666] mb-4">{t("vault.restoreDesc", { name: restoreTarget?.name || "" })}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => restoreTarget && handleRestore(restoreTarget, "wizard")}
              className="w-full py-3 bg-white border-2 border-[#0D6E6E] text-[#0D6E6E] rounded-lg text-sm font-medium hover:bg-[#F0FAFA] transition-colors"
            >
              {t("vault.restoreWizard")}
            </button>
            <button
              onClick={() => restoreTarget && handleRestore(restoreTarget, "expert")}
              className="w-full py-3 bg-[#0D6E6E] text-white rounded-lg text-sm font-medium hover:bg-[#0A5555] transition-colors"
            >
              {t("vault.restoreExpert")}
            </button>
          </div>
        </Modal>
      </div>
  );
}
