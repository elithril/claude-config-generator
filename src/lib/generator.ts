import type { ClaudeConfig, GeneratedFile } from "@/types";

const LANGUAGE_MAP: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

// Tone descriptions per language
const TONE_MAP: Record<string, Record<string, string>> = {
  fr: {
    cool: "Décontracté et amical, avec de l'humour quand approprié.",
    pro: "Professionnel et direct. Pas de politesses superflues.",
    pedagogue: "Pédagogue et patient. Explique les concepts en détail avec des exemples.",
  },
  en: {
    cool: "Casual and friendly, with humor when appropriate.",
    pro: "Professional and direct. No unnecessary pleasantries.",
    pedagogue: "Patient and educational. Explains concepts in detail with examples.",
  },
  es: {
    cool: "Relajado y amigable, con humor cuando sea apropiado.",
    pro: "Profesional y directo. Sin cortesías innecesarias.",
    pedagogue: "Pedagógico y paciente. Explica los conceptos en detalle con ejemplos.",
  },
};

const STYLE_MAP: Record<string, Record<string, string>> = {
  fr: {
    concise: "Réponses concises. Pour le code, montre uniquement les blocs modifiés (diffs) avec le chemin du fichier.",
    detailed: "Réponses détaillées avec explications complètes, exemples et alternatives considérées.",
    technical: "Réponses techniques avec références à la documentation, complexité algorithmique et trade-offs.",
  },
  en: {
    concise: "Concise responses. For code, show only modified blocks (diffs) with the file path.",
    detailed: "Detailed responses with complete explanations, examples and alternatives considered.",
    technical: "Technical responses with documentation references, algorithmic complexity and trade-offs.",
  },
  es: {
    concise: "Respuestas concisas. Para código, muestra solo los bloques modificados (diffs) con la ruta del archivo.",
    detailed: "Respuestas detalladas con explicaciones completas, ejemplos y alternativas consideradas.",
    technical: "Respuestas técnicas con referencias a documentación, complejidad algorítmica y trade-offs.",
  },
};

const SECTION_TITLES: Record<string, Record<string, string>> = {
  fr: {
    title: "# Configuration Claude Code",
    language: "## Langue",
    languageInstruction: "Toujours répondre en",
    tone: "## Ton",
    style: "## Style de réponse",
    safe: "## Sécurité",
    safeRules: "- Ne jamais exécuter de commandes destructrices sans confirmation\n- Toujours vérifier les fichiers avant modification\n- Préférer les opérations réversibles",
    dev: "## Développement",
    devRules: "- Mode développement avec plus de libertés\n- Exécution directe des commandes de build et test\n- Accès étendu au filesystem",
  },
  en: {
    title: "# Claude Code Configuration",
    language: "## Language",
    languageInstruction: "Always respond in",
    tone: "## Tone",
    style: "## Response Style",
    safe: "## Security",
    safeRules: "- Never execute destructive commands without confirmation\n- Always verify files before modification\n- Prefer reversible operations",
    dev: "## Development",
    devRules: "- Development mode with more freedom\n- Direct execution of build and test commands\n- Extended filesystem access",
  },
  es: {
    title: "# Configuración de Claude Code",
    language: "## Idioma",
    languageInstruction: "Siempre responder en",
    tone: "## Tono",
    style: "## Estilo de respuesta",
    safe: "## Seguridad",
    safeRules: "- Nunca ejecutar comandos destructivos sin confirmación\n- Siempre verificar archivos antes de modificar\n- Preferir operaciones reversibles",
    dev: "## Desarrollo",
    devRules: "- Modo desarrollo con más libertades\n- Ejecución directa de comandos de build y test\n- Acceso extendido al filesystem",
  },
};

