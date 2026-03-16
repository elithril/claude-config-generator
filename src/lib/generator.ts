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
  const permissions: Record<string, string[]> = {};
  if (config.permissions.allow.length > 0) {
    permissions.allow = config.permissions.allow;
  }
  if (config.permissions.deny.length > 0) {
    permissions.deny = config.permissions.deny;
  }

  // Bundle presets
  if (config.bundle === "safe") {
    permissions.deny = [
      ...(permissions.deny || []),
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
    ];
  } else if (config.bundle === "dev") {
    permissions.allow = [
      ...(permissions.allow || []),
      "Bash(npm run *)",
      "Bash(npx *)",
      "Bash(git *)",
    ];
  }

  if (Object.keys(permissions).length > 0) {
    settings.permissions = permissions;
  }

  // Language
  settings.language = config.language === "fr" ? "french" : config.language === "es" ? "spanish" : "english";

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
        command: hook.command,
      };

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
        size: new Blob([content]).size,
      };
    });
}

export function generateAllFiles(config: ClaudeConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  // CLAUDE.md
  const claudeMd = generateClaudeMd(config);
  files.push({ path: "CLAUDE.md", content: claudeMd, size: new Blob([claudeMd]).size });

  // settings.json
  const settingsJson = generateSettingsJson(config);
  files.push({ path: ".claude/settings.json", content: settingsJson, size: new Blob([settingsJson]).size });

  // .claudeignore
  const claudeIgnore = generateClaudeIgnore(config);
  files.push({ path: ".claudeignore", content: claudeIgnore, size: new Blob([claudeIgnore]).size });

  // .mcp.json
  const mcpJson = generateMcpJson(config);
  if (mcpJson) {
    files.push({ path: ".mcp.json", content: mcpJson, size: new Blob([mcpJson]).size });
  }

  // Rules
  const ruleFiles = generateRuleFiles(config);
  files.push(...ruleFiles);

  return files;
}
