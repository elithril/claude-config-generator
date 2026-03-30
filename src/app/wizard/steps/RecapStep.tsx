"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { generateAllFiles } from "@/lib/generator";
import { downloadAsZip, formatFileSize } from "@/lib/download";
import { saveToVault } from "@/lib/storage";
import type { GeneratedFile } from "@/types";
import { useT } from "@/i18n";

export default function RecapStep() {
  const router = useRouter();
  const { config, setHasUnsavedChanges } = useConfig();
  const { addToast } = useToast();
  const t = useT();
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const generatedFiles: GeneratedFile[] = generateAllFiles(config);

  useEffect(() => {
    if (showSaveInput) saveInputRef.current?.focus();
  }, [showSaveInput]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadAsZip(generatedFiles);
      addToast(t("toast.downloaded"));
      setShowGuide(true);
    } catch {
      addToast(t("toast.downloadError"), "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToVault = () => {
    if (!saveName.trim()) return;
    saveToVault(saveName.trim(), config);
    setHasUnsavedChanges(false);
    addToast(t("toast.saved"));
    setShowSaveInput(false);
    setSaveName("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
        <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-4">
          {t("wizard.recap.summary")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.bundle")}</span>
            <p className="font-medium text-[#1A1A1A]">{config.bundle === "safe" ? t("wizard.recap.bundleSafe") : t("wizard.recap.bundleDev")}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.language")}</span>
            <p className="font-medium text-[#1A1A1A]">{config.language === "fr" ? "Français" : config.language === "en" ? "English" : "Español"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.tone")}</span>
            <p className="font-medium text-[#1A1A1A]">{t(`wizard.recap.tone${config.tone.charAt(0).toUpperCase()}${config.tone.slice(1)}`)}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.model")}</span>
            <p className="font-medium text-[#1A1A1A]">{config.model === "claude-sonnet-4-6" ? "Sonnet 4.6" : config.model === "claude-opus-4-6" ? "Opus 4.6" : "Haiku 4.5"}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.style")}</span>
            <p className="font-medium text-[#1A1A1A]">{t(`wizard.recap.style${config.responseStyle.charAt(0).toUpperCase()}${config.responseStyle.slice(1)}`)}</p>
          </div>
          <div className="p-3 bg-[#FAFAFA] rounded">
            <span className="text-[#888888] text-xs">{t("wizard.recap.permissions")}</span>
            <p className="font-medium text-[#1A1A1A]">{
              ({ default: t("wizard.recap.permDefault"), plan: t("wizard.recap.permPlan"), acceptEdits: t("wizard.recap.permAcceptEdits"), auto: t("wizard.recap.permAuto"), dontAsk: t("wizard.recap.permDontAsk"), bypassPermissions: "Bypass" } as Record<string, string>)[config.permissionMode] || config.permissionMode
            }</p>
          </div>
        </div>
      </div>

      {/* Generated files */}
      <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
        <h3 className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[#1A1A1A] mb-4">
          {t("wizard.recap.files")}
        </h3>
        <div className="flex flex-col gap-1.5">
          {generatedFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#FAFAFA]"
            >
              <span className="text-[#0D6E6E] text-sm flex-shrink-0">📄</span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[13px] text-[#1A1A1A] truncate flex-1">
                {file.path}
              </span>
              <span className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#AAAAAA] flex-shrink-0">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-[#E5E5E5]">
            <span className="text-xs text-[#888888]">{generatedFiles.length} {t("wizard.recap.filesCount")}</span>
            <span className="text-xs text-[#CCCCCC]">·</span>
            <span className="text-xs text-[#888888]">{formatFileSize(generatedFiles.reduce((a, f) => a + f.size, 0))} {t("wizard.recap.total")}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3 bg-[#0D6E6E] text-white rounded-lg font-medium hover:bg-[#0A5555] transition-colors disabled:opacity-60"
        >
          {isDownloading ? t("wizard.recap.downloading") : t("wizard.recap.download")}
        </button>

        {/* Inline vault save */}
        {!showSaveInput ? (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full py-3 bg-white text-[#0D6E6E] border-2 border-[#0D6E6E] rounded-lg font-medium hover:bg-[#F0FAFA] transition-colors"
          >
            {t("wizard.recap.saveVault")}
          </button>
        ) : (
          <div className="flex gap-2 items-center p-2 bg-white border-2 border-[#0D6E6E] rounded-lg">
            <input
              ref={saveInputRef}
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveToVault();
                if (e.key === "Escape") { setShowSaveInput(false); setSaveName(""); }
              }}
              placeholder={t("wizard.recap.savePlaceholder")}
              className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
            />
            <button
              onClick={handleSaveToVault}
              disabled={!saveName.trim()}
              className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded font-medium hover:bg-[#0A5555] disabled:opacity-40"
            >
              {t("wizard.recap.save")}
            </button>
            <button
              onClick={() => { setShowSaveInput(false); setSaveName(""); }}
              className="px-2 py-2 text-sm text-[#888888] hover:text-[#1A1A1A]"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Post-download guide */}
      {showGuide && (
        <div className="bg-[#F0FAFA] rounded-lg border border-[#0D6E6E]/20 p-6">
          <h3 className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[#0D6E6E] mb-5">
            {t("wizard.recap.guideTitle")}
          </h3>

          {/* Project scope */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">📁</span>
              <h4 className="text-sm font-semibold text-[#1A1A1A]">{t("wizard.recap.guideProjectTitle")}</h4>
            </div>
            <p className="text-xs text-[#666666] mb-3 ml-6">{t("wizard.recap.guideProjectDesc")}</p>
            <div className="flex flex-col gap-3 ml-6">
              {[
                { step: t("wizard.recap.guideStep1"), detail: t("wizard.recap.guideStep1Detail"), cmd: t("wizard.recap.guideCmd1") },
                { step: t("wizard.recap.guideStep2"), detail: t("wizard.recap.guideStep2Detail"), cmd: t("wizard.recap.guideCmd2") },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#0D6E6E] text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1A1A]">{item.step}</p>
                    <p className="text-xs text-[#666666] mt-0.5">{item.detail}</p>
                    <code className="inline-block mt-1.5 px-3 py-1.5 bg-[#1A1A1A] text-[#0D6E6E] text-xs font-[family-name:var(--font-jetbrains)] rounded break-all">
                      {item.cmd}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#0D6E6E]/10 my-4" />

          {/* Global scope */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🌐</span>
              <h4 className="text-sm font-semibold text-[#1A1A1A]">{t("wizard.recap.guideGlobalTitle")}</h4>
            </div>
            <p className="text-xs text-[#666666] mb-3 ml-6">{t("wizard.recap.guideGlobalDesc")}</p>
            <div className="flex gap-3 ml-6">
              <span className="w-5 h-5 rounded-full bg-[#888888] text-white text-[10px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{t("wizard.recap.guideGlobalStep1")}</p>
                <p className="text-xs text-[#666666] mt-0.5">{t("wizard.recap.guideGlobalStep1Detail")}</p>
                <code className="inline-block mt-1.5 px-3 py-1.5 bg-[#1A1A1A] text-[#888888] text-xs font-[family-name:var(--font-jetbrains)] rounded break-all">
                  {t("wizard.recap.guideGlobalCmd1")}
                </code>
              </div>
            </div>
          </div>

          {/* Precedence note */}
          <div className="mt-4 flex gap-2 items-start p-3 bg-[#0D6E6E]/5 rounded border border-[#0D6E6E]/15">
            <span className="text-sm flex-shrink-0">💡</span>
            <p className="text-xs font-medium text-[#0D6E6E]">{t("wizard.recap.guidePrecedence")}</p>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push("/expert")}
        className="w-full py-3 text-[#0D6E6E] text-sm font-medium hover:underline"
      >
        {t("wizard.recap.expertLink")}
      </button>
    </div>
  );
}