export function generateClaudeMd(config: ClaudeConfig): string {
  if (config.claudeMdImported && config.claudeMdContent) {
    return config.claudeMdContent;
  }

  const lang = config.language || "fr";
  const s = SECTION_TITLES[lang] || SECTION_TITLES.fr;
  const toneMap = TONE_MAP[lang] || TONE_MAP.fr;
  const styleMap = STYLE_MAP[lang] || STYLE_MAP.fr;

  const sections: string[] = [];
  sections.push(`${s.title}\n`);
  sections.push(`${s.language}\n${s.languageInstruction} ${LANGUAGE_MAP[lang] || lang}.\n`);
  sections.push(`${s.tone}\n${toneMap[config.tone] || config.tone}\n`);
  sections.push(`${s.style}\n${styleMap[config.responseStyle] || config.responseStyle}\n`);

  if (config.bundle === "safe") {
    sections.push(`${s.safe}\n${s.safeRules}\n`);
  } else if (config.bundle === "dev") {
    sections.push(`${s.dev}\n${s.devRules}\n`);
  }

  return sections.join("\n");
}

export function generateSettingsJson(config: ClaudeConfig): string {
  const settings: Record<string, unknown> = {
    $schema: "https://json.schemastore.org/claude-code-settings.json",
  };

  // Permissions
  let allowRules = [...config.permissions.allow];
  let denyRules = [...config.permissions.deny];

  // Bundle presets
  if (config.bundle === "safe") {
    denyRules = [...denyRules, "Bash(rm -rf *)", "Bash(git push --force *)"];
  } else if (config.bundle === "dev") {
    allowRules = [...allowRules, "Bash(npm run *)", "Bash(npx *)", "Bash(git *)"];
  }

  const permissions: Record<string, unknown> = {};
  if (allowRules.length > 0) permissions.allow = allowRules;
  if (config.permissions.ask && config.permissions.ask.length > 0) permissions.ask = config.permissions.ask;
  if (denyRules.length > 0) permissions.deny = denyRules;
  if (config.permissionMode && config.permissionMode !== "default") {
    permissions.defaultMode = config.permissionMode;
  }

  if (Object.keys(permissions).length > 0) {
    settings.permissions = permissions;
  }

  // Language
  settings.language = config.language === "fr" ? "french" : config.language === "es" ? "spanish" : "english";

  // Model
  settings.model = config.model;

  // Effort level
  settings.effortLevel = config.effortLevel;

  // Extended thinking
  settings.alwaysThinkingEnabled = config.extendedThinking;

  // Attribution
  if (config.attribution) {
    settings.attribution = config.attribution;
  }

  // Output style
  if (config.outputStyle) {
    settings.outputStyle = config.outputStyle;
  }

  // Auto memory
  if (!config.autoMemoryEnabled) {
    settings.autoMemoryEnabled = false;
  }

  // Git instructions
  if (!config.includeGitInstructions) {
    settings.includeGitInstructions = false;
  }

  // Disallowed tools
  if (config.disallowedTools && config.disallowedTools.length > 0) {
    settings.disallowedTools = config.disallowedTools;
  }

  // Teammate mode (agent teams)
  if (config.teammateMode !== "auto") {
    settings.teammateMode = config.teammateMode;
  }

  // Auto updates channel
  if (config.autoUpdatesChannel !== "latest") {
    settings.autoUpdatesChannel = config.autoUpdatesChannel;
  }

  // Environment variables
  if (config.envVars && Object.keys(config.envVars).length > 0) {
    settings.env = config.envVars;
  }

  // Sandbox
  if (config.sandboxEnabled) {
    settings.sandbox = {
      enabled: true,
      autoAllowBashIfSandboxed: true,
    };
  }

  // Hooks
  const enabledHooks = config.hooks.filter((h) => h.enabled);
  if (config.enableHooks && enabledHooks.length > 0) {
    const hooksConfig: Record<string, Array<{ matcher?: string; hooks: Array<Record<string, unknown>> }>> = {};

    for (const hook of enabledHooks) {
      if (!hooksConfig[hook.event]) {
        hooksConfig[hook.event] = [];
      }

      const hookDef: Record<string, unknown> = {
        type: hook.action,
      };

      if (hook.action === "command") {
        hookDef.command = hook.command;
      } else if (hook.action === "prompt" || hook.action === "agent") {
        hookDef.prompt = hook.command;
      } else if (hook.action === "http") {
        hookDef.url = hook.command;
      }

      if (hook.timeout) {
        hookDef.timeout = hook.timeout;
      }
      if (hook.async) {
        hookDef.async = true;
      }

      const entry: { matcher?: string; hooks: Array<Record<string, unknown>> } = {
        hooks: [hookDef],
      };

      if (hook.matcher) {
        entry.matcher = hook.matcher;
      }

      hooksConfig[hook.event].push(entry);
    }

    settings.hooks = hooksConfig;
  }

  return JSON.stringify(settings, null, 2);
}

