"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { generateAllFiles } from "@/lib/generator";
import { downloadAsZip, formatFileSize } from "@/lib/download";
import { saveToVault } from "@/lib/storage";
import type { GeneratedFile } from "@/types";

export default function RecapStep() {
  const router = useRouter();
  const { config } = useConfig();
  const { addToast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const generatedFiles: GeneratedFile[] = generateAllFiles(config);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsZip(generatedFiles);
      addToast("Configuration téléchargée !");
    } catch {
      addToast("Erreur lors du téléchargement", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!saveName.trim()) return;
    saveToVault(saveName.trim(), config);
    addToast("Sauvegardé dans le Vault");
    setShowSaveDialog(false);
    setSaveName("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
        <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-4">
          Résumé de ta configuration
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Bundle</span>
            <p className="font-medium text-[#1A1A1A]">{config.bundle === "safe" ? "Safe Mode" : "Dev Rapide"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Langue</span>
            <p className="font-medium text-[#1A1A1A]">{config.language === "fr" ? "Français" : config.language === "en" ? "English" : "Español"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Ton</span>
            <p className="font-medium text-[#1A1A1A]">{config.tone === "cool" ? "Cool" : config.tone === "pro" ? "Pro" : "Pédagogue"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Modèle</span>
            <p className="font-medium text-[#1A1A1A]">{config.model === "claude-sonnet-4-6" ? "Sonnet 4.6" : config.model === "claude-opus-4-6" ? "Opus 4.6" : "Haiku 4.5"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Effort</span>
            <p className="font-medium text-[#1A1A1A]">{config.effortLevel === "low" ? "Low" : config.effortLevel === "medium" ? "Medium" : "High"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Style</span>
            <p className="font-medium text-[#1A1A1A]">{config.responseStyle === "concise" ? "Concis" : config.responseStyle === "detailed" ? "Détaillé" : "Technique"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">Permissions</span>
            <p className="font-medium text-[#1A1A1A]">{
              config.permissionMode === "default" ? "Demander" :
              config.permissionMode === "plan" ? "Mode Plan" :
              config.permissionMode === "acceptEdits" ? "Auto-édition" : "Confiance totale"
            }</p>
          </div>
        </div>
      </div>

      {/* Generated files */}
      <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
        <h3 className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[#1A1A1A] mb-4">
          Fichiers générés
        </h3>
        <div className="flex flex-col gap-2">
          {generatedFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-3 p-3 bg-[#F0FAFA] border border-[#0D6E6E] rounded-lg"
            >
              <div className="w-6 h-6 bg-[#0D6E6E] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-[family-name:var(--font-jetbrains)] text-sm font-semibold text-[#1A1A1A] truncate block">
                  {file.path}
                </span>
              </div>
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#888888] flex-shrink-0">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 py-3 bg-[#0D6E6E] text-white rounded-lg font-medium hover:bg-[#0A5555] transition-colors disabled:opacity-60"
        >
          {isDownloading ? "Téléchargement..." : "Télécharger le ZIP"}
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 py-3 bg-white text-[#0D6E6E] border-2 border-[#0D6E6E] rounded-lg font-medium hover:bg-[#F0FAFA] transition-colors"
        >
          Sauver dans le Vault
        </button>
      </div>

      <button
        onClick={() => router.push("/expert")}
        className="w-full py-3 text-[#0D6E6E] text-sm font-medium hover:underline"
      >
        Affiner dans l&apos;Expert Mode →
      </button>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Sauvegarder la configuration">
          <div className="bg-white rounded-lg p-6 w-[400px] max-w-[90vw]">
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
    </div>
  );
}
