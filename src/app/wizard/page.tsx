"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
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
import { downloadAsZip } from "@/lib/download";
import { saveToVault } from "@/lib/storage";
import { formatFileSize } from "@/lib/download";
import type { HookEntry, McpServer, RuleEntry } from "@/types";

const BASIC_STEPS = ["Bundle", "Personnalité", "Permissions", "Affiner"];

export default function WizardPage() {
  const router = useRouter();
  const { config, dispatch } = useConfig();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0);

  // Custom permission inputs
  const [allowInput, setAllowInput] = useState("");
  const [denyInput, setDenyInput] = useState("");

  // Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Reset config on mount
  useEffect(() => {
    dispatch({ type: "RESET" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic advanced steps based on what's enabled
  const advancedSteps = useMemo(() => {
    const steps: { key: string; label: string }[] = [];
    if (config.enableHooks) steps.push({ key: "hooks", label: "Hooks" });
    if (config.enableMCP) steps.push({ key: "mcp", label: "MCP" });
    if (config.enableRules) steps.push({ key: "rules", label: "Rules" });
    steps.push({ key: "recap", label: "Finaliser" });
    return steps;
  }, [config.enableHooks, config.enableMCP, config.enableRules]);

  // All steps for the progress bar
  const allSteps = showAdvanced
    ? advancedSteps.map((s) => s.label)
    : BASIC_STEPS;
  const activeStepIndex = showAdvanced ? advancedStep : currentStep;

  // Generated files for preview
  const generatedFiles = useMemo(() => generateAllFiles(config), [config]);
  const totalSize = generatedFiles.reduce((acc, f) => acc + f.size, 0);

  // Which file to show in preview based on current step
  const getContextualFile = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0: return "CLAUDE.md";
        case 1: return "CLAUDE.md";
        case 2: return ".claude/settings.json";
        case 3: return "CLAUDE.md";
        default: return "CLAUDE.md";
      }
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return ".claude/settings.json";
      case "mcp": return ".mcp.json";
      case "rules": return generatedFiles.find(f => f.path.startsWith(".claude/rules/"))?.path || "CLAUDE.md";
      case "recap": return "CLAUDE.md";
      default: return "CLAUDE.md";
    }
  };

  const [selectedPreviewFile, setSelectedPreviewFile] = useState("CLAUDE.md");

  // Auto-select contextual file when step changes
  useEffect(() => {
    setSelectedPreviewFile(getContextualFile());
  }, [currentStep, advancedStep, showAdvanced]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    if (showAdvanced) {
      if (advancedStep < advancedSteps.length - 1) {
        setAdvancedStep(advancedStep + 1);
      }
    } else {
      if (currentStep < BASIC_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
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
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      } else {
        router.push("/");
      }
    }
  };

  const handleDownload = async () => {
    try {
      await downloadAsZip(generatedFiles);
      addToast("Configuration telechargee !");
    } catch {
      addToast("Erreur lors du telechargement", "error");
    }
  };

  const handleSaveToVault = () => {
    if (!saveName.trim()) return;
    saveToVault(saveName.trim(), config);
    addToast("Sauvegarde dans le Vault");
    setShowSaveDialog(false);
    setSaveName("");
  };

  const handleAddAllow = () => {
    if (!allowInput.trim()) return;
    dispatch({
      type: "SET_FIELD",
      field: "permissions",
      value: {
        ...config.permissions,
        allow: [...config.permissions.allow, allowInput.trim()],
      },
    });
    setAllowInput("");
  };

  const handleAddDeny = () => {
    if (!denyInput.trim()) return;
    dispatch({
      type: "SET_FIELD",
      field: "permissions",
      value: {
        ...config.permissions,
        deny: [...config.permissions.deny, denyInput.trim()],
      },
    });
    setDenyInput("");
  };

  const handleRemoveAllow = (index: number) => {
    dispatch({
      type: "SET_FIELD",
      field: "permissions",
      value: {
        ...config.permissions,
        allow: config.permissions.allow.filter((_, i) => i !== index),
      },
    });
  };

  const handleRemoveDeny = (index: number) => {
    dispatch({
      type: "SET_FIELD",
      field: "permissions",
      value: {
        ...config.permissions,
        deny: config.permissions.deny.filter((_, i) => i !== index),
      },
    });
  };

  const toggleHook = (hookId: string) => {
    const updated = config.hooks.map((h: HookEntry) =>
      h.id === hookId ? { ...h, enabled: !h.enabled } : h
    );
    dispatch({ type: "SET_FIELD", field: "hooks", value: updated });
  };

  const toggleMcpServer = (serverId: string) => {
    const updated = config.mcpServers.map((s: McpServer) =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    );
    dispatch({ type: "SET_FIELD", field: "mcpServers", value: updated });
  };

  const toggleRule = (ruleId: string) => {
    const updated = config.rules.map((r: RuleEntry) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    dispatch({ type: "SET_FIELD", field: "rules", value: updated });
  };

  const renderStepContent = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return (
            <QuestionCard title="Quel setup te correspond ?">
              <RadioOption
                selected={config.bundle === "safe"}
                onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "safe" })}
                emoji="🛡️"
                title="Safe Mode"
                description="Demande confirmation avant chaque action. Ideal pour debuter."
                detail="-> CLAUDE.md . settings.json . .claudeignore"
              />
              <RadioOption
                selected={config.bundle === "dev"}
                onClick={() => dispatch({ type: "SET_FIELD", field: "bundle", value: "dev" })}
                emoji="⚡"
                title="Dev Rapide"
                description="Write auto, Bash limite. Pour les devs qui veulent aller vite."
                detail="-> CLAUDE.md . settings.json . .claudeignore"
              />
            </QuestionCard>
          );

        case 1:
          return (
            <>
              <QuestionCard title="Claude doit te parler en...">
                <RadioOption
                  selected={config.language === "fr"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "fr" })}
                  emoji="🇫🇷"
                  title="Francais"
                />
                <RadioOption
                  selected={config.language === "en"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "en" })}
                  emoji="🇬🇧"
                  title="English"
                />
                <RadioOption
                  selected={config.language === "es"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "language", value: "es" })}
                  emoji="🇪🇸"
                  title="Espanol"
                />
              </QuestionCard>

              <QuestionCard title="Tu preferes qu'il soit...">
                <div className="flex gap-3">
                  <ChoiceButton
                    emoji="😎"
                    label="Cool"
                    selected={config.tone === "cool"}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "cool" })}
                  />
                  <ChoiceButton
                    emoji="👔"
                    label="Pro"
                    selected={config.tone === "pro"}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pro" })}
                  />
                  <ChoiceButton
                    emoji="📚"
                    label="Pedagogue"
                    selected={config.tone === "pedagogue"}
                    onClick={() => dispatch({ type: "SET_FIELD", field: "tone", value: "pedagogue" })}
                  />
                </div>
              </QuestionCard>

              {/* CLAUDE.md import */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2">CLAUDE.md</h4>
                <p className="text-xs text-[#888888] mb-3">
                  Un squelette sera genere automatiquement. Tu peux aussi importer ton propre fichier pour l&apos;ecraser.
                </p>
                <FileDropZone
                  onFileLoaded={(content) => {
                    dispatch({ type: "IMPORT_CLAUDE_MD", content });
                    addToast("CLAUDE.md importe");
                  }}
                  currentContent={config.claudeMdImported ? config.claudeMdContent : ""}
                  accept=".md"
                />
              </div>
            </>
          );

        case 2:
          return (
            <>
              <QuestionCard title="Comment Claude doit-il repondre ?">
                <RadioOption
                  selected={config.responseStyle === "concise"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "concise" })}
                  title="Concis et direct"
                  description="Diffs uniquement, pas de blabla."
                />
                <RadioOption
                  selected={config.responseStyle === "detailed"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "detailed" })}
                  title="Detaille et pedagogue"
                  description="Explications completes avec exemples."
                />
                <RadioOption
                  selected={config.responseStyle === "technical"}
                  onClick={() => dispatch({ type: "SET_FIELD", field: "responseStyle", value: "technical" })}
                  title="Technique et precis"
                  description="References doc, complexite, trade-offs."
                />
              </QuestionCard>

              {/* Custom permissions */}
              <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">Regles personnalisees</h4>

                {/* Allow rules */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-[#666666] mb-2 block">Allow (autoriser)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={allowInput}
                      onChange={(e) => setAllowInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddAllow()}
                      placeholder="Bash(npm run *)"
                      className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
                    />
                    <button
                      onClick={handleAddAllow}
                      className="px-3 py-2 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {config.permissions.allow.map((rule, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                      >
                        {rule}
                        <button onClick={() => handleRemoveAllow(i)} className="hover:text-green-900">x</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Deny rules */}
                <div>
                  <label className="text-xs font-medium text-[#666666] mb-2 block">Deny (refuser)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={denyInput}
                      onChange={(e) => setDenyInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddDeny()}
                      placeholder="Read(./.env)"
                      className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
                    />
                    <button
                      onClick={handleAddDeny}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {config.permissions.deny.map((rule, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200"
                      >
                        {rule}
                        <button onClick={() => handleRemoveDeny(i)} className="hover:text-red-900">x</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );

        case 3:
          return (
            <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
              <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-2">
                Ta config de base est prete !
              </h3>
              <p className="text-[15px] text-[#666666] mb-6">
                Tu peux l&apos;utiliser maintenant ou aller plus loin.
              </p>

              <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">
                Tu veux affiner avec des options avancees ?
              </h4>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={config.enableHooks}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "enableHooks", value: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">Hooks (automatisation)</span>
                    <p className="text-[13px] text-[#666666]">
                      Scripts qui s&apos;executent automatiquement apres certaines actions de Claude.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={config.enableMCP}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "enableMCP", value: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">MCP Servers (outils externes)</span>
                    <p className="text-[13px] text-[#666666]">
                      Connecte Claude a des APIs, bases de donnees, services...
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={config.enableRules}
                    onChange={(e) => dispatch({ type: "SET_FIELD", field: "enableRules", value: e.target.checked })}
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">Rules modulaires</span>
                    <p className="text-[13px] text-[#666666]">
                      Regles specifiques pour differents types de fichiers.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          );
      }
    }

    // Advanced steps
    if (showAdvanced) {
      const stepKey = advancedSteps[advancedStep]?.key;

      switch (stepKey) {
        case "hooks":
          return renderHooksStep();
        case "mcp":
          return renderMcpStep();
        case "rules":
          return renderRulesStep();
        case "recap":
          return renderRecapStep();
      }
    }

    return null;
  };

  const renderHooksStep = () => {
    const groupedHooks: Record<string, HookEntry[]> = {};
    for (const hook of config.hooks) {
      if (!groupedHooks[hook.event]) groupedHooks[hook.event] = [];
      groupedHooks[hook.event].push(hook);
    }

    return (
      <div className="flex flex-col gap-4">
        {Object.entries(groupedHooks).map(([event, hooks]) => (
          <div key={event} className="bg-white rounded-md border border-[#E5E5E5] p-5">
            <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#F0FAFA] text-[#0D6E6E] text-xs rounded font-mono">{event}</span>
            </h4>
            <div className="flex flex-col gap-2">
              {hooks.map((hook) => (
                <label
                  key={hook.id}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    hook.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hook.enabled}
                    onChange={() => toggleHook(hook.id)}
                    className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[#1A1A1A]">{hook.description}</span>
                    {hook.enabled && (
                      <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666] mt-1 bg-[#F5F5F5] px-2 py-1 rounded">
                        {hook.command}
                      </p>
                    )}
                    {hook.matcher && (
                      <span className="text-xs text-[#888888] mt-1 block">Matcher: {hook.matcher}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMcpStep = () => {
    const popular = config.mcpServers.filter((s: McpServer) => s.popular);
    const others = config.mcpServers.filter((s: McpServer) => !s.popular);

    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Serveurs populaires</h4>
          <div className="grid grid-cols-2 gap-3">
            {popular.map((server) => (
              <label
                key={server.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  server.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={() => toggleMcpServer(server.id)}
                  className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{server.icon}</span>
                    <span className="text-sm font-medium text-[#1A1A1A]">{server.name}</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F0F0] text-[#666666] rounded">{server.transport}</span>
                  </div>
                  <p className="text-xs text-[#666666] mt-1">{server.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Autres serveurs</h4>
          <div className="flex flex-col gap-2">
            {others.map((server) => (
              <label
                key={server.id}
                className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                  server.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={() => toggleMcpServer(server.id)}
                  className="w-4 h-4 accent-[#0D6E6E]"
                />
                <span className="text-lg">{server.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#1A1A1A]">{server.name}</span>
                  <span className="text-xs text-[#666666] ml-2">{server.description}</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F0F0] text-[#666666] rounded">{server.transport}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRulesStep = () => {
    const categoryColors: Record<string, string> = {
      "code-style": "bg-blue-50 text-blue-700 border-blue-200",
      testing: "bg-purple-50 text-purple-700 border-purple-200",
      security: "bg-red-50 text-red-700 border-red-200",
      api: "bg-orange-50 text-orange-700 border-orange-200",
      git: "bg-green-50 text-green-700 border-green-200",
      custom: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <div className="flex flex-col gap-3">
        {config.rules.map((rule: RuleEntry) => (
          <div
            key={rule.id}
            className={`bg-white rounded-md border p-4 transition-colors ${
              rule.enabled ? "border-[#0D6E6E]" : "border-[#E5E5E5]"
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#1A1A1A]">{rule.title}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded border ${categoryColors[rule.category] || categoryColors.custom}`}>
                    {rule.category}
                  </span>
                </div>
                <p className="text-xs text-[#666666]">{rule.description}</p>
                {rule.paths && rule.paths.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {rule.paths.map((p, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-[10px] bg-[#F5F5F5] text-[#888888] rounded font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                {rule.enabled && (
                  <pre className="mt-2 p-3 bg-[#FAFAFA] rounded text-xs font-mono text-[#666666] max-h-24 overflow-auto">
                    {rule.content}
                  </pre>
                )}
              </div>
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderRecapStep = () => {
    return (
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
          <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-4">
            Resume de ta configuration
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-[#FAFAFA] rounded">
              <span className="text-[#888888] text-xs">Bundle</span>
              <p className="font-medium text-[#1A1A1A]">{config.bundle === "safe" ? "Safe Mode" : "Dev Rapide"}</p>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded">
              <span className="text-[#888888] text-xs">Langue</span>
              <p className="font-medium text-[#1A1A1A]">{config.language === "fr" ? "Francais" : config.language === "en" ? "English" : "Espanol"}</p>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded">
              <span className="text-[#888888] text-xs">Ton</span>
              <p className="font-medium text-[#1A1A1A]">{config.tone === "cool" ? "Cool" : config.tone === "pro" ? "Pro" : "Pedagogue"}</p>
            </div>
            <div className="p-3 bg-[#FAFAFA] rounded">
              <span className="text-[#888888] text-xs">Style</span>
              <p className="font-medium text-[#1A1A1A]">{config.responseStyle === "concise" ? "Concis" : config.responseStyle === "detailed" ? "Detaille" : "Technique"}</p>
            </div>
          </div>
        </div>

        {/* Generated files */}
        <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
          <h3 className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[#1A1A1A] mb-4">
            Fichiers generes
          </h3>
          <div className="flex flex-col gap-2">
            {generatedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-3 p-3 bg-[#F0FAFA] border border-[#0D6E6E] rounded-lg"
              >
                <div className="w-6 h-6 bg-[#0D6E6E] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
                <div className="flex-1">
                  <span className="font-[family-name:var(--font-jetbrains)] text-sm font-semibold text-[#1A1A1A]">
                    {file.path}
                  </span>
                </div>
                <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#888888]">
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
            className="flex-1 py-3 bg-[#0D6E6E] text-white rounded-lg font-medium hover:bg-[#0A5555] transition-colors"
          >
            Telecharger le ZIP
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
          Affiner dans l&apos;Expert Mode
        </button>

        {/* Save dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
      </div>
    );
  };

  const getBreadcrumb = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0: return "WIZARD / CHOIX INITIAL";
        case 1: return "SECTION 1 / PERSONNALITE";
        case 2: return "SECTION 2 / PERMISSIONS";
        case 3: return "WIZARD / PRESQUE FINI";
        default: return "WIZARD";
      }
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return "SECTION 3 / AUTOMATISATION";
      case "mcp": return "SECTION 4 / OUTILS EXTERNES";
      case "rules": return "SECTION 5 / REGLES AVANCEES";
      case "recap": return "WIZARD / TERMINE";
      default: return "WIZARD";
    }
  };

  const getTitle = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0: return "Configuration Wizard";
        case 1: return "Comment Claude doit se comporter ?";
        case 2: return "Que peut faire Claude ?";
        case 3: return "Ta config de base est prete !";
        default: return "Configuration Wizard";
      }
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return "Configure les Hooks";
      case "mcp": return "Configure les MCP Servers";
      case "rules": return "Configure les Rules modulaires";
      case "recap": return "Ta configuration est prete !";
      default: return "Configuration Wizard";
    }
  };

  const getSubtitle = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0: return "Choisis un preset pour demarrer rapidement.";
        case 1: return "Ces reponses configurent le fichier CLAUDE.md";
        case 2: return "Configure les permissions et le style de reponse.";
        case 3: return "Tu peux l'utiliser maintenant ou aller plus loin.";
        default: return "";
      }
    }
    const stepKey = advancedSteps[advancedStep]?.key;
    switch (stepKey) {
      case "hooks": return "Scripts qui s'executent automatiquement avant/apres les actions.";
      case "mcp": return "Connecte Claude a des APIs, bases de donnees, services...";
      case "rules": return "Regles specifiques par dossier ou type de fichier.";
      case "recap": return "Selectionne les fichiers a telecharger.";
      default: return "";
    }
  };

  const getButtonText = () => {
    if (!showAdvanced && currentStep === 3) {
      if (config.enableHooks || config.enableMCP || config.enableRules) {
        return "Affiner ->";
      }
      return "Finaliser";
    }
    if (showAdvanced && advancedSteps[advancedStep]?.key === "recap") {
      return null; // Buttons are in the recap step itself
    }
    return "Continue ->";
  };

  const handleMainAction = () => {
    if (!showAdvanced && currentStep === 3) {
      if (config.enableHooks || config.enableMCP || config.enableRules) {
        setShowAdvanced(true);
        setAdvancedStep(0);
      } else {
        // Go to recap directly
        setShowAdvanced(true);
        setAdvancedStep(advancedSteps.length - 1);
      }
    } else if (showAdvanced && advancedSteps[advancedStep]?.key === "recap") {
      // Handled by recap buttons
    } else {
      handleNext();
    }
  };

  // Preview content
  const currentFile = generatedFiles.find((f) => f.path === selectedPreviewFile);

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA] p-8 overflow-auto">
          {/* Breadcrumb */}
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px] mb-2">
            {getBreadcrumb()}
          </span>

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] tracking-[-1px]">
              {getTitle()}
            </h1>
            <p className="text-[14px] text-[#666666] mt-1">{getSubtitle()}</p>
          </div>

          {/* Progress */}
          <WizardProgress steps={allSteps} currentStep={activeStepIndex} />

          {/* Content */}
          <div className="flex flex-col gap-4 mt-6 flex-1">{renderStepContent()}</div>

          {/* Buttons */}
          {getButtonText() && (
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="primary" onClick={handleMainAction}>
                {getButtonText()}
              </Button>
            </div>
          )}
          {!getButtonText() && showAdvanced && advancedSteps[advancedStep]?.key === "recap" && (
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="w-[520px] h-full bg-[#F0F0F0] border-l border-[#E0E0E0] p-8 flex flex-col gap-4 overflow-auto">
          {/* Header */}
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">
            LIVE PREVIEW
          </span>

          {/* Metrics */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#0D6E6E]">
                {generatedFiles.length}
              </span>
              <span className="text-[11px] text-[#888888]">Fichiers</span>
            </div>
            <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#1A1A1A]">
                {config.rules.filter((r: RuleEntry) => r.enabled).length}
              </span>
              <span className="text-[11px] text-[#888888]">Rules</span>
            </div>
            <div className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1">
              <span className="font-[family-name:var(--font-jetbrains)] text-xl font-semibold text-[#1A1A1A]">
                {formatFileSize(totalSize)}
              </span>
              <span className="text-[11px] text-[#888888]">Total</span>
            </div>
          </div>

          {/* File Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {generatedFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedPreviewFile(file.path)}
                className={`px-3 py-1.5 text-xs font-mono rounded-t whitespace-nowrap transition-colors ${
                  selectedPreviewFile === file.path
                    ? "bg-white text-[#0D6E6E] font-semibold border border-b-0 border-[#E0E0E0]"
                    : "text-[#888888] hover:text-[#666666]"
                }`}
              >
                {file.path.split("/").pop()}
              </button>
            ))}
          </div>

          {/* File Content */}
          <div className="bg-white rounded-md border border-[#E0E0E0] flex-1 overflow-auto">
            <div className="px-3 py-2 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666]">
                {selectedPreviewFile}
              </span>
            </div>
            <pre className="p-4 text-xs font-[family-name:var(--font-jetbrains)] leading-5 text-[#333333] overflow-auto">
              {currentFile?.content || "// Aucun contenu"}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
}
