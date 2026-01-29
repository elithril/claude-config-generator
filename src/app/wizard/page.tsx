"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layout,
  WizardProgress,
  RadioOption,
  QuestionCard,
  PreviewPanel,
  ChoiceButton,
  Button,
} from "@/components";

type BundleType = "safe" | "dev" | "custom";
type LanguageType = "fr" | "en" | "es";
type ToneType = "cool" | "pro" | "pedagogue";
type ResponseStyleType = "concise" | "detailed" | "technical";

interface WizardState {
  bundle: BundleType;
  language: LanguageType;
  tone: ToneType;
  responseStyle: ResponseStyleType;
  enableHooks: boolean;
  enableMCP: boolean;
  enableRules: boolean;
}

const BASIC_STEPS = ["Bundle", "Personnalité", "Permissions", "Finaliser"];
const ADVANCED_STEPS = ["Hooks", "MCP", "Rules", "Finaliser"];

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedStep, setAdvancedStep] = useState(0);

  const [state, setState] = useState<WizardState>({
    bundle: "safe",
    language: "fr",
    tone: "cool",
    responseStyle: "concise",
    enableHooks: false,
    enableMCP: false,
    enableRules: false,
  });

  const steps = showAdvanced ? ADVANCED_STEPS : BASIC_STEPS;
  const activeStep = showAdvanced ? advancedStep : currentStep;

  const handleNext = () => {
    if (showAdvanced) {
      if (advancedStep < ADVANCED_STEPS.length - 1) {
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

  const getPreviewContent = () => {
    if (currentStep === 0 || (!showAdvanced && currentStep === 0)) {
      return {
        title: "FICHIERS GÉNÉRÉS",
        metrics: [
          { value: "3", label: "Fichiers", highlight: true },
          { value: "~50", label: "Lignes" },
          { value: "2.4kb", label: "Total" },
        ],
        previewTitle: `${state.bundle === "safe" ? "Safe" : state.bundle === "dev" ? "Dev" : "Custom"} Mode - Aperçu`,
        previewContent: [
          { text: "📄 CLAUDE.md", highlight: true },
          { text: "📄 settings.json", highlight: false },
          { text: "📄 .claudeignore", highlight: false },
        ],
      };
    }

    return {
      title: "LIVE PREVIEW",
      metrics: [
        { value: "12", label: "Lignes", highlight: true },
        { value: "2", label: "Sections" },
        { value: "0.4kb", label: "Taille" },
      ],
      previewTitle: "CLAUDE.md",
      previewContent: [
        { text: "# Langue", highlight: true },
        {
          text:
            state.language === "fr"
              ? "Toujours répondre en français."
              : state.language === "en"
              ? "Always respond in English."
              : "Siempre responder en español.",
          highlight: false,
        },
        { text: "", highlight: false },
        { text: "# Ton", highlight: true },
        {
          text:
            state.tone === "cool"
              ? "Style décontracté et amical."
              : state.tone === "pro"
              ? "Style professionnel et direct."
              : "Style pédagogique et explicatif.",
          highlight: false,
        },
      ],
    };
  };

  const preview = getPreviewContent();

  const renderStepContent = () => {
    // Basic steps
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return (
            <QuestionCard title="Quel setup te correspond ?">
              <RadioOption
                selected={state.bundle === "safe"}
                onClick={() => setState({ ...state, bundle: "safe" })}
                emoji="🛡️"
                title="Safe Mode"
                description="Demande confirmation avant chaque action. Idéal pour débuter."
                detail="→ CLAUDE.md · settings.json · .claudeignore"
              />
              <RadioOption
                selected={state.bundle === "dev"}
                onClick={() => setState({ ...state, bundle: "dev" })}
                emoji="⚡"
                title="Dev Rapide"
                description="Write auto, Bash limité. Pour les devs qui veulent aller vite."
                detail="→ CLAUDE.md · settings.json · .claudeignore"
              />
              <RadioOption
                selected={state.bundle === "custom"}
                onClick={() => setState({ ...state, bundle: "custom" })}
                emoji="⚙️"
                title="Personnalisé"
                description="Configure chaque détail : permissions, hooks, MCP, rules..."
                detail="→ Tous les fichiers disponibles"
              />
            </QuestionCard>
          );

        case 1:
          return (
            <>
              <QuestionCard title="Claude doit te parler en...">
                <RadioOption
                  selected={state.language === "fr"}
                  onClick={() => setState({ ...state, language: "fr" })}
                  emoji="🇫🇷"
                  title="Français"
                />
                <RadioOption
                  selected={state.language === "en"}
                  onClick={() => setState({ ...state, language: "en" })}
                  emoji="🇬🇧"
                  title="English"
                />
                <RadioOption
                  selected={state.language === "es"}
                  onClick={() => setState({ ...state, language: "es" })}
                  emoji="🇪🇸"
                  title="Español"
                />
              </QuestionCard>

              <QuestionCard title="Tu préfères qu'il soit...">
                <div className="flex gap-3">
                  <ChoiceButton
                    emoji="😎"
                    label="Cool"
                    selected={state.tone === "cool"}
                    onClick={() => setState({ ...state, tone: "cool" })}
                  />
                  <ChoiceButton
                    emoji="👔"
                    label="Pro"
                    selected={state.tone === "pro"}
                    onClick={() => setState({ ...state, tone: "pro" })}
                  />
                  <ChoiceButton
                    emoji="📚"
                    label="Pédagogue"
                    selected={state.tone === "pedagogue"}
                    onClick={() => setState({ ...state, tone: "pedagogue" })}
                  />
                </div>
              </QuestionCard>
            </>
          );

        case 2:
          return (
            <QuestionCard title="Comment Claude doit-il répondre ?">
              <RadioOption
                selected={state.responseStyle === "concise"}
                onClick={() => setState({ ...state, responseStyle: "concise" })}
                title="Concis et direct"
              />
              <RadioOption
                selected={state.responseStyle === "detailed"}
                onClick={() => setState({ ...state, responseStyle: "detailed" })}
                title="Détaillé et pédagogue"
              />
              <RadioOption
                selected={state.responseStyle === "technical"}
                onClick={() => setState({ ...state, responseStyle: "technical" })}
                title="Technique et précis"
              />
            </QuestionCard>
          );

        case 3:
          return (
            <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
              <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-2">
                Ta config de base est prête !
              </h3>
              <p className="text-[15px] text-[#666666] mb-6">
                Tu peux l&apos;utiliser maintenant ou aller plus loin.
              </p>

              <h4 className="text-sm font-medium text-[#1A1A1A] mb-4">
                Tu veux affiner avec des options avancées ?
              </h4>

              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={state.enableHooks}
                    onChange={(e) =>
                      setState({ ...state, enableHooks: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">
                      ⚡ Hooks (automatisation)
                    </span>
                    <p className="text-[13px] text-[#666666]">
                      Scripts qui s&apos;exécutent automatiquement après certaines actions de Claude.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={state.enableMCP}
                    onChange={(e) =>
                      setState({ ...state, enableMCP: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">
                      🔌 MCP Servers (outils externes)
                    </span>
                    <p className="text-[13px] text-[#666666]">
                      Connecte Claude à des APIs, bases de données, services...
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-[#E5E5E5] rounded cursor-pointer hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={state.enableRules}
                    onChange={(e) =>
                      setState({ ...state, enableRules: e.target.checked })
                    }
                    className="mt-1 w-4 h-4 accent-[#0D6E6E]"
                  />
                  <div>
                    <span className="font-medium text-[#1A1A1A]">
                      📜 Rules modulaires
                    </span>
                    <p className="text-[13px] text-[#666666]">
                      Règles spécifiques pour différents types de fichiers.
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
      switch (advancedStep) {
        case 0:
          return (
            <QuestionCard title="Quand veux-tu être notifié ?">
              <RadioOption
                selected={true}
                onClick={() => {}}
                title="Avant chaque modification de fichier"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Avant chaque commande Bash"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Jamais (confiance totale)"
              />
            </QuestionCard>
          );

        case 1:
          return (
            <QuestionCard title="Quels outils veux-tu connecter ?">
              <RadioOption
                selected={true}
                onClick={() => {}}
                title="Avant chaque modification de fichier"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Avant chaque commande Bash"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Jamais (confiance totale)"
              />
            </QuestionCard>
          );

        case 2:
          return (
            <QuestionCard title="Où appliquer des règles spécifiques ?">
              <RadioOption
                selected={true}
                onClick={() => {}}
                title="Avant chaque modification de fichier"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Avant chaque commande Bash"
              />
              <RadioOption
                selected={false}
                onClick={() => {}}
                title="Jamais (confiance totale)"
              />
            </QuestionCard>
          );

        case 3:
          return (
            <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
              <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-5">
                Fichiers générés
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  {
                    name: "CLAUDE.md",
                    desc: "Instructions, langue, ton, conventions",
                    size: "1.2kb",
                  },
                  {
                    name: "settings.json",
                    desc: "Permissions, modèle, environnement",
                    size: "0.8kb",
                  },
                  {
                    name: ".claudeignore",
                    desc: "Fichiers/dossiers ignorés",
                    size: "0.3kb",
                  },
                ].map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-4 p-4 bg-[#F0FAFA] border-2 border-[#0D6E6E] rounded-lg"
                  >
                    <div className="w-6 h-6 bg-[#0D6E6E] rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-[family-name:var(--font-jetbrains)] text-sm font-semibold text-[#1A1A1A]">
                        {file.name}
                      </span>
                      <p className="text-xs text-[#666666]">{file.desc}</p>
                    </div>
                    <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#888888]">
                      {file.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
      }
    }

    return null;
  };

  const getBreadcrumb = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return "WIZARD / CHOIX INITIAL";
        case 1:
          return "SECTION 1 / PERSONNALITÉ";
        case 2:
          return "SECTION 2 / PERMISSIONS";
        case 3:
          return "WIZARD / PRESQUE FINI";
        default:
          return "WIZARD";
      }
    }
    switch (advancedStep) {
      case 0:
        return "SECTION 3 / AUTOMATISATION";
      case 1:
        return "SECTION 4 / OUTILS EXTERNES";
      case 2:
        return "SECTION 5 / RÈGLES AVANCÉES";
      case 3:
        return "WIZARD / TERMINÉ 🎉";
      default:
        return "WIZARD";
    }
  };

  const getTitle = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return "Configuration Wizard";
        case 1:
          return "Comment Claude doit se comporter ?";
        case 2:
          return "Que peut faire Claude ?";
        case 3:
          return "Ta config de base est prête !";
        default:
          return "Configuration Wizard";
      }
    }
    switch (advancedStep) {
      case 0:
        return "Configure les Hooks";
      case 1:
        return "Configure les MCP Servers";
      case 2:
        return "Configure les Rules modulaires";
      case 3:
        return "Ta configuration est prête !";
      default:
        return "Configuration Wizard";
    }
  };

  const getSubtitle = () => {
    if (!showAdvanced) {
      switch (currentStep) {
        case 0:
          return "Choisis un preset pour démarrer rapidement, ou personnalise tout.";
        case 1:
          return "Ces réponses configurent le fichier CLAUDE.md";
        case 2:
          return "Configure les permissions et le style de réponse.";
        case 3:
          return "Tu peux l'utiliser maintenant ou aller plus loin.";
        default:
          return "";
      }
    }
    switch (advancedStep) {
      case 0:
        return "Scripts qui s'exécutent automatiquement avant/après les actions.";
      case 1:
        return "Connecte Claude à des APIs, bases de données, services...";
      case 2:
        return "Règles spécifiques par dossier ou type de fichier.";
      case 3:
        return "Sélectionne les fichiers à télécharger.";
      default:
        return "";
    }
  };

  const getButtonText = () => {
    if (!showAdvanced && currentStep === 3) {
      if (state.enableHooks || state.enableMCP || state.enableRules) {
        return "Affiner →";
      }
      return "Télécharger ↓";
    }
    if (showAdvanced && advancedStep === 3) {
      return "Télécharger ↓";
    }
    return "Continue →";
  };

  const handleMainAction = () => {
    if (!showAdvanced && currentStep === 3) {
      if (state.enableHooks || state.enableMCP || state.enableRules) {
        setShowAdvanced(true);
        setAdvancedStep(0);
      } else {
        alert("Téléchargement de la configuration...");
      }
    } else if (showAdvanced && advancedStep === 3) {
      alert("Téléchargement de la configuration...");
    } else {
      handleNext();
    }
  };

  return (
    <Layout>
      <div className="flex h-screen">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col bg-[#FAFAFA] p-8 overflow-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-[family-name:var(--font-newsreader)] text-[28px] font-medium text-[#0D6E6E] tracking-[-1px]">
              {getTitle()}
            </h1>
            <p className="text-[14px] text-[#666666] mt-1">{getSubtitle()}</p>
          </div>

          {/* Progress */}
          <WizardProgress steps={steps} currentStep={activeStep} />

          {/* Content */}
          <div className="flex flex-col gap-4 mt-6 flex-1">{renderStepContent()}</div>

          {/* Buttons */}
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button variant="primary" onClick={handleMainAction}>
              {getButtonText()}
            </Button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <PreviewPanel
          title={preview.title}
          metrics={preview.metrics}
          previewTitle={preview.previewTitle}
          previewContent={preview.previewContent}
        />
      </div>
    </Layout>
  );
}
