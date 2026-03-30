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
  const { config, dispatch: rawDispatch, setHasUnsavedChanges } = useConfig();
  const { addToast } = useToast();
  const { locale, t } = useI18n();

  const BASIC_STEPS = [t("wizard.steps.bundle"), t("wizard.steps.personality"), t("wizard.steps.permissions"), t("wizard.steps.options")];

  const [currentStep, setCurrentStep] = useState(0);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const dispatch: typeof rawDispatch = useCallback((action) => {
    rawDispatch(action);
    if (currentStepRef.current > 0) setHasUnsavedChanges(true);
  }, [rawDispatch, setHasUnsavedChanges]);
  const [showAdvancedSteps, setShowAdvancedSteps] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0);
  const [allowInput, setAllowInput] = useState("");
  const [askInput, setAskInput] = useState("");
  const [denyInput, setDenyInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  // Quick vs Advanced wizard mode
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [stepFade, setStepFade] = useState<"visible" | "fading-out" | "hidden">("visible");
  const [contentKey, setContentKey] = useState(0);
  const isTransitioning = useRef(false);

  // Reset config on first mount
  const hasReset = useRef(false);
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      dispatch({ type: "RESET" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync config.language with UI locale
  useEffect(() => {
    if (config.language !== locale) {
      dispatch({ type: "SET_FIELD", field: "language", value: locale });
    }
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const advancedSteps = useMemo(() => {
    const steps: { key: string; label: string }[] = [];
    if (config.enableHooks) steps.push({ key: "hooks", label: "Hooks" });
    if (config.enableMCP) steps.push({ key: "mcp", label: "MCP" });
    if (config.enableRules) steps.push({ key: "rules", label: "Rules" });
    steps.push({ key: "recap", label: t("wizard.steps.finalize") });
    return steps;
  }, [config.enableHooks, config.enableMCP, config.enableRules]);

  // Progress bar: shows current phase (basic OR advanced)
  const progressSteps = showAdvancedSteps
    ? advancedSteps.map((s) => s.label)
    : BASIC_STEPS;
  const progressIndex = showAdvancedSteps ? advancedStep : currentStep;

  const generatedFiles = useMemo(() => generateAllFiles(config), [config]);
  const totalSize = generatedFiles.reduce((acc, f) => acc + f.size, 0);

  // === Preview file selection ===
  const [selectedPreviewFile, setSelectedPreviewFile] = useState("CLAUDE.md");
  const selectedPreviewRef = useRef(selectedPreviewFile);
  selectedPreviewRef.current = selectedPreviewFile;

  // Track file changes for dot indicator + auto-switch
  // Fade-in: runs AFTER browser paints "hidden" frame → triggers transition to visible
  useEffect(() => {
    if (stepFade === "hidden") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStepFade("visible");
          isTransitioning.current = false;
        });
      });
    }
  }, [stepFade, contentKey]);

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
    setStepFade("fading-out");
    setTimeout(() => {
      action();
      setContentKey(k => k + 1);
      setStepFade("hidden");
      contentRef.current?.scrollTo({ top: 0 });
    }, 300);
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
  const KNOWN_TOOLS = ["Bash", "Read", "Edit", "Write", "WebFetch", "WebSearch", "Glob", "Grep", "Agent", "NotebookEdit"];
  const isValidPermRule = (rule: string) => {
    // "ToolName" or "ToolName(pattern)" or "mcp__*"
    const match = rule.match(/^(\w+)(\(.*\))?$/);
    if (!match) return false;
    const tool = match[1];
    return KNOWN_TOOLS.includes(tool) || tool.startsWith("mcp__");
  };
  const handleAddAllow = () => {
    const rule = allowInput.trim();
    if (!rule) return;
    if (!isValidPermRule(rule)) { addToast(t("wizard.step3.invalidRule"), "error"); return; }
    dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, allow: [...config.permissions.allow, rule] } });
    setAllowInput("");
  };
  const handleAddDeny = () => {
    const rule = denyInput.trim();
    if (!rule) return;
    if (!isValidPermRule(rule)) { addToast(t("wizard.step3.invalidRule"), "error"); return; }
    dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, deny: [...config.permissions.deny, rule] } });
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

  const toggleSection = (id: string) => setExpandedSections(s => ({ ...s, [id]: !s[id] }));

  // === Render step content ===
  const renderStepContent = () => {
    if (!showAdvancedSteps) {
      switch (currentStep) {
        case 0:
          return (
            <QuestionCard title={t("wizard.step1.question")}>
              <RadioOption selected={config.bundle === "safe"} onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "safe" })} emoji="🛡️" title={t("wizard.step1.safe")} description={t("wizard.step1.safeDesc")} detail={t("wizard.step1.safeDetail")} badge={t("common.recommended")} />
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
              <QuestionCard title={t("wizard.step2.responseStyle")}>
                <RadioOption selected={config.responseStyle === "concise"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "concise" })} title={t("wizard.step2.concise")} description={t("wizard.step2.conciseDesc")} />
                <RadioOption selected={config.responseStyle === "detailed"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "detailed" })} title={t("wizard.step2.detailed")} description={t("wizard.step2.detailedDesc")} badge={t("common.recommended")} />
                <RadioOption selected={config.responseStyle === "technical"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "technical" })} title={t("wizard.step2.technical")} description={t("wizard.step2.technicalDesc")} />
              </QuestionCard>
              <QuestionCard title={t("wizard.step2.model")}>
                <RadioOption selected={config.model === "claude-sonnet-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-sonnet-4-6" })} title={t("wizard.step2.sonnet")} description={t("wizard.step2.sonnetDesc")} badge={t("common.recommended")} />
                <RadioOption selected={config.model === "claude-opus-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-opus-4-6" })} title={t("wizard.step2.opus")} description={t("wizard.step2.opusDesc")} />
                <RadioOption selected={config.model === "claude-haiku-4-5"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-haiku-4-5" })} title={t("wizard.step2.haiku")} description={t("wizard.step2.haikuDesc")} />
              </QuestionCard>

              {/* === Collapsible advanced === */}
              <button onClick={() => toggleSection("step2")} className="flex items-center gap-2 text-xs text-[#0D6E6E] font-medium cursor-pointer hover:underline py-1">
                <span className={`transition-transform ${expandedSections.step2 ? "rotate-90" : ""}`}>▸</span>
                {expandedSections.step2 ? t("common.showLess") : t("common.learnMore")}
              </button>
              {expandedSections.step2 && (
                <>
                  <QuestionCard title={t("wizard.step2.effort")}>
                    <div className="flex gap-3">
                      <ChoiceButton emoji="⚡" label={t("wizard.step2.effortLow")} selected={config.effortLevel === "low"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "low" })} />
                      <ChoiceButton emoji="⚖️" label={t("wizard.step2.effortMedium")} selected={config.effortLevel === "medium"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "medium" })} />
                      <ChoiceButton emoji="🧠" label={t("wizard.step2.effortHigh")} selected={config.effortLevel === "high"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "high" })} />
                    </div>
                  </QuestionCard>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{t("wizard.step2.outputStyle")}</h4>
                    <p className="text-xs text-[#888888] mb-3">{t("wizard.step2.outputStyleDesc")}</p>
                    <input type="text" value={config.outputStyle} onChange={(e) => dispatch({ type: "SET_FIELD", field: "outputStyle", value: e.target.value })} placeholder={t("wizard.step2.outputStylePlaceholder")} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
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
                          <input type="text" value={config.attribution.commit} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, commit: e.target.value } })} placeholder={t("wizard.step2.commitPlaceholder")} className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                          <input type="text" value={config.attribution.pr} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, pr: e.target.value } })} placeholder={t("wizard.step2.prPlaceholder")} className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
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
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">{t("wizard.step2.projectContext")}</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-medium text-[#666666] mb-1 block">{t("wizard.step2.projectStack")}</label>
                        <p className="text-xs text-[#888888] mb-1">{t("wizard.step2.projectStackDesc")}</p>
                        <input type="text" value={config.projectStack} onChange={(e) => dispatch({ type: "SET_FIELD", field: "projectStack", value: e.target.value })} placeholder={t("wizard.step2.projectStackPlaceholder")} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium text-[#666666] mb-1 block">{t("wizard.step2.buildCommand")}</label>
                          <input type="text" value={config.buildCommand} onChange={(e) => dispatch({ type: "SET_FIELD", field: "buildCommand", value: e.target.value })} placeholder={t("wizard.step2.buildPlaceholder")} className="w-full px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#666666] mb-1 block">{t("wizard.step2.testCommand")}</label>
                          <input type="text" value={config.testCommand} onChange={(e) => dispatch({ type: "SET_FIELD", field: "testCommand", value: e.target.value })} placeholder={t("wizard.step2.testPlaceholder")} className="w-full px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#666666] mb-1 block">{t("wizard.step2.lintCommand")}</label>
                          <input type="text" value={config.lintCommand} onChange={(e) => dispatch({ type: "SET_FIELD", field: "lintCommand", value: e.target.value })} placeholder={t("wizard.step2.lintPlaceholder")} className="w-full px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#666666] mb-1 block">{t("wizard.step2.projectStructure")}</label>
                        <input type="text" value={config.projectStructure} onChange={(e) => dispatch({ type: "SET_FIELD", field: "projectStructure", value: e.target.value })} placeholder={t("wizard.step2.projectStructurePlaceholder")} className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                      </div>
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
              <QuestionCard title={t("wizard.step3.permissionMode")}>
                <RadioOption selected={config.permissionMode === "default"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "default" })} title={t("wizard.step3.modeDefault")} description={t("wizard.step3.modeDefaultDesc")} badge={t("common.recommended")} />
                <RadioOption selected={config.permissionMode === "plan"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "plan" })} title={t("wizard.step3.modePlan")} description={t("wizard.step3.modePlanDesc")} />
                <RadioOption selected={config.permissionMode === "acceptEdits"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "acceptEdits" })} title={t("wizard.step3.modeAcceptEdits")} description={t("wizard.step3.modeAcceptEditsDesc")} />
                <RadioOption selected={config.permissionMode === "auto"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "auto" })} title={t("wizard.step3.modeAuto")} description={t("wizard.step3.modeAutoDesc")} />
                <RadioOption selected={config.permissionMode === "dontAsk"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "dontAsk" })} title={t("wizard.step3.modeDontAsk")} description={t("wizard.step3.modeDontAskDesc")} />
              </QuestionCard>

              {/* === Collapsible advanced === */}
              <button onClick={() => toggleSection("step3")} className="flex items-center gap-2 text-xs text-[#0D6E6E] font-medium cursor-pointer hover:underline py-1">
                <span className={`transition-transform ${expandedSections.step3 ? "rotate-90" : ""}`}>▸</span>
                {expandedSections.step3 ? t("common.showLess") : t("common.learnMore")}
              </button>
              {expandedSections.step3 && (
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
                    <div className="flex flex-col gap-2">
                      {([
                        ["Bash", t("wizard.step3.toolBash")],
                        ["Read", t("wizard.step3.toolRead")],
                        ["Edit", t("wizard.step3.toolEdit")],
                        ["Write", t("wizard.step3.toolWrite")],
                        ["Glob", t("wizard.step3.toolGlob")],
                        ["Grep", t("wizard.step3.toolGrep")],
                        ["WebFetch", t("wizard.step3.toolWebFetch")],
                        ["WebSearch", t("wizard.step3.toolWebSearch")],
                        ["Agent", t("wizard.step3.toolAgent")],
                        ["NotebookEdit", t("wizard.step3.toolNotebookEdit")],
                      ] as [string, string][]).map(([tool, desc]) => (
                        <label key={tool} className={`flex items-center gap-3 px-3 py-2 rounded border cursor-pointer text-xs ${config.disallowedTools.includes(tool) ? "border-[#dc2626] bg-red-50" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"}`}>
                          <input type="checkbox" checked={config.disallowedTools.includes(tool)} onChange={(e) => {
                            const updated = e.target.checked ? [...config.disallowedTools, tool] : config.disallowedTools.filter(t => t !== tool);
                            if (e.target.checked && ["Bash", "Read", "Edit", "Write"].includes(tool)) {
                              addToast(t("wizard.step3.criticalToolWarning", { tool }), "error");
                            }
                            dispatch({ type: "SET_FIELD", field: "disallowedTools", value: updated });
                          }} className="hidden" />
                          <span className={`font-mono font-medium ${config.disallowedTools.includes(tool) ? "text-[#dc2626] line-through" : "text-[#1A1A1A]"}`}>{tool}</span>
                          <span className="text-[#888888]">{desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                    <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">{t("wizard.step3.rules")}</h4>
                    <p className="text-xs text-[#888888] mb-4">{t("wizard.step3.rulesDesc")}</p>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#666666] mb-2 block">{t("wizard.step3.allow")}</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={allowInput} onChange={(e) => setAllowInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddAllow()} placeholder={t("wizard.step3.allowPlaceholder")} className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
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
                        <input type="text" value={askInput} onChange={(e) => setAskInput(e.target.value)} onKeyDown={(e) => {
                          if (e.key === "Enter" && askInput.trim()) {
                            if (!isValidPermRule(askInput.trim())) { addToast(t("wizard.step3.invalidRule"), "error"); return; }
                            dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, ask: [...(config.permissions.ask || []), askInput.trim()] } });
                            setAskInput("");
                          }
                        }} placeholder={t("wizard.step3.askPlaceholder")} className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
                        <button onClick={() => {
                          if (!askInput.trim()) return;
                          if (!isValidPermRule(askInput.trim())) { addToast(t("wizard.step3.invalidRule"), "error"); return; }
                          dispatch({ type: "SET_FIELD", field: "permissions", value: { ...config.permissions, ask: [...(config.permissions.ask || []), askInput.trim()] } });
                          setAskInput("");
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
                        <input type="text" value={denyInput} onChange={(e) => setDenyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddDeny()} placeholder={t("wizard.step3.denyPlaceholder")} className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
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

              {/* === Collapsible advanced === */}
              <button onClick={() => toggleSection("step4")} className="flex items-center gap-2 text-xs text-[#0D6E6E] font-medium cursor-pointer hover:underline py-1">
                <span className={`transition-transform ${expandedSections.step4 ? "rotate-90" : ""}`}>▸</span>
                {expandedSections.step4 ? t("common.showLess") : t("common.learnMore")}
              </button>
              {expandedSections.step4 && (
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
      {/* Left Panel — single scroll, sticky header + sticky buttons */}
      <div ref={scrollRef} className="flex-1 bg-[#FAFAFA] overflow-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#FAFAFA] px-4 md:px-8 pt-4 md:pt-5 pb-3 border-b border-[#E5E5E5]">
          {/* Breadcrumb */}
          <div className="mb-2">
            <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">
              {stepMeta.breadcrumb}
            </span>
          </div>

          <div className="mb-4" style={{ opacity: stepFade === "visible" ? 1 : 0, transition: "opacity 500ms ease-in-out" }}>
            <h1 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] tracking-[-1px]">{stepMeta.title}</h1>
            <p className="text-[14px] text-[#666666] mt-1">{stepMeta.subtitle}</p>
          </div>

          {progressSteps.length > 1 && <WizardProgress steps={progressSteps} currentStep={progressIndex} />}
        </div>

        {/* Content + Buttons */}
        <div ref={contentRef} className="px-4 md:px-8 pt-2 pb-14 md:pb-6 overflow-auto flex-1">
          <div className="flex flex-col gap-4" style={{ opacity: stepFade === "visible" ? 1 : 0, transition: "opacity 500ms ease-in-out" }}>
            {renderStepContent()}
          </div>

          {/* Buttons */}
          <div className="mt-6">
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex gap-1 overflow-x-auto">
            {generatedFiles.map((file) => (
              <button key={file.path} onClick={() => setSelectedPreviewFile(file.path)}
                className={`relative px-3 py-1.5 text-xs font-mono rounded-t whitespace-nowrap cursor-pointer transition-all duration-200 ${selectedPreviewFile === file.path ? "bg-white text-[#0D6E6E] font-semibold border border-b-0 border-[#E0E0E0]" : "text-[#888888] hover:text-[#666666] hover:bg-[#F0F0F0] hover:-translate-y-[1px]"}`}>
                {file.path.split("/").pop()}
                {changedFiles.has(file.path) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0D6E6E] rounded-full animate-pulse-fade" />}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-md rounded-tl-none border border-[#E0E0E0] flex-1 overflow-auto">
          <div className="px-3 py-2 border-b border-[#E0E0E0] bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666]">{selectedPreviewFile}</span>
              {currentFile && (() => {
                const lineCount = currentFile.content.split("\n").length;
                const isClaudeMd = selectedPreviewFile === "CLAUDE.md";
                const warn = isClaudeMd && lineCount > 150;
                return (
                  <span className={`font-[family-name:var(--font-jetbrains)] text-[10px] ${warn ? "text-[#dc2626] font-medium" : "text-[#999999]"}`}>
                    {lineCount} {t("home.terminalLines")}{warn ? " ⚠" : ""}
                  </span>
                );
              })()}
            </div>
            <p className="text-[10px] text-[#999999] mt-0.5">
              {(() => {
                const name = selectedPreviewFile.split("/").pop() || "";
                const key = selectedPreviewFile.includes("/rules/")
                  ? "wizard.preview.fileDesc.rules"
                  : `wizard.preview.fileDesc.${name}`;
                const desc = t(key);
                return desc !== key ? desc : "";
              })()}
            </p>
          </div>
          <pre className="p-4 text-xs font-[family-name:var(--font-jetbrains)] leading-5 text-[#333333] whitespace-pre-wrap break-words">
            {currentFile?.content || t("wizard.preview.noContent")}
          </pre>
        </div>
        </div>
      </div>
    </div>
  );
}
