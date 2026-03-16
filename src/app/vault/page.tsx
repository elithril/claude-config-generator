"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Layout, PageHeader } from "@/components";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { loadVault, deleteVaultEntry, toggleStar } from "@/lib/storage";
import { generateAllFiles } from "@/lib/generator";
import { downloadAsZip, formatFileSize } from "@/lib/download";
import type { SavedConfig } from "@/types";

export default function VaultPage() {
  const router = useRouter();
  const { dispatch } = useConfig();
  const { addToast } = useToast();
  const [vault, setVault] = useState<SavedConfig[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  useEffect(() => {
    setVault(loadVault());
  }, []);

  const refreshVault = () => setVault(loadVault());

  const sortedVault = useMemo(() => {
    const sorted = [...vault];
    if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return sorted;
  }, [vault, sortBy]);

  const stats = useMemo(() => [
    { value: String(vault.length), label: "Configs sauvees" },
    {
      value: String(vault.filter((c) => c.starred).length),
      label: "Favorites",
      highlight: true,
    },
  ], [vault]);

  const handleToggleStar = (id: string) => {
    toggleStar(id);
    refreshVault();
  };

  const handleExport = async (entry: SavedConfig) => {
    try {
      const files = generateAllFiles(entry.config);
      await downloadAsZip(files, entry.name);
      addToast(`"${entry.name}" exporte`);
    } catch {
      addToast("Erreur lors de l'export", "error");
    }
  };

  const handleRestore = (entry: SavedConfig) => {
    dispatch({ type: "SET_CONFIG", config: entry.config });
    addToast(`"${entry.name}" restaure`);
    router.push("/expert");
  };

  const handleDelete = (entry: SavedConfig) => {
    if (!window.confirm(`Supprimer "${entry.name}" ?`)) return;
    deleteVaultEntry(entry.id);
    refreshVault();
    addToast(`"${entry.name}" supprime`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "A l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          breadcrumb="VAULT / MY CONFIGS"
          title="Configuration Vault"
          subtitle="Vos configurations sauvegardees."
        />

        {/* Stats */}
        <div className="flex gap-3 px-10 py-6">
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
        <div className="flex-1 px-10 overflow-auto pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A]">
              Configurations
            </h2>
            <button
              onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
              className="text-xs text-[#888888] hover:text-[#666666]"
            >
              Tri : {sortBy === "date" ? "Date" : "Nom"} ▾
            </button>
          </div>

          {sortedVault.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-md border border-[#E5E5E5]">
              <p className="text-[#888888] text-sm mb-2">Aucune configuration sauvegardee.</p>
              <p className="text-[#AAAAAA] text-xs mb-4">Lancez le Wizard ou utilisez un template pour commencer.</p>
              <button
                onClick={() => router.push("/wizard")}
                className="text-sm text-[#0D6E6E] hover:underline"
              >
                Lancer le Wizard
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedVault.map((entry) => {
                const files = generateAllFiles(entry.config);
                const totalSize = files.reduce((a, f) => a + f.size, 0);

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-white rounded-md border border-[#E5E5E5] hover:border-[#0D6E6E] transition-colors"
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
                          <span>{files.length} fichiers</span>
                          <span>.</span>
                          <span>{formatFileSize(totalSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F0FAFA] text-[#0D6E6E]"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#F5F5F5] text-[#888888]">
                        {entry.config.bundle}
                      </span>
                      <button
                        onClick={() => handleRestore(entry)}
                        className="text-[12px] font-medium text-[#0D6E6E] hover:underline px-2"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleExport(entry)}
                        className="text-[12px] font-medium text-[#0D6E6E] hover:underline px-2"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="text-[12px] font-medium text-red-500 hover:underline px-2"
                      >
                        Suppr
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