export function generateMcpJson(config: ClaudeConfig): string | null {
  const enabledServers = config.mcpServers.filter((s) => s.enabled);
  if (!config.enableMCP || enabledServers.length === 0) return null;

  const mcpServers: Record<string, Record<string, unknown>> = {};

  for (const server of enabledServers) {
    const serverConfig: Record<string, unknown> = {};

    if (server.transport === "stdio") {
      serverConfig.command = server.command;
      if (server.args && server.args.length > 0) {
        serverConfig.args = server.args;
      }
    } else {
      serverConfig.type = server.transport;
      serverConfig.url = server.url;
    }

    if (server.env && Object.keys(server.env).length > 0) {
      serverConfig.env = server.env;
    }

    if (server.headers && Object.keys(server.headers).length > 0) {
      serverConfig.headers = server.headers;
    }

    mcpServers[server.name.toLowerCase().replace(/\s+/g, "-")] = serverConfig;
  }

  return JSON.stringify({ mcpServers }, null, 2);
}

export function generateClaudeIgnore(config: ClaudeConfig): string {
  if (config.claudeIgnoreContent) return config.claudeIgnoreContent;

  const lines: string[] = [
    "# Dependencies",
    "node_modules/",
    "",
    "# Build output",
    "dist/",
    "build/",
    ".next/",
    "",
    "# Environment",
    ".env",
    ".env.*",
    "",
    "# IDE",
    ".idea/",
    ".vscode/",
    "",
    "# OS",
    ".DS_Store",
    "Thumbs.db",
  ];

  if (config.bundle === "safe") {
    lines.push("", "# Secrets", "secrets/", "*.pem", "*.key");
  }

  return lines.join("\n");
}

export function generateRuleFiles(config: ClaudeConfig): GeneratedFile[] {
  if (!config.enableRules) return [];

  return config.rules
    .filter((r) => r.enabled)
    .map((rule) => {
      let content = "";
      if (rule.paths && rule.paths.length > 0) {
        content += `---\npaths:\n${rule.paths.map((p) => `  - "${p}"`).join("\n")}\n---\n\n`;
      }
      content += rule.content;

      return {
        path: `.claude/rules/${rule.filename}`,
        content,
        size: new TextEncoder().encode(content).length,
      };
    });
}

export function generateAllFiles(config: ClaudeConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  const claudeMd = generateClaudeMd(config);
  files.push({ path: "CLAUDE.md", content: claudeMd, size: new TextEncoder().encode(claudeMd).length });

  const settingsJson = generateSettingsJson(config);
  files.push({ path: ".claude/settings.json", content: settingsJson, size: new TextEncoder().encode(settingsJson).length });

  const claudeIgnore = generateClaudeIgnore(config);
  files.push({ path: ".claudeignore", content: claudeIgnore, size: new TextEncoder().encode(claudeIgnore).length });

  const mcpJson = generateMcpJson(config);
  if (mcpJson) {
    files.push({ path: ".mcp.json", content: mcpJson, size: new TextEncoder().encode(mcpJson).length });
  }

  const ruleFiles = generateRuleFiles(config);
  files.push(...ruleFiles);

  return files;
}
