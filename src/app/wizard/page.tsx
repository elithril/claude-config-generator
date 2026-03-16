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
import { generateAllFiles } from "@/lib/generator";
import { formatFileSize } from "@/lib/download";
import type { RuleEntry } from "@/types";
import HooksStep from "./steps/HooksStep";
import McpStep from "./steps/McpStep";
import RulesStep from "./steps/RulesStep";
import RecapStep from "./steps/RecapStep";

const BASIC_STEPS = ["Bundle", "Personnalité", "Permissions", "Affiner"];

export default function WizardPage() {
  const router = useRouter();
  const { config, dispatch } = useConfig();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0);
  const [allowInput, setAllowInput] = useState("");
  const [denyInput, setDenyInput] = useState("");
  const [envKey, setEnvKey] = useState("");
  const [envValue, setEnvValue] = useState("");

  useEffect(() => {
    dispatch({ type: "RESET" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advancedSteps = useMemo(() => {
    const steps: { key: string; label: string }[] = [];
    if (config.enableHooks) steps.push({ key: "hooks", label: "Hooks" });
    if (config.enableMCP) steps.push({ key: "mcp", label: "MCP" });
    if (config.enableRules) steps.push({ key: "rules", label: "Rules" });
    steps.push({ key: "recap", label: "Finaliser" });
    return steps;
  }, [config.enableHooks, config.enableMCP, config.enableRules]);

  const allSteps = showAdvanced ? advancedSteps.map((s) => s.label) : BASIC_STEPS;
  const activeStepIndex = showAdvanced ? advancedStep : currentStep;

  const generatedFiles = useMemo(() => generateAllFiles(config), [config]);
  const totalSize = generatedFiles.reduce((acc, f) => acc + f.size, 0);

  // Track which files changed recently for visual indicator
  const prevContents = useRef<Record<string, string>>({});
  const [changedFiles, setChangedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newChanged = new Set<string>();
    for (const file of generatedFiles) {
      const prev = prevContents.current[file.path];
      if (prev !== undefined && prev !== file.content) {
        newChanged.add(file.path);
      }
      prevContents.current[file.path] = file.content;
    }
    if (newChanged.size > 0) {
      setChangedFiles(newChanged);
      const timer = setTimeout(() => setChangedFiles(new Set()), 1500);
      return () => clearTimeout(timer);
    }
  }, [generatedFiles]);

  const getContextualFile = useCallback(() => {
    if (!showAdvanced) {
      return currentStep === 2 ? ".claude/settings.json" : "CLAUDE.md";
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return ".claude/settings.json";
      case "mcp": return ".mcp.json";
      case "rules": return generatedFiles.find(f => f.path.startsWith(".claude/rules/"))?.path || "CLAUDE.md";
      default: return "CLAUDE.md";
    }
  }, [showAdvanced, currentStep, advancedStep, advancedSteps, generatedFiles]);

  const [selectedPreviewFile, setSelectedPreviewFile] = useState("CLAUDE.md");

  useEffect(() => {
    setSelectedPreviewFile(getContextualFile());
  }, [getContextualFile]);

  // === Navigation ===

  const handleNext = () => {
    if (showAdvanced) {
      if (advancedStep < advancedSteps.length - 1) setAdvancedStep(advancedStep + 1);
    } else {
      if (currentStep < BASIC_STEPS.length - 1) setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (showAdvanced) {
      if (advancedStep > 0) {
        setAdvancedStep(advancedStep - 1);
      } else {
        setShowAdvanced(false);
        setCurrentStep(3);
      }
    } else {
      if (currentStep > 0) setCurrentStep(currentStep - 1);
      else router.push("/");
    }
  };

  const handleMainAction = () => {
    if (!showAdvanced && currentStep === 3) {
      setShowAdvanced(true);
      if (config.enableHooks || config.enableMCP || config.enableRules) {
        setAdvancedStep(0);
      } else {
        setAdvancedStep(advancedSteps.length - 1);
      }
    } else {
      handleNext();
    }
  };

  // === Permission helpers ===

  const handleAddAllow = () => {
    if (!allowInput.trim()) return;
    dispatch({
      type: "SET_FIELD", field: "permissions",
      value: { ...config.permissions, allow: [...config.permissions.allow, allowInput.trim()] },
    });
    setAllowInput("");
  };

  const handleAddDeny = () => {
    if (!denyInput.trim()) return;
    dispatch({
      type: "SET_FIELD", field: "permissions",
      value: { ...config.permissions, deny: [...config.permissions.deny, denyInput.trim()] },
    });
    setDenyInput("");
  };

  // === Step metadata ===

  const stepMeta = useMemo(() => {
    if (!showAdvanced) {
      const meta = [
        { breadcrumb: "WIZARD / CHOIX INITIAL", title: "Configuration Wizard", subtitle: "Choisis un preset pour démarrer rapidement." },
        { breadcrumb: "SECTION 1 / PERSONNALITÉ", title: "Comment Claude doit se comporter ?", subtitle: "Ces réponses configurent le fichier CLAUDE.md" },
        { breadcrumb: "SECTION 2 / PERMISSIONS", title: "Que peut faire Claude ?", subtitle: "Configure les permissions et le style de réponse." },
        { breadcrumb: "WIZARD / PRESQUE FINI", title: "Ta config de base est prête !", subtitle: "Tu peux l'utiliser maintenant ou aller plus loin." },
      ];
      return meta[currentStep] || meta[0];
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    const map: Record<string, { breadcrumb: string; title: string; subtitle: string }> = {
      hooks: { breadcrumb: "SECTION 3 / AUTOMATISATION", title: "Configure les Hooks", subtitle: "Scripts qui s'exécutent automatiquement avant/après les actions." },
      mcp: { breadcrumb: "SECTION 4 / OUTILS EXTERNES", title: "Configure les MCP Servers", subtitle: "Connecte Claude à des APIs, bases de données, services..." },
      rules: { breadcrumb: "SECTION 5 / RÈGLES AVANCÉES", title: "Configure les Rules modulaires", subtitle: "Règles spécifiques par dossier ou type de fichier." },
      recap: { breadcrumb: "WIZARD / TERMINÉ", title: "Ta configuration est prête !", subtitle: "Sélectionne les fichiers à télécharger." },
    };
    return map[stepKey || "recap"];
  }, [showAdvanced, currentStep, advancedStep, advancedSteps]);

  const isRecap = showAdvanced && advancedSteps[advancedStep]?.key === "recap";
  const buttonText = !showAdvanced && currentStep === 3
    ? (config.enableHooks || config.enableMCP || config.enableRules ? "Affiner →" : "Finaliser")
    : isRecap ? null : "Continue →";

  // === Render step content ===

  const renderStepContent = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return (
            <QuestionCard title="Quel setup te correspond ?">
              <RadioOption
                selected={config.bundle === "safe"}
                onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "safe" })}
                emoji="🛡️" title="Safe Mode"
                description="Demande confirmation avant chaque action. Idéal pour débuter."
                detail="→ CLAUDE.md · settings.json · .claudeignore"
              />
              <RadioOption
                selected={config.bundle === "dev"}
                onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "dev" })}
                emoji="⚡" title="Dev Rapide"
                description="Write auto, Bash limité. Pour les devs qui veulent aller vite."
                detail="→ CLAUDE.md · settings.json · .claudeignore"
              />
            </QuestionCard>
          );

        case 1:
          return (
            <>
              <QuestionCard title="Claude doit te parler en...">
                <RadioOption selected={config.language === "fr"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "fr" })} emoji="🇫🇷" title="Français" />
                <RadioOption selected={config.language === "en"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "en" })} emoji="🇬🇧" title="English" />
                <RadioOption selected={config.language === "es"} onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "es" })} emoji="🇪🇸" title="Español" />
              </QuestionCard>
              <QuestionCard title="Tu préfères qu'il soit...">
                <div className="flex gap-3">
                  <ChoiceButton emoji="😎" label="Cool" selected={config.tone === "cool"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "cool" })} />
                  <ChoiceButton emoji="👔" label="Pro" selected={config.tone === "pro"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pro" })} />
                  <ChoiceButton emoji="📚" label="Pédagogue" selected={config.tone === "pedagogue"} onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pedagogue" })} />
                </div>
              </QuestionCard>
              <QuestionCard title="Quel modèle utiliser par défaut ?">
                <RadioOption selected={config.model === "claude-sonnet-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-sonnet-4-6" })} title="Sonnet 4.6" description="Équilibré. Rapide et capable. Recommandé." />
                <RadioOption selected={config.model === "claude-opus-4-6"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-opus-4-6" })} title="Opus 4.6" description="Le plus puissant. Raisonnement profond, tâches complexes." />
                <RadioOption selected={config.model === "claude-haiku-4-5"} onClick={() => dispatch({ type: "SET_FIELD", field: "model", value: "claude-haiku-4-5" })} title="Haiku 4.5" description="Le plus rapide. Tâches simples, itérations rapides." />
              </QuestionCard>
              <QuestionCard title="Niveau d'effort">
                <p className="text-xs text-[#888888] -mt-2 mb-2">Contrôle la profondeur de réflexion de Claude. Plus c'est haut, plus il est minutieux.</p>
                <div className="flex gap-3">
                  <ChoiceButton emoji="⚡" label="Low" selected={config.effortLevel === "low"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "low" })} />
                  <ChoiceButton emoji="⚖️" label="Medium" selected={config.effortLevel === "medium"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "medium" })} />
                  <ChoiceButton emoji="🧠" label="High" selected={config.effortLevel === "high"} onClick={() => dispatch({ type: "SET_FIELD", field: "effortLevel", value: "high" })} />
                </div>
              </QuestionCard>
              {/* Preferences */}
              {/* Output style */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">Style de sortie</h4>
                <p className="text-xs text-[#888888] mb-3">Instruction ajoutée au system prompt pour ajuster les réponses. Laisse vide pour le défaut.</p>
                <input type="text" value={config.outputStyle} onChange={(e) => dispatch({ type: "SET_FIELD", field: "outputStyle", value: e.target.value })} placeholder="Ex: Explanatory, Verbose, Minimal..." className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]" />
              </div>
              {/* Preferences toggles */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Préférences</h4>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                    <div>
                      <span className="text-sm font-medium text-[#1A1A1A]">Extended thinking</span>
                      <p className="text-xs text-[#888888]">Claude réfléchit plus longtemps avant de répondre. Meilleur pour les tâches complexes.</p>
                    </div>
                    <input type="checkbox" checked={config.extendedThinking} onChange={(e) => dispatch({ type: "SET_FIELD", field: "extendedThinking", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                  </label>
                  <div className="p-3 border border-[#E5E5E5] rounded">
                    <span className="text-sm font-medium text-[#1A1A1A]">Attribution git</span>
                    <p className="text-xs text-[#888888] mb-2">Texte ajouté aux commits et PRs créés par Claude.</p>
                    <div className="flex flex-col gap-2">
                      <input type="text" value={config.attribution.commit} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, commit: e.target.value } })} placeholder="Message de commit (vide = pas d'attribution)" className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                      <input type="text" value={config.attribution.pr} onChange={(e) => dispatch({ type: "SET_FIELD", field: "attribution", value: { ...config.attribution, pr: e.target.value } })} placeholder="Message PR (vide = pas d'attribution)" className="px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                    </div>
                  </div>
                  <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                    <div>
                      <span className="text-sm font-medium text-[#1A1A1A]">Auto-mémoire</span>
                      <p className="text-xs text-[#888888]">Claude accumule des notes entre les sessions automatiquement.</p>
                    </div>
                    <input type="checkbox" checked={config.autoMemoryEnabled} onChange={(e) => dispatch({ type: "SET_FIELD", field: "autoMemoryEnabled", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                  </label>
                  <label className="flex items-center justify-between p-3 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                    <div>
                      <span className="text-sm font-medium text-[#1A1A1A]">Instructions Git intégrées</span>
                      <p className="text-xs text-[#888888]">Inclut les instructions de workflow git/PR dans le system prompt.</p>
                    </div>
                    <input type="checkbox" checked={config.includeGitInstructions} onChange={(e) => dispatch({ type: "SET_FIELD", field: "includeGitInstructions", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                  </label>
                </div>
              </div>
              {/* CLAUDE.md import */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">CLAUDE.md</h4>
                <p className="text-xs text-[#888888] mb-3">
                  Un squelette sera généré automatiquement. Tu peux aussi importer ton propre fichier pour l&apos;écraser.
                </p>
                <FileDropZone
                  onFileLoaded={(content) => { dispatch({ type: "IMPORT_CLAUDE_MD", content }); addToast("CLAUDE.md importé"); }}
                  currentContent={config.claudeMdImported ? config.claudeMdContent : ""}
                  accept=".md"
                />
              </div>
            </>
          );

        case 2:
          return (
            <>
              <QuestionCard title="Comment Claude doit-il répondre ?">
                <RadioOption selected={config.responseStyle === "concise"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "concise" })} title="Concis et direct" description="Diffs uniquement, pas de blabla." />
                <RadioOption selected={config.responseStyle === "detailed"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "detailed" })} title="Détaillé et pédagogue" description="Explications complètes avec exemples." />
                <RadioOption selected={config.responseStyle === "technical"} onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "technical" })} title="Technique et précis" description="Références doc, complexité, trade-offs." />
              </QuestionCard>
              <QuestionCard title="Quand Claude veut utiliser un outil...">
                <RadioOption selected={config.permissionMode === "default"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "default" })} title="Demander à chaque fois" description="Claude demande confirmation pour chaque action." />
                <RadioOption selected={config.permissionMode === "plan"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "plan" })} title="Mode Plan" description="Claude propose un plan avant d'agir, tu valides l'ensemble." />
                <RadioOption selected={config.permissionMode === "acceptEdits"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "acceptEdits" })} title="Auto-édition" description="Les modifications de fichiers sont auto-approuvées. Le reste demande confirmation." />
                <RadioOption selected={config.permissionMode === "dontAsk"} onClick={() => dispatch({ type: "SET_FIELD", field: "permissionMode", value: "dontAsk" })} title="Confiance totale" description="Claude agit sans demander. Déconseillé aux débutants." />
              </QuestionCard>
              {/* Sandbox */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-[#1A1A1A]">Sandbox Bash</span>
                    <p className="text-xs text-[#888888]">Isole les commandes Bash du filesystem et du réseau. Recommandé pour la sécurité (macOS/Linux).</p>
                  </div>
                  <input type="checkbox" checked={config.sandboxEnabled} onChange={(e) => dispatch({ type: "SET_FIELD", field: "sandboxEnabled", value: e.target.checked })} className="w-4 h-4 accent-[#0D6E6E]" />
                </label>
              </div>
              {/* Disallowed tools */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">Outils désactivés</h4>
                <p className="text-xs text-[#888888] mb-3">Outils complètement retirés du contexte de Claude. Il ne pourra pas les utiliser du tout.</p>
                <div className="flex flex-wrap gap-2">
                  {["WebFetch", "WebSearch", "Agent", "Bash", "Edit", "Write", "Read", "Glob", "Grep", "NotebookEdit"].map((tool) => (
                    <label key={tool} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer text-xs ${
                      config.disallowedTools.includes(tool) ? "border-[#dc2626] bg-red-50 text-[#dc2626]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"
                    }`}>
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
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Règles personnalisées</h4>
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#666666] mb-2 block">Allow (autoriser)</label>
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
                  <label className="text-xs font-medium text-[#666666] mb-2 block">Ask (demander confirmation)</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value="" onChange={() => {}} onKeyDown={(e) => {
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
                  <label className="text-xs font-medium text-[#666666] mb-2 block">Deny (refuser)</label>
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
          );

        case 3:
          return (
            <>
              <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-2">Ta config de base est prête !</h3>
                <p className="text-[15px] text-[#666666] mb-6">Tu peux l&apos;utiliser maintenant ou aller plus loin.</p>
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Tu veux affiner avec des options avancées ?</h4>
                <div className="flex flex-col gap-3">
                  {[
                    { field: "enableHooks" as const, label: "Hooks (automatisation)", desc: "Scripts qui s'exécutent automatiquement après certaines actions de Claude." },
                    { field: "enableMCP" as const, label: "MCP Servers (outils externes)", desc: "Connecte Claude à des APIs, bases de données, services..." },
                    { field: "enableRules" as const, label: "Rules modulaires", desc: "Règles spécifiques pour différents types de fichiers." },
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

              {/* Environment variables */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-1">Variables d&apos;environnement</h4>
                <p className="text-xs text-[#888888] mb-3">Variables globales injectées dans chaque session Claude Code.</p>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={envKey} onChange={(e) => setEnvKey(e.target.value)} placeholder="NOM_VARIABLE" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                  <input type="text" value={envValue} onChange={(e) => setEnvValue(e.target.value)} placeholder="valeur" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                  <button onClick={() => {
                    if (!envKey.trim()) return;
                    dispatch({ type: "SET_FIELD", field: "envVars", value: { ...config.envVars, [envKey.trim()]: envValue.trim() } });
                    setEnvKey(""); setEnvValue("");
                  }} className="px-3 py-1.5 text-xs bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]">+</button>
                </div>
                {Object.keys(config.envVars).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(config.envVars).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F5] text-[#666666] text-[10px] rounded font-mono border border-[#E5E5E5]">
                        {k}={v}
                        <button onClick={() => {
                          const updated = { ...config.envVars };
                          delete updated[k];
                          dispatch({ type: "SET_FIELD", field: "envVars", value: updated });
                        }} className="hover:text-[#dc2626]">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent teams + updates */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Agent Teams &amp; Mises à jour</h4>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#666666] mb-2 block">Mode teammates</label>
                    <p className="text-xs text-[#888888] mb-2">Comment les agents de l&apos;équipe s&apos;affichent quand tu utilises les agent teams.</p>
                    <div className="flex gap-2">
                      {([
                        { value: "auto", label: "Auto", desc: "Détecte tmux/iTerm2" },
                        { value: "in-process", label: "In-process", desc: "Dans le même terminal" },
                        { value: "tmux", label: "Tmux", desc: "Panneaux tmux séparés" },
                      ] as const).map(({ value, label, desc }) => (
                        <button key={value} onClick={() => dispatch({ type: "SET_FIELD", field: "teammateMode", value })}
                          className={`flex-1 p-2 rounded border text-center ${config.teammateMode === value ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                          <span className="text-xs font-medium block">{label}</span>
                          <span className="text-[10px] text-[#888888]">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#666666] mb-2 block">Canal de mises à jour</label>
                    <div className="flex gap-2">
                      <button onClick={() => dispatch({ type: "SET_FIELD", field: "autoUpdatesChannel", value: "latest" })}
                        className={`flex-1 p-2 rounded border text-center ${config.autoUpdatesChannel === "latest" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                        <span className="text-xs font-medium block">Latest</span>
                        <span className="text-[10px] text-[#888888]">Dernière version disponible</span>
                      </button>
                      <button onClick={() => dispatch({ type: "SET_FIELD", field: "autoUpdatesChannel", value: "stable" })}
                        className={`flex-1 p-2 rounded border text-center ${config.autoUpdatesChannel === "stable" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E]" : "border-[#E5E5E5] text-[#666666] hover:bg-[#FAFAFA]"}`}>
                        <span className="text-xs font-medium block">Stable</span>
                        <span className="text-[10px] text-[#888888]">~1 semaine de retard, moins de bugs</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
      }
    }

    // Advanced steps — each is now its own component
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
      <div className="flex flex-col lg:flex-row h-full min-h-screen">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA] p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-2">
            {stepMeta.breadcrumb}
          </span>
          <div className="mb-6">
            <h1 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] tracking-[-1px]">{stepMeta.title}</h1>
            <p className="text-[14px] text-[#666666] mt-1">{stepMeta.subtitle}</p>
          </div>

          <WizardProgress steps={allSteps} currentStep={activeStepIndex} />

          <div key={`step-${showAdvanced ? "adv-" + advancedStep : currentStep}`} className="flex flex-col gap-4 mt-6 flex-1 animate-fade-in">{renderStepContent()}</div>

          {buttonText && (
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button variant="primary" onClick={handleMainAction}>{buttonText}</Button>
            </div>
          )}
          {!buttonText && isRecap && (
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handleBack}>Back</Button>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden lg:flex w-[520px] bg-[#F0F0F0] border-l border-[#E0E0E0] p-8 flex-col gap-4 overflow-auto">
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">LIVE PREVIEW</span>
          <div className="flex gap-3">
            {[
              { value: generatedFiles.length, label: "Fichiers", highlight: true },
              { value: config.rules.filter((r: RuleEntry) => r.enabled).length, label: "Rules" },
              { value: formatFileSize(totalSize), label: "Total" },
            ].map((m, i) => (
              <div key={i} className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
                <span className={`font-[family-name:var(--font-jetbrains)] text-xl font-semibold ${m.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"}`}>{m.value}</span>
                <span className="text-[11px] text-[#888888]">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {generatedFiles.map((file) => (
              <button key={file.path} onClick={() => setSelectedPreviewFile(file.path)}
                className={`relative px-3 py-1.5 text-xs font-mono rounded-t whitespace-nowrap ${selectedPreviewFile === file.path ? "bg-white text-[#0D6E6E] font-semibold border border-b-0 border-[#E0E0E0]" : "text-[#888888] hover:text-[#666666]"}`}>
                {file.path.split("/").pop()}
                {changedFiles.has(file.path) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#0D6E6E] rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-md border border-[#E0E0E0] flex-1 overflow-auto">
            <div className="px-3 py-2 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666]">{selectedPreviewFile}</span>
            </div>
            <pre className="p-4 text-xs font-[family-name:var(--font-jetbrains)] leading-5 text-[#333333] overflow-auto">
              {currentFile?.content || "// Aucun contenu"}
            </pre>
          </div>
        </div>
      </div>
  );
}
