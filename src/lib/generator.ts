import type { ClaudeConfig, GeneratedFile } from "@/types";

const LANGUAGE_MAP: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

const TONE_MAP: Record<string, string> = {
  cool: "Décontracté et amical, avec de l'humour quand approprié.",
  pro: "Professionnel et direct. Pas de politesses superflues.",
  pedagogue: "Pédagogue et patient. Explique les concepts en détail avec des exemples.",
};

const STYLE_MAP: Record<string, string> = {
  concise: "Réponses concises. Pour le code, montre uniquement les blocs modifiés (diffs) avec le chemin du fichier.",
  detailed: "Réponses détaillées avec explications complètes, exemples et alternatives considérées.",
  technical: "Réponses techniques avec références à la documentation, complexité algorithmique et trade-offs.",
};

export function generateClaudeMd(config: ClaudeConfig): string {
  if (config.claudeMdImported && config.claudeMdContent) {
    return config.claudeMdContent;
  }

  const sections: string[] = [];
  sections.push("# Configuration Claude Code\n");

  // Language
  sections.push(`## Langue\nToujours répondre en ${LANGUAGE_MAP[config.language] || config.language}.\n`);

  // Tone
  sections.push(`## Ton\n${TONE_MAP[config.tone] || config.tone}\n`);

  // Response style
  sections.push(`## Style de réponse\n${STYLE_MAP[config.responseStyle] || config.responseStyle}\n`);

  // Bundle-specific instructions
  if (config.bundle === "safe") {
    sections.push(`## Sécurité\n- Ne jamais exécuter de commandes destructrices sans confirmation\n- Toujours vérifier les fichiers avant modification\n- Préférer les opérations réversibles\n`);
  } else if (config.bundle === "dev") {
    sections.push(`## Développement\n- Mode développement avec plus de libertés\n- Exécution directe des commandes de build et test\n- Accès étendu au filesystem\n`);
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
  if (denyRules.length > 0) permissions.deny = denyRules;
  if (config.permissionMode && config.permissionMode !== "default") {
    permissions.defaultMode = config.permissionMode;
  }

  if (Object.keys(permissions).length > 0) {
    settings.permissions = permissions;
  }

  // Language
  settings.language = config.language === "fr" ? "french" : config.language === "es" ? "spanish" : "english";

  // Model — always write so user sees it in preview
  settings.model = config.model;

  // Effort level
  settings.effortLevel = config.effortLevel;

  // Extended thinking
  settings.alwaysThinkingEnabled = config.extendedThinking;

  // Attribution
  settings.includeCoAuthoredBy = config.includeCoAuthoredBy;

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

      // Different fields depending on hook type
      if (hook.action === "command") {
        hookDef.command = hook.command;
      } else if (hook.action === "prompt" || hook.action === "agent") {
        hookDef.prompt = hook.command; // "command" field stores the prompt text
      } else if (hook.action === "http") {
        hookDef.url = hook.command; // "command" field stores the URL
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

  // CLAUDE.md
  const claudeMd = generateClaudeMd(config);
  files.push({ path: "CLAUDE.md", content: claudeMd, size: new TextEncoder().encode(claudeMd).length });

  // settings.json
  const settingsJson = generateSettingsJson(config);
  files.push({ path: ".claude/settings.json", content: settingsJson, size: new TextEncoder().encode(settingsJson).length });

  // .claudeignore
  const claudeIgnore = generateClaudeIgnore(config);
  files.push({ path: ".claudeignore", content: claudeIgnore, size: new TextEncoder().encode(claudeIgnore).length });

  // .mcp.json
  const mcpJson = generateMcpJson(config);
  if (mcpJson) {
    files.push({ path: ".mcp.json", content: mcpJson, size: new TextEncoder().encode(mcpJson).length });
  }

  // Rules
  const ruleFiles = generateRuleFiles(config);
  files.push(...ruleFiles);

  return files;
}
