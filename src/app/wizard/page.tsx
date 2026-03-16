"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  WizardProgress,
  RadioOption,
  QuestionCard,
  ChoiceButton,
  Button,
  FileDropZone,
} from "@/components";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/i18n";
import { generateAllFiles } from "@/lib/generator";
import { formatFileSize } from "@/lib/download";
import type { RuleEntry } from "@/types";
import HooksStep from "./steps/HooksStep";
import McpStep from "./steps/McpStep";
import RulesStep from "./steps/RulesStep";
import RecapStep from "./steps/RecapStep";

export default function WizardPage() {
  const router = useRouter();
  const { config, dispatch } = useConfig();
  const { addToast } = useToast();
  const { locale, t } = useI18n();

  const BASIC_STEPS = [t("wizard.steps.bundle"), t("wizard.steps.personality"), t("wizard.steps.permissions"), t("wizard.steps.finalize")];

  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvancedSteps, setShowAdvancedSteps] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0);
  const [allowInput, setAllowInput] = useState("");
  const [denyInput, setDenyInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  // Quick vs Advanced wizard mode
  const [wizardMode, setWizardMode] = useState<"quick" | "advanced">("quick");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stepTransition, setStepTransition] = useState(false);
  const isTransitioning = useRef(false);

  // Reset config on first mount, sync language with UI locale
  const hasReset = useRef(false);
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_FIELD", field: "language", value: locale });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advancedSteps = useMemo(() => {
    const steps: { key: string; label: string }[] = [];
    if (config.enableHooks) steps.push({ key: "hooks", label: "Hooks" });
    if (config.enableMCP) steps.push({ key: "mcp", label: "MCP" });
    if (config.enableRules) steps.push({ key: "rules", label: "Rules" });
    steps.push({ key: "recap", label: t("wizard.steps.finalize") });
    return steps;
  }, [config.enableHooks, config.enableMCP, config.enableRules]);

  const allSteps = showAdvancedSteps ? advancedSteps.map((s) => s.label) : BASIC_STEPS;
  const activeStepIndex = showAdvancedSteps ? advancedStep : currentStep;

  const generatedFiles = useMemo(() => generateAllFiles(config), [config]);
  const totalSize = generatedFiles.reduce((acc, f) => acc + f.size, 0);

  // === Preview file selection ===
  const [selectedPreviewFile, setSelectedPreviewFile] = useState("CLAUDE.md");
  const selectedPreviewRef = useRef(selectedPreviewFile);
  selectedPreviewRef.current = selectedPreviewFile;

  // Track file changes for dot indicator + auto-switch
  const prevContents = useRef<Record<string, string>>({});
  const [changedFiles, setChangedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newChanged = new Set<string>();
    for (const file of generatedFiles) {
      const prev = prevContents.current[file.path];
      if (prev !== undefined && prev !== file.content) newChanged.add(file.path);
      prevContents.current[file.path] = file.content;
    }
    // Skip change detection during step transitions to avoid stutter
    if (isTransitioning.current) return;
    if (newChanged.size > 0) {
      setChangedFiles(newChanged);
      // If the currently selected file didn't change, switch to one that did
      if (!newChanged.has(selectedPreviewRef.current)) {
        const priority = [".claude/settings.json", ".mcp.json", "CLAUDE.md", ".claudeignore"];
        const bestMatch = priority.find(p => newChanged.has(p))
          || [...newChanged].find(f => f.startsWith(".claude/rules/"))
          || [...newChanged][0];
        if (bestMatch) setSelectedPreviewFile(bestMatch);
      }
      const timer = setTimeout(() => setChangedFiles(new Set()), 1500);
      return () => clearTimeout(timer);
    }
  }, [generatedFiles]);

  // Set contextual file ONLY on step changes (not on config/file changes)
  const stepKey = showAdvancedSteps ? `adv-${advancedStep}` : `basic-${currentStep}`;
  const prevStepKey = useRef(stepKey);
  useEffect(() => {
    if (prevStepKey.current !== stepKey) {
      prevStepKey.current = stepKey;
      // Pick default file for this step
      if (!showAdvancedSteps) {
        setSelectedPreviewFile(currentStep === 2 ? ".claude/settings.json" : "CLAUDE.md");
      } else {
        const key = advancedSteps[advancedStep]?.key;
        if (key === "hooks") setSelectedPreviewFile(".claude/settings.json");
        else if (key === "mcp") setSelectedPreviewFile(".mcp.json");
        else if (key === "rules") {
          const ruleFile = generatedFiles.find(f => f.path.startsWith(".claude/rules/"));
          setSelectedPreviewFile(ruleFile?.path || "CLAUDE.md");
        } else setSelectedPreviewFile("CLAUDE.md");
      }
    }
  }, [stepKey, showAdvancedSteps, currentStep, advancedStep, advancedSteps, generatedFiles]);

  // === Navigation with transition ===
  const navigateTo = (action: () => void) => {
    isTransitioning.current = true;
    setStepTransition(true);
    setTimeout(() => {
      action();
      scrollRef.current?.scrollTo({ top: 0 });
      setStepTransition(false);
      // Allow change detection again after React settles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isTransitioning.current = false;
        });
      });
    }, 150);
  };

  const handleNext = () => {
    if (showAdvancedSteps) {
      if (advancedStep < advancedSteps.length - 1) navigateTo(() => setAdvancedStep(advancedStep + 1));
    } else {
      if (currentStep < BASIC_STEPS.length - 1) navigateTo(() => setCurrentStep(currentStep + 1));
    }
  };

  const handleBack = () => {
    if (showAdvancedSteps) {
      if (advancedStep > 0) navigateTo(() => setAdvancedStep(advancedStep - 1));
      else navigateTo(() => { setShowAdvancedSteps(false); setCurrentStep(3); });
    } else {
      if (currentStep > 0) navigateTo(() => setCurrentStep(currentStep - 1));
      else router.push("/");
    }
  };

  const handleMainAction = () => {
    if (!showAdvancedSteps && currentStep === 3) {
      navigateTo(() => {
        setShowAdvancedSteps(true);
        setAdvancedStep(config.enableHooks || config.enableMCP || config.enableRules ? 0 : advancedSteps.length - 1);
      });
    } else {
      handleNext();
    }
  };

  // === Permission helpers ===
  const handleAddAllow = () => {
    if (!allowInput.trim()) return;
    dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, allow: [...config.permissions.allow, allowInput.trim()] } });
    setAllowInput("");
  };
  const handleAddDeny = () => {
    if (!denyInput.trim()) return;
    dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, deny: [...config.permissions.deny, denyInput.trim()] } });
    setDenyInput("");
  };

  // === Step metadata ===
  const stepMeta = useMemo(() => {
    if (!showAdvancedSteps) {
      const meta = [
        { breadcrumb: t("wizard.step1.breadcrumb"), title: t("wizard.step1.title"), subtitle: t("wizard.step1.subtitle") },
        { breadcrumb: t("wizard.step2.breadcrumb"), title: t("wizard.step2.title"), subtitle: t("wizard.step2.subtitle") },
        { breadcrumb: t("wizard.step3.breadcrumb"), title: t("wizard.step3.title"), subtitle: t("wizard.step3.subtitle") },
        { breadcrumb: t("wizard.step4.breadcrumb"), title: t("wizard.step4.title"), subtitle: t("wizard.step4.subtitle") },
      ];
      return meta[currentStep] || meta[0];
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    const map: Record<string, { breadcrumb: string; title: string; subtitle: string }> = {
      hooks: { breadcrumb: t("wizard.hooks.breadcrumb"), title: t("wizard.hooks.title"), subtitle: t("wizard.hooks.subtitle") },
      mcp: { breadcrumb: t("wizard.mcp.breadcrumb"), title: t("wizard.mcp.title"), subtitle: t("wizard.mcp.subtitle") },
      rules: { breadcrumb: t("wizard.rules.breadcrumb"), title: t("wizard.rules.title"), subtitle: t("wizard.rules.subtitle") },
      recap: { breadcrumb: t("wizard.recap.breadcrumb"), title: t("wizard.recap.title"), subtitle: t("wizard.recap.subtitle") },
    };
    return map[stepKey || "recap"];
  }, [showAdvancedSteps, currentStep, advancedStep, advancedSteps, t]);

  const isRecap = showAdvancedSteps && advancedSteps[advancedStep]?.key === "recap";
  const buttonText = !showAdvancedSteps && currentStep === 3
    ? (config.enableHooks || config.enableMCP || config.enableRules ? t("wizard.refine") : t("wizard.finalize"))
    : isRecap ? null : t("wizard.continue");

  const adv = wizardMode === "advanced";

  // === Render step content ===
  const renderStepContent = () => {
    if (!showAdvancedSteps) {
      switch (currentStep) {
        case 0:
          return (
            <QuestionCard title={t("wizard.step1.question")}>
              <RadioOption selected={config.bundle === "safe"} onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "safe" })} emoji="🛡️" title={t("wizard.step1.safe")} description={t("wizard.step1.safeDesc")} detail={t("wizard.step1.safeDetail")} />
              <RadioOption selected={config.bundle === "dev"} onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "dev" })} emoji="⚡" title={t("wizard.step1.dev")} description={t("wizard.step1.devDesc")} detail={t("wizard.step1.devDetail")} />
            </QuestionCard>
          );

        case 1:
          return (
            <>
              <QuestionCard title={t("wizard.step2.language")}>
                <RadioOption selected={config.language === "fr"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "fr" })} emoji="🇫🇷" title={t("wizard.step2.french")} />
                <RadioOption selected={config.language === "en"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "en" })} emoji="🇬🇧" title={t("wizard.step2.english")} />
                <RadioOption selected={config.language === "es"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "es" })} emoji="🇪🇸" title={t("wizard.step2.spanish")} />
              </QuestionCard>
              <QuestionCard title={t("wizard.step2.tone")}>
                <div className="flex gap-3">
                  <ChoiceButton emoji="😎" label={t("wizard.step2.cool")} selected={config.tone === "cool"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "cool" })} />
                  <ChoiceButton emoji="👔" label={t("wizard.step2.pro")} selected={config.tone === "pro"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pro" })} />
                  <ChoiceButton emoji="📚" label={t("wizard.step2.pedagogue")} selected={config.tone === "pedagogue"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pedagogue" })} />
                </div>
              </QuestionCard>
              <QuestionCard title={t("wizard.step2.model")}>
                <RadioOption selected={config.model === "claude-sonnet-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-sonnet-4-6" })} title={t("wizard.step2.sonnet")} description={t("wizard.step2.sonnetDesc")} />
                <RadioOption selected={config.model === "claude-opus-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-opus-4-6" })} title={t("wizard.step2.opus")} description={t("wizard.step2.opusDesc")} />
                <RadioOption selected={config.model === "claude-haiku-4-5"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-haiku-4-5" })} title={t("wizard.step2.haiku")} description={t("wizard.step2.haikuDesc")} />
              </QuestionCard>

              {/* === ADVANCED ONLY === */}
              {adv && (
                <>
                  <QuestionCard title={t("wizard.step2.effort")}>
                    <div className="flex gap-3">
                      <ChoiceButton emoji="⚡" label="Low" selected={config.effortLevel === "low"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "low" })} />
                      <ChoiceButton emoji="⚖️" label="Medium" selected={config.effortLevel === "medium"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "medium" })} />
                      <ChoiceButton emoji="🧠" label="High" selected={config.effortLevel === "high"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "high" })} />
                    </div>
                  </QuestionCard>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{t("wizard.step2.outputStyle")}</h4>
                    <p className="text-xs text-[#888888] mb-3">{t("wizard.step2.outputStyleDesc")}</p>
                    <input type="text" value={config.outputStyle} onChange={(e) => dispatch({ type: "SET_FIELD", field: "outputStyle", value: e.target.value })} placeholder="Ex: Explanatory, Verbose, Minimal..." className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">{t("wizard.step2.preferences")}</h4>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                        <div>
                          <span className="text-sm font-medium text-[#1A1A1A]">{t("wizard.step2.thinking")}</span>
                          <p className="text-xs text-[#888888]">{t("wizard.step2.thinkingDesc")}</p>
                        </div>
                        <input type="checkbox" checked={config.extendedThinking} onChange={(e) => dispatch({ type: "SET_FIELD", field: "extendedThinking", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                      </label>
                      <div className="p-3 border border-[#E5E5E5] rounded">
                        <span className="text-sm font-medium text-[#1A1A1A]">{t("wizard.step2.attribution")}</span>
                        <p className="text-xs text-[#888888] mb-2">{t("wizard.step2.attributionDesc")}</p>
                        <div className="flex flex-col gap-2">
                          <input type="text" value={config.attribution.commit} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, commit: e.target.value } })} placeholder="Commit (vide = pas d'attribution)" className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                          <input type="text" value={config.attribution.pr} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, pr: e.target.value } })} placeholder="PR (vide = pas d'attribution)" className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                        </div>
                      </div>
                      <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                        <div>
                          <span className="text-sm font-medium text-[#1A1A1A]">{t("wizard.step2.autoMemory")}</span>
                          <p className="text-xs text-[#888888]">{t("wizard.step2.autoMemoryDesc")}</p>
                        </div>
                        <input type="checkbox" checked={config.autoMemoryEnabled} onChange={(e) => dispatch({ type: "SET_FIELD", field: "autoMemoryEnabled", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                      </label>
                      <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                        <div>
                          <span className="text-sm font-medium text-[#1A1A1A]">{t("wizard.step2.gitInstructions")}</span>
                          <p className="text-xs text-[#888888]">{t("wizard.step2.gitInstructionsDesc")}</p>
                        </div>
                        <input type="checkbox" checked={config.includeGitInstructions} onChange={(e) => dispatch({ type: "SET_FIELD", field: "includeGitInstructions", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                      </label>
                    </div>
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">{t("wizard.step2.claudeMd")}</h4>
                    <p className="text-xs text-[#888888] mb-3">{t("wizard.step2.claudeMdDesc")}</p>
                    <FileDropZone
                      onFileLoaded={(content) => { dispatch({ type: "IMPORT_CLAUDE_MD", content }); addToast(t("wizard.step2.claudeMdImported")); }}
                      currentContent={config.claudeMdImported ? config.claudeMdContent : ""}
                      accept=".md"
                    />
                  </div>
                </>
              )}
            </>
          );

        case 2:
          return (
            <>
              <QuestionCard title={t("wizard.step3.responseStyle")}>
                <RadioOption selected={config.responseStyle === "concise"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "concise" })} title={t("wizard.step3.concise")} description={t("wizard.step3.conciseDesc")} />
                <RadioOption selected={config.responseStyle === "detailed"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "detailed" })} title={t("wizard.step3.detailed")} description={t("wizard.step3.detailedDesc")} />
                <RadioOption selected={config.responseStyle === "technical"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "technical" })} title={t("wizard.step3.technical")} description={t("wizard.step3.technicalDesc")} />
              </QuestionCard>
              <QuestionCard title={t("wizard.step3.permissionMode")}>
                <RadioOption selected={config.permissionMode === "default"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "default" })} title={t("wizard.step3.modeDefault")} description={t("wizard.step3.modeDefaultDesc")} />
                <RadioOption selected={config.permissionMode === "plan"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "plan" })} title={t("wizard.step3.modePlan")} description={t("wizard.step3.modePlanDesc")} />
                <RadioOption selected={config.permissionMode === "acceptEdits"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "acceptEdits" })} title={t("wizard.step3.modeAcceptEdits")} description={t("wizard.step3.modeAcceptEditsDesc")} />
                <RadioOption selected={config.permissionMode === "dontAsk"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "dontAsk" })} title={t("wizard.step3.modeDontAsk")} description={t("wizard.step3.modeDontAskDesc")} />
              </QuestionCard>

              {/* === ADVANCED ONLY === */}
              {adv && (
                <>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-sm font-medium text-[#1A1A1A]">{t("wizard.step3.sandbox")}</span>
                        <p className="text-xs text-[#888888]">{t("wizard.step3.sandboxDesc")}</p>
                      </div>
                      <input type="checkbox" checked={config.sandboxEnabled} onChange={(e) => dispatch({ type: "SET_FIELD", field: "sandboxEnabled", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                    </label>
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{t("wizard.step3.disallowedTools")}</h4>
                    <p className="text-xs text-[#888888] mb-3">{t("wizard.step3.disallowedToolsDesc")}</p>
                    <div className="flex flex-wrap gap-2">
                      {["WebFetch", "WebSearch", "Agent", "Bash", "Edit", "Write", "Read", "Glob", "Grep", "NotebookEdit"].map((tool) => (
                        <label key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer text-xs ${config.disallowedTools.includes(tool) ? "border-[#dc2626] bg-red-50 text-[#dc2626]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                          <input type="checkbox" checked={config.disallowedTools.includes(tool)} onChange={(e) => {
                            const updated = e.target.checked ? [...config.disallowedTools, tool] : config.disallowedTools.filter(t => t !== tool);
                            dispatch({ type: "SET_FIELD", field: "disallowedTools", value: updated });
                          }} className="hidden" />
                          {config.disallowedTools.includes(tool) ? "✕" : ""} {tool}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">{t("wizard.step3.rules")}</h4>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step3.allow")}</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={allowInput} onChange={(e) => setAllowInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddAllow()} placeholder="Bash(npm run *)" className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                        <button onClick={handleAddAllow} className="px-3 py-2 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.permissions.allow.map((rule, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                            {rule}
                            <button onClick={() => dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, allow: config.permissions.allow.filter((_, j) => j !== i) } })} className="hover:text-green-900">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step3.ask")}</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" defaultValue="" onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (!val) return;
                            dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, ask: [...(config.permissions.ask || []), val] } });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }} placeholder="Bash(git push *)" className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                        <button onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          const val = input.value.trim();
                          if (!val) return;
                          dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, ask: [...(config.permissions.ask || []), val] } });
                          input.value = "";
                        }} className="px-3 py-2 text-sm bg-[#ca8a04] text-white rounded hover:bg-[#a16207]">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(config.permissions.ask || []).map((rule, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200">
                            {rule}
                            <button onClick={() => dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, ask: (config.permissions.ask || []).filter((_, j) => j !== i) } })} className="hover:text-yellow-900">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step3.deny")}</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={denyInput} onChange={(e) => setDenyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddDeny()} placeholder="Read(./.env)" className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                        <button onClick={handleAddDeny} className="px-3 py-2 text-sm bg-[#dc2626] text-white rounded hover:bg-red-700">+</button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {config.permissions.deny.map((rule, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                            {rule}
                            <button onClick={() => dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, deny: config.permissions.deny.filter((_, j) => j !== i) } })} className="hover:text-red-900">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          );

        case 3:
          return (
            <>
              <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-2">{t("wizard.step4.title")}</h3>
                <p className="text-[15px] text-[#666666] mb-6">{t("wizard.step4.subtitle")}</p>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">{t("wizard.step4.advancedQuestion")}</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { field: "enableHooks" as const, label: t("wizard.step4.hooks"), desc: t("wizard.step4.hooksDesc") },
                    { field: "enableMCP" as const, label: t("wizard.step4.mcp"), desc: t("wizard.step4.mcpDesc") },
                    { field: "enableRules" as const, label: t("wizard.step4.rules"), desc: t("wizard.step4.rulesDesc") },
                  ].map(({ field, label, desc }) => (
                    <label key={field} className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                      <input type="checkbox" checked={config[field]} onChange={(e) => dispatch({ type: "SET_FIELD", field, value: e.target.checked })} className="mt-1 w-4 h-4 accent-[#0D6E6E]" />
                      <div>
                        <span className="font-medium text-[#1A1A1A]">{label}</span>
                        <p className="text-[13px] text-[#666666]">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* === ADVANCED ONLY === */}
              {adv && (
                <>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{t("wizard.step4.envVars")}</h4>
                    <p className="text-xs text-[#888888] mb-3">{t("wizard.step4.envVarsDesc")}</p>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={envKey} onChange={(e) => setEnvKey(e.target.value)} placeholder="NOM_VARIABLE" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                      <input type="text" value={envValue} onChange={(e) => setEnvValue(e.target.value)} placeholder="valeur" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                      <button onClick={() => { if (!envKey.trim()) return; dispatch({ type: "SET_FIELD", field: "envVars", value: { ...config.envVars, [envKey.trim()]: envValue.trim() } }); setEnvKey(""); setEnvValue(""); }} className="px-3 py-1.5 text-xs bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]">+</button>
                    </div>
                    {Object.keys(config.envVars).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(config.envVars).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F5] text-[#666666] text-[10px] rounded font-mono border border-[#E5E5E5]">
                            {k}={v}
                            <button onClick={() => { const u = { ...config.envVars }; delete u[k]; dispatch({ type: "SET_FIELD", field: "envVars", value: u }); }} className="hover:text-[#dc2626]">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">{t("wizard.step4.agentTeams")}</h4>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step4.teammateMode")}</label>
                        <p className="text-xs text-[#888888] mb-2">{t("wizard.step4.teammateModeDesc")}</p>
                        <div className="flex gap-2">
                          {([{ value: "auto", label: t("wizard.step4.auto"), desc: t("wizard.step4.autoDesc") }, { value: "in-process", label: t("wizard.step4.inProcess"), desc: t("wizard.step4.inProcessDesc") }, { value: "tmux", label: t("wizard.step4.tmux"), desc: t("wizard.step4.tmuxDesc") }] as const).map(({ value, label, desc }) => (
                            <button key={value} onClick={() => dispatch({ type: "SET_FIELD", field: "teammateMode", value })}
                              className={`flex-1 p-2 rounded border text-center ${config.teammateMode === value ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                              <span className="text-xs font-medium block">{label}</span>
                              <span className="text-[10px] text-[#888888]">{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step4.updateChannel")}</label>
                        <div className="flex gap-2">
                          <button onClick={() => dispatch({ type: "SET_FIELD", field: "autoUpdatesChannel", value: "latest" })} className={`flex-1 p-2 rounded border text-center ${config.autoUpdatesChannel === "latest" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                            <span className="text-xs font-medium block">{t("wizard.step4.latest")}</span>
                            <span className="text-[10px] text-[#888888]">{t("wizard.step4.latestDesc")}</span>
                          </button>
                          <button onClick={() => dispatch({ type: "SET_FIELD", field: "autoUpdatesChannel", value: "stable" })} className={`flex-1 p-2 rounded border text-center ${config.autoUpdatesChannel === "stable" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                            <span className="text-xs font-medium block">{t("wizard.step4.stable")}</span>
                            <span className="text-[10px] text-[#888888]">{t("wizard.step4.stableDesc")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          );
      }
    }

    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return <HooksStep />;
      case "mcp": return <McpStep />;
      case "rules": return <RulesStep />;
      case "recap": return <RecapStep />;
    }
    return null;
  };

  const currentFile = generatedFiles.find((f) => f.path === selectedPreviewFile) || generatedFiles[0];

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col bg-[#FAFAFA] min-h-0 h-full">
        {/* Fixed header */}
        <div className="flex-shrink-0 p-4 md:p-8 pb-0">
          {/* Breadcrumb + Mode toggle */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">
              {stepMeta.breadcrumb}
            </span>
            <div className="flex items-center bg-[#F0F0F0] rounded-full p-0.5">
              <button
                onClick={() => setWizardMode("quick")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${wizardMode === "quick" ? "bg-white text-[#0D6E6E] shadow-sm" : "text-[#888888]"}`}
              >
                {t("wizard.quick")}
              </button>
              <button
                onClick={() => setWizardMode("advanced")}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${wizardMode === "advanced" ? "bg-white text-[#0D6E6E] shadow-sm" : "text-[#888888]"}`}
              >
                {t("wizard.advanced")}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] tracking-[-1px]">{stepMeta.title}</h1>
            <p className="text-[14px] text-[#666666] mt-1">{stepMeta.subtitle}</p>
          </div>

          {allSteps.length > 1 && <WizardProgress steps={allSteps} currentStep={activeStepIndex} />}
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-auto px-4 md:px-8 py-4">
          <div className={`flex flex-col gap-4 transition-opacity duration-150 ease-in-out ${stepTransition ? "opacity-0" : "opacity-100"}`}>
            {renderStepContent()}
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div className="flex-shrink-0 px-4 md:px-8 py-4 pb-20 md:pb-4 border-t border-[#E5E5E5] bg-[#FAFAFA]">
          {buttonText ? (
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleBack}>{t("wizard.back")}</Button>
              <Button variant="primary" onClick={handleMainAction}>{buttonText}</Button>
            </div>
          ) : isRecap ? (
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleBack}>{t("wizard.back")}</Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="hidden lg:flex w-[520px] bg-[#F0F0F0] border-l border-[#E0E0E0] p-8 flex-col gap-4 overflow-auto">
        <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">{t("wizard.preview.title")}</span>
        <div className="flex gap-3">
          {[
            { value: generatedFiles.length, label: t("wizard.preview.files"), highlight: true },
            { value: config.rules.filter((r: RuleEntry) => r.enabled).length, label: t("wizard.preview.rules") },
            { value: formatFileSize(totalSize), label: t("wizard.preview.total") },
          ].map((m, i) => (
            <div key={i} className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
              <span className={`font-[family-name:var(--font-jetbrains)] text-xl font-semibold ${m.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"}`}>{m.value}</span>
              <span className="text-[11px] text-[#888888]">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pt-2">
          {generatedFiles.map((file) => (
            <button key={file.path} onClick={() => setSelectedPreviewFile(file.path)}
              className={`relative px-3 py-1.5 text-xs font-mono rounded-t whitespace-nowrap ${selectedPreviewFile === file.path ? "bg-white text-[#0D6E6E] font-semibold border border-b-0 border-[#E0E0E0]" : "text-[#888888] hover:text-[#666666]"}`}>
              {file.path.split("/").pop()}
              {changedFiles.has(file.path) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0D6E6E] rounded-full animate-pulse" />}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-md border border-[#E0E0E0] flex-1 overflow-auto">
          <div className="px-3 py-2 border-b border-[#E0E0E0] bg-[#FAFAFA]">
            <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666]">{selectedPreviewFile}</span>
          </div>
          <pre className="p-4 text-xs font-[family-name:var(--font-jetbrains)] leading-5 text-[#333333] whitespace-pre-wrap break-words">
            {currentFile?.content || t("wizard.preview.noContent")}
          </pre>
        </div>
      </div>
    </div>
  );
}
