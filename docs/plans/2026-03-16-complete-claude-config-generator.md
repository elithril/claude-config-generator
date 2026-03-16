# Claude Config Generator — Plan d'implémentation complet

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformer le prototype UI existant en outil complet et utilisable pour générer des fichiers de configuration Claude Code (CLAUDE.md, settings.json, .claudeignore, .mcp.json, .claude/rules/*.md) avec wizard 8 étapes, éditeur CodeMirror, bibliothèque de templates, vault localStorage, et export ZIP.

**Architecture:** App client-side Next.js 16 + React 19 + Tailwind 4. State management centralisé via React Context pour partager la config entre pages. Génération ZIP côté client avec JSZip. Éditeur CodeMirror pour le mode Expert. Persistance localStorage pour le Vault. Templates en fichiers JSON statiques dans `src/data/`.

**Tech Stack:** Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, CodeMirror 6, JSZip, file-saver, React DnD (drag & drop)

**Design Reference:** Maquettes dans `/Users/nicolasdolphens/Documents/EditorialClaudeConfigGenerator.pen` (13 écrans)

**Décisions clés :**
- **Preview Panel** : Tabs avec fichier contextuel auto-sélectionné. Métriques en haut (fichiers, taille). L'utilisateur voit le fichier pertinent se générer en temps réel à chaque étape, et peut explorer les autres via les tabs.
- **Flux Wizard ↔ Expert** : One-way (Wizard → Expert). Le Wizard génère, l'Expert affine. Pas de retour. Relancer le Wizard repart propre.
- **Flux Vault/Template** : Restore et "Use" redirigent toujours vers `/expert` (config chargée). Expert standalone (Home "Manuel") part avec config par défaut.
- **Permissions (étape 3)** : Presets liés au bundle + champ custom pour ajouter des règles allow/deny manuellement.
- **CLAUDE.md** : Squelette auto-généré (langue, ton, style) + drag & drop pour importer/écraser.
- **Wizard reset** : Le Wizard repart TOUJOURS avec une config propre (dispatch RESET au mount).
- **Étapes avancées dynamiques** : Les étapes 5-7 ne s'affichent que si cochées à l'étape 4. Le stepper et la navigation s'adaptent dynamiquement.

**Contraintes techniques :**
- CodeMirror : import dynamique `next/dynamic` avec `ssr: false` obligatoire
- JSZip / file-saver : guard `typeof window !== "undefined"` ou import dynamique
- Tests : Vitest + Testing Library sur generator.ts et storage.ts (logique pure)

---

## Batch 1 — Fondations (Types, State, Dependencies)

### Task 1: Installer les dépendances nécessaires

**Files:**
- Modify: `package.json`

**Step 1: Installer les packages**

Run:
```bash
cd /Users/nicolasdolphens/Documents/projects/claude-config-generator
npm install jszip file-saver codemirror @codemirror/lang-json @codemirror/lang-markdown @codemirror/theme-one-dark @codemirror/lint @uiw/react-codemirror
npm install -D @types/file-saver vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Vérifier l'installation**

Run: `npm run build`
Expected: Build réussi sans erreurs

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add jszip, file-saver, codemirror"
```

---

### Task 2: Créer les types centralisés

**Files:**
- Create: `src/types/config.ts`

**Step 1: Créer le fichier de types**

```typescript
// src/types/config.ts

// === WIZARD STATE ===

export type BundleType = "safe" | "dev";
export type LanguageType = "fr" | "en" | "es";
export type ToneType = "cool" | "pro" | "pedagogue";
export type ResponseStyleType = "concise" | "detailed" | "technical";

// === HOOKS ===

export type HookEventType =
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "SessionStart";

export type HookActionType = "command" | "prompt";

export interface HookEntry {
  id: string;
  event: HookEventType;
  matcher?: string;
  action: HookActionType;
  command: string;
  description: string;
  enabled: boolean;
}

// === MCP SERVERS ===

export type McpTransportType = "stdio" | "http" | "sse";

export interface McpServer {
  id: string;
  name: string;
  description: string;
  transport: McpTransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
  popular?: boolean;
  icon?: string;
}

// === RULES ===

export interface RuleEntry {
  id: string;
  filename: string;
  title: string;
  description: string;
  paths?: string[];
  content: string;
  enabled: boolean;
  category: "code-style" | "testing" | "security" | "api" | "git" | "custom";
}

// === PERMISSIONS ===

export interface Permissions {
  allow: string[];
  deny: string[];
}

// === GENERATED FILES ===

export interface GeneratedFile {
  path: string;
  content: string;
  size: number;
}

// === FULL CONFIG STATE ===

export interface ClaudeConfig {
  // Step 1 - Bundle
  bundle: BundleType;

  // Step 2 - Personality
  language: LanguageType;
  tone: ToneType;

  // Step 3 - Permissions
  responseStyle: ResponseStyleType;
  permissions: Permissions;

  // Step 4 - Advanced toggle
  enableHooks: boolean;
  enableMCP: boolean;
  enableRules: boolean;

  // Step 5 - Hooks
  hooks: HookEntry[];

  // Step 6 - MCP
  mcpServers: McpServer[];

  // Step 7 - Rules
  rules: RuleEntry[];

  // CLAUDE.md
  claudeMdContent: string;
  claudeMdImported: boolean;

  // .claudeignore
  claudeIgnoreContent: string;
}

// === VAULT ===

export interface SavedConfig {
  id: string;
  name: string;
  config: ClaudeConfig;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  tags: string[];
}

// === TEMPLATES ===

export interface Template {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  category: string;
  uses: number;
  popular?: boolean;
  config: Partial<ClaudeConfig>;
}
```

**Step 2: Créer le barrel export**

Create: `src/types/index.ts`

```typescript
export * from "./config";
```

**Step 3: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add centralized TypeScript types for config"
```

---

### Task 3: Créer le ConfigContext (state management centralisé)

**Files:**
- Create: `src/context/ConfigContext.tsx`

**Step 1: Créer le context et provider**

```typescript
// src/context/ConfigContext.tsx
"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { ClaudeConfig, SavedConfig } from "@/types";
import { getDefaultConfig } from "@/lib/defaults";

type ConfigAction =
  | { type: "SET_FIELD"; field: keyof ClaudeConfig; value: ClaudeConfig[keyof ClaudeConfig] }
  | { type: "SET_CONFIG"; config: ClaudeConfig }
  | { type: "RESET" }
  | { type: "LOAD_TEMPLATE"; config: Partial<ClaudeConfig> }
  | { type: "IMPORT_CLAUDE_MD"; content: string };

interface ConfigContextType {
  config: ClaudeConfig;
  dispatch: React.Dispatch<ConfigAction>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

function configReducer(state: ClaudeConfig, action: ConfigAction): ClaudeConfig {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_CONFIG":
      return action.config;
    case "RESET":
      return getDefaultConfig();
    case "LOAD_TEMPLATE":
      return { ...state, ...action.config };
    case "IMPORT_CLAUDE_MD":
      return { ...state, claudeMdContent: action.content, claudeMdImported: true };
    default:
      return state;
  }
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(configReducer, getDefaultConfig());
  return (
    <ConfigContext.Provider value={{ config, dispatch }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
```

**Step 2: Créer les valeurs par défaut**

Create: `src/lib/defaults.ts`

```typescript
// src/lib/defaults.ts
import type { ClaudeConfig, HookEntry, McpServer, RuleEntry } from "@/types";

export const DEFAULT_HOOKS: HookEntry[] = [
  {
    id: "hook-lint-on-save",
    event: "PostToolUse",
    matcher: "Write|Edit",
    action: "command",
    command: "npx eslint --fix $CLAUDE_TOOL_INPUT_FILE_PATH",
    description: "Auto-lint après modification de fichier",
    enabled: false,
  },
  {
    id: "hook-format-on-save",
    event: "PostToolUse",
    matcher: "Write|Edit",
    action: "command",
    command: "npx prettier --write $CLAUDE_TOOL_INPUT_FILE_PATH",
    description: "Auto-format après modification",
    enabled: false,
  },
  {
    id: "hook-validate-bash",
    event: "PreToolUse",
    matcher: "Bash",
    action: "command",
    command: ".claude/hooks/validate-bash.sh",
    description: "Valider les commandes Bash avant exécution",
    enabled: false,
  },
  {
    id: "hook-test-before-stop",
    event: "Stop",
    action: "command",
    command: "npm test",
    description: "Lancer les tests avant de terminer",
    enabled: false,
  },
  {
    id: "hook-context-on-start",
    event: "SessionStart",
    matcher: "startup",
    action: "command",
    command: ".claude/hooks/load-context.sh",
    description: "Charger le contexte au démarrage",
    enabled: false,
  },
];

export const DEFAULT_MCP_SERVERS: McpServer[] = [
  {
    id: "mcp-github",
    name: "GitHub",
    description: "Gestion de repos, PRs, issues",
    transport: "http",
    url: "https://api.githubcopilot.com/mcp/",
    enabled: false,
    popular: true,
    icon: "🐙",
  },
  {
    id: "mcp-filesystem",
    name: "Filesystem",
    description: "Accès au système de fichiers local",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
    enabled: false,
    popular: true,
    icon: "📁",
  },
  {
    id: "mcp-postgres",
    name: "PostgreSQL",
    description: "Requêtes et exploration de BDD PostgreSQL",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@bytebase/dbhub", "--dsn", "postgresql://user:pass@localhost:5432/db"],
    enabled: false,
    popular: true,
    icon: "🐘",
  },
  {
    id: "mcp-sentry",
    name: "Sentry",
    description: "Monitoring d'erreurs et debugging",
    transport: "http",
    url: "https://mcp.sentry.dev/mcp",
    enabled: false,
    popular: true,
    icon: "🔍",
  },
  {
    id: "mcp-notion",
    name: "Notion",
    description: "Accès aux pages et bases Notion",
    transport: "http",
    url: "https://mcp.notion.com/mcp",
    enabled: false,
    popular: false,
    icon: "📝",
  },
  {
    id: "mcp-slack",
    name: "Slack",
    description: "Lecture et envoi de messages Slack",
    transport: "http",
    url: "https://mcp.slack.com/mcp",
    enabled: false,
    popular: false,
    icon: "💬",
  },
  {
    id: "mcp-memory",
    name: "Memory",
    description: "Mémoire persistante pour Claude",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    enabled: false,
    popular: false,
    icon: "🧠",
  },
  {
    id: "mcp-brave-search",
    name: "Brave Search",
    description: "Recherche web via Brave",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@anthropic/mcp-server-brave-search"],
    env: { BRAVE_API_KEY: "" },
    enabled: false,
    popular: false,
    icon: "🌐",
  },
];

export const DEFAULT_RULES: RuleEntry[] = [
  {
    id: "rule-code-style",
    filename: "code-style.md",
    title: "Conventions de code",
    description: "Indentation, nommage, structure de fichiers",
    paths: ["**/*.{ts,tsx,js,jsx}"],
    content: `# Conventions de code

- Utiliser 2 espaces pour l'indentation
- Préférer const à let, jamais var
- Noms de variables en camelCase, composants en PascalCase
- Un composant par fichier
- Imports organisés: libs externes, puis internes, puis styles`,
    enabled: false,
    category: "code-style",
  },
  {
    id: "rule-testing",
    filename: "testing.md",
    title: "Conventions de tests",
    description: "Structure des tests, nommage, couverture",
    paths: ["**/*.test.*", "**/*.spec.*"],
    content: `# Conventions de tests

- Utiliser describe/it pour structurer les tests
- Nommer les tests: "should [expected behavior] when [condition]"
- Un fichier de test par module/composant
- Tester les cas limites et erreurs, pas seulement le happy path
- Préférer des assertions spécifiques à toEqual générique`,
    enabled: false,
    category: "testing",
  },
  {
    id: "rule-security",
    filename: "security.md",
    title: "Règles de sécurité",
    description: "Validation des entrées, gestion des secrets",
    content: `# Règles de sécurité

- Ne jamais commit de secrets, clés API ou tokens
- Valider toutes les entrées utilisateur côté serveur
- Utiliser des requêtes paramétrées pour les BDD
- Sanitiser les outputs HTML pour éviter le XSS
- Utiliser HTTPS pour toutes les communications externes`,
    enabled: false,
    category: "security",
  },
  {
    id: "rule-api-design",
    filename: "api-design.md",
    title: "Design d'API",
    description: "Conventions REST, gestion d'erreurs, validation",
    paths: ["src/api/**/*.ts", "src/routes/**/*.ts"],
    content: `# Design d'API

- Utiliser les verbes HTTP correctement: GET lecture, POST création, PUT mise à jour, DELETE suppression
- Réponses d'erreur standardisées: { error: { code, message, details? } }
- Valider les entrées avec un schéma (Zod, Joi)
- Documenter chaque endpoint avec des commentaires JSDoc
- Paginer les listes: ?page=1&limit=20`,
    enabled: false,
    category: "api",
  },
  {
    id: "rule-git",
    filename: "git-workflow.md",
    title: "Workflow Git",
    description: "Conventions de commits, branches, PRs",
    content: `# Workflow Git

- Commits conventionnels: feat:, fix:, refactor:, docs:, test:, chore:
- Branches: feature/, fix/, refactor/ préfixées
- PRs avec description claire, lien vers l'issue
- Rebase sur main avant merge
- Squash les commits de WIP avant merge`,
    enabled: false,
    category: "git",
  },
];

export function getDefaultConfig(): ClaudeConfig {
  return {
    bundle: "safe",
    language: "fr",
    tone: "pro",
    responseStyle: "concise",
    permissions: {
      allow: [],
      deny: ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"],
    },
    enableHooks: false,
    enableMCP: false,
    enableRules: false,
    hooks: DEFAULT_HOOKS,
    mcpServers: DEFAULT_MCP_SERVERS,
    rules: DEFAULT_RULES,
    claudeMdContent: "",
    claudeMdImported: false,
    claudeIgnoreContent: "",
  };
}
```

**Step 3: Intégrer le Provider dans le layout**

Modify: `src/app/layout.tsx`

Ajouter l'import et wrapper le children avec `<ConfigProvider>`:

```typescript
import { ConfigProvider } from "@/context/ConfigContext";

// Dans le return, wrapper {children} :
<ConfigProvider>{children}</ConfigProvider>
```

**Step 4: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/context/ src/lib/defaults.ts src/app/layout.tsx
git commit -m "feat: add ConfigContext with centralized state management"
```

---

### Task 4: Créer le moteur de génération de fichiers

**Files:**
- Create: `src/lib/generator.ts`

**Step 1: Implémenter le générateur**

```typescript
// src/lib/generator.ts
import type { ClaudeConfig, GeneratedFile, HookEntry, McpServer, RuleEntry } from "@/types";

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
```

**Step 2: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/generator.ts
git commit -m "feat: add config file generation engine"
```

---

### Task 5: Créer l'utilitaire de téléchargement ZIP

**Files:**
- Create: `src/lib/download.ts`

**Step 1: Implémenter l'export ZIP**

```typescript
// src/lib/download.ts
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { GeneratedFile } from "@/types";

export async function downloadAsZip(files: GeneratedFile[], zipName = "claude-config"): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${zipName}.zip`);
}

export function downloadSingleFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, file.path.split("/").pop() || file.path);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
```

**Step 2: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/download.ts
git commit -m "feat: add ZIP download and file export utilities"
```

---

### Task 6: Créer le service localStorage pour le Vault

**Files:**
- Create: `src/lib/storage.ts`

**Step 1: Implémenter le storage service**

```typescript
// src/lib/storage.ts
import type { SavedConfig, ClaudeConfig } from "@/types";

const VAULT_KEY = "claude-config-vault";

export function loadVault(): SavedConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToVault(name: string, config: ClaudeConfig, tags: string[] = []): SavedConfig {
  const vault = loadVault();
  const entry: SavedConfig = {
    id: crypto.randomUUID(),
    name,
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    starred: false,
    tags,
  };
  vault.unshift(entry);
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  return entry;
}

export function updateVaultEntry(id: string, updates: Partial<SavedConfig>): void {
  const vault = loadVault();
  const idx = vault.findIndex((c) => c.id === id);
  if (idx === -1) return;
  vault[idx] = { ...vault[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

export function deleteVaultEntry(id: string): void {
  const vault = loadVault().filter((c) => c.id !== id);
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

export function toggleStar(id: string): void {
  const vault = loadVault();
  const idx = vault.findIndex((c) => c.id === id);
  if (idx === -1) return;
  vault[idx].starred = !vault[idx].starred;
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}
```

**Step 2: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat: add localStorage vault service"
```

---

### Task 6b: Créer un système de toasts/notifications

**Files:**
- Create: `src/components/Toast.tsx`
- Create: `src/context/ToastContext.tsx`

**Contexte:** L'app a besoin de feedback visuel pour les actions utilisateur : ZIP téléchargé, config sauvée dans le Vault, fichier importé via drag & drop, erreur de parsing, etc. Sans ça l'app paraît "morte".

**Step 1: Créer le ToastContext**

```typescript
// src/context/ToastContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container fixé en bas à droite */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-right ${
              toast.type === "success" ? "bg-teal-600 text-white" :
              toast.type === "error" ? "bg-red-600 text-white" :
              "bg-gray-800 text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
```

**Step 2: Intégrer le Provider dans layout.tsx**

Wrapper children avec `<ToastProvider>` (en plus du ConfigProvider).

**Step 3: Utilisation**

Partout où on a une action :
- `downloadAsZip(...)` → `addToast("Configuration téléchargée !")`
- `saveToVault(...)` → `addToast("Sauvegardé dans le Vault")`
- Drag & drop CLAUDE.md → `addToast("CLAUDE.md importé")`
- Erreur de parsing JSON → `addToast("Erreur de format JSON", "error")`

**Step 4: Commit**

```bash
git add src/components/Toast.tsx src/context/ToastContext.tsx src/app/layout.tsx
git commit -m "feat: add toast notification system"
```

---

## Batch 2 — Wizard Steps 1-4 (Refactor avec ConfigContext)

### Task 7: Refactorer le Wizard pour utiliser ConfigContext

**Files:**
- Modify: `src/app/wizard/page.tsx`

**Contexte:** Le wizard actuel utilise un state local avec useState. On doit le refactorer pour utiliser le ConfigContext tout en gardant le state de navigation (currentStep, advancedStep, showAdvanced) en local.

**Step 1: Refactorer les imports et le state**

Remplacer les useState locaux pour les données de config par `useConfig()`. Garder les useState de navigation.

Les changements principaux :
- Importer `useConfig` depuis `@/context/ConfigContext`
- Remplacer `state`/`setState` par `config`/`dispatch`
- Garder `currentStep`, `advancedStep`, `showAdvanced` en useState local
- Remplacer `state.bundle` par `config.bundle`, etc.
- Remplacer `setState({...state, bundle: "safe"})` par `dispatch({ type: "SET_FIELD", field: "bundle", value: "safe" })`

**Step 2: Mettre à jour renderStepContent pour chaque étape**

Pour les étapes 1-4, remplacer les références à `state.xxx` par `config.xxx` et les `setState(...)` par `dispatch(...)`.

**Step 2b: Ajouter le champ custom permissions à l'étape 3**

Après les presets liés au bundle, ajouter une section "Règles personnalisées" avec :
- Un input text pour les règles `allow` (placeholder: `Bash(npm run *)`)
- Un input text pour les règles `deny` (placeholder: `Read(./.env)`)
- Un bouton "+" pour ajouter chaque règle à la liste
- Affichage des règles ajoutées en tags supprimables

**Step 2c: Implémenter la navigation dynamique des étapes avancées**

Au lieu d'un `advancedStep` qui va de 0 à 3 fixe, calculer les étapes avancées visibles dynamiquement :
```typescript
const advancedSteps = [
  ...(config.enableHooks ? [{ key: "hooks", label: "Hooks" }] : []),
  ...(config.enableMCP ? [{ key: "mcp", label: "MCP" }] : []),
  ...(config.enableRules ? [{ key: "rules", label: "Rules" }] : []),
  { key: "recap", label: "Finaliser" }, // toujours présent
];
```
Le WizardProgress et la navigation Back/Continue utilisent ce tableau dynamique.

**Step 2d: Reset au mount**

Ajouter un `useEffect` au mount du wizard qui dispatch `RESET` pour garantir un état propre :
```typescript
useEffect(() => { dispatch({ type: "RESET" }); }, []);
```

**Step 3: Mettre à jour le Preview Panel**

Le preview doit maintenant refléter le vrai contenu généré. Importer `generateClaudeMd`, `generateSettingsJson` depuis `@/lib/generator` et afficher le vrai contenu dans le preview.

**Step 4: Vérifier le build et tester manuellement**

Run: `npm run build && npm run dev`
- Naviguer dans les étapes 1-4
- Vérifier que les choix sont persistés entre les étapes
- Vérifier que le preview se met à jour

**Step 5: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "refactor: wizard uses ConfigContext for state management"
```

---

### Task 8: Implémenter le Preview Panel dynamique avec tabs

**Files:**
- Modify: `src/components/PreviewPanel.tsx` → refonte complète en `TabbedPreviewPanel`
- Create: `src/components/FilePreview.tsx`

**Contexte:** Le preview panel doit afficher des onglets de fichiers avec le fichier contextuel auto-sélectionné selon l'étape. En haut : métriques (nombre de fichiers, nombre de rules, taille totale). En dessous : tabs de fichiers. Le contenu se met à jour en temps réel quand l'utilisateur change des options dans le wizard.

Le composant reçoit :
- `files: GeneratedFile[]` — les fichiers générés par `generateAllFiles(config)`
- `activeFile?: string` — le fichier à sélectionner par défaut (contextuel selon l'étape)
- `metrics: { label: string; value: string; highlight?: boolean }[]`

**Step 1: Créer le composant FilePreview**

```typescript
// src/components/FilePreview.tsx
"use client";

interface FilePreviewProps {
  filename: string;
  content: string;
  maxLines?: number;
}

export default function FilePreview({ filename, content, maxLines = 15 }: FilePreviewProps) {
  const lines = content.split("\n").slice(0, maxLines);
  const hasMore = content.split("\n").length > maxLines;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
        <span className="text-xs font-mono font-medium text-gray-600">{filename}</span>
      </div>
      <div className="p-3 bg-white overflow-x-auto">
        <pre className="text-xs font-mono leading-5">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-400 select-none w-6 text-right mr-3 shrink-0">{i + 1}</span>
              <span className="text-gray-800">{line}</span>
            </div>
          ))}
          {hasMore && (
            <div className="text-gray-400 text-center mt-1">...</div>
          )}
        </pre>
      </div>
    </div>
  );
}
```

**Step 2: Exporter le composant**

Ajouter `FilePreview` dans `src/components/index.ts`.

**Step 3: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/FilePreview.tsx src/components/index.ts
git commit -m "feat: add FilePreview component with line numbers"
```

---

## Batch 3 — Wizard Steps 5-7 (Hooks, MCP, Rules)

### Task 9: Implémenter l'étape 5 — Hooks

**Files:**
- Modify: `src/app/wizard/page.tsx` (section renderAdvancedStep, case 0)

**Step 1: Remplacer le placeholder de l'étape Hooks**

L'étape doit afficher :
- **Section 1 "Quand veux-tu être notifié ?"** — Liste des HookEntry depuis `config.hooks` groupés par event, avec un toggle (checkbox) pour activer/désactiver chacun
- **Section 2 "Actions automatiques"** — Même liste mais sous forme de cards avec description, toggle enabled, et le champ command visible quand activé
- Le preview panel affiche le JSON `hooks` en temps réel

Pour chaque hook dans `config.hooks`, afficher une checkbox avec `hook.description`, et dispatch `SET_FIELD` avec la liste mise à jour quand on toggle.

**Step 2: Mettre à jour le preview**

Quand des hooks sont activés, le preview montre l'extrait `settings.json` avec le bloc `hooks`.

**Step 3: Tester manuellement**

Run: `npm run dev`
- Cocher/décocher les hooks
- Vérifier que le preview se met à jour en temps réel
- Naviguer avant/arrière et vérifier la persistance

**Step 4: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "feat: implement hooks configuration wizard step"
```

---

### Task 10: Implémenter l'étape 6 — MCP Servers

**Files:**
- Modify: `src/app/wizard/page.tsx` (section renderAdvancedStep, case 1)

**Step 1: Remplacer le placeholder de l'étape MCP**

L'étape doit afficher :
- **Section 1 "Serveurs populaires"** — Grid de cards pour les MCP servers avec `popular: true`, chacun avec un toggle pour activer/désactiver
- **Section 2 "Autres serveurs"** — Liste des serveurs non-populaires avec toggle
- Chaque card affiche : icon, name, description, transport type badge, toggle

Pour chaque server dans `config.mcpServers`, checkbox pour toggle `enabled`, et dispatch `SET_FIELD` avec la liste mise à jour.

**Step 2: Mettre à jour le preview**

Le preview montre `.mcp.json` généré en temps réel.

**Step 3: Tester manuellement**

Run: `npm run dev`
- Activer/désactiver des serveurs
- Vérifier le JSON dans le preview

**Step 4: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "feat: implement MCP servers configuration wizard step"
```

---

### Task 11: Implémenter l'étape 7 — Rules modulaires

**Files:**
- Modify: `src/app/wizard/page.tsx` (section renderAdvancedStep, case 2)

**Step 1: Remplacer le placeholder de l'étape Rules**

L'étape doit afficher :
- **Section "Templates de règles"** — Liste des RuleEntry depuis `config.rules` avec :
  - Toggle enabled
  - Titre + description
  - Badge category
  - Paths ciblés affichés en tag
  - Aperçu du contenu markdown quand activé (collapsible)

Pour chaque rule dans `config.rules`, checkbox toggle + dispatch `SET_FIELD`.

**Step 2: Mettre à jour le preview**

Le preview montre la structure `.claude/rules/` avec les fichiers activés et un aperçu du contenu.

**Step 3: Tester manuellement**

Run: `npm run dev`
- Activer/désactiver des rules
- Vérifier l'aperçu dans le preview

**Step 4: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "feat: implement rules configuration wizard step"
```

---

### Task 12: Implémenter l'étape 8 — Récap Final + Download ZIP

**Files:**
- Modify: `src/app/wizard/page.tsx` (section renderAdvancedStep, case 3 et boutons finaux)

**Step 1: Implémenter le récap final**

L'étape affiche :
- **Résumé des choix** — Liste des paramètres sélectionnés (bundle, langue, ton, etc.)
- **Fichiers générés** — Liste avec icône, nom du fichier, taille, et bouton pour preview individuel
- **Bouton "Télécharger"** — Lance `downloadAsZip(generateAllFiles(config))`
- **Bouton "Sauver dans Vault"** — Ouvre un prompt pour le nom, puis `saveToVault(name, config)`

**Step 2: Remplacer les alert() existants**

Lignes 539 et 542 du wizard actuel : remplacer `alert("Téléchargement...")` par les vrais appels `downloadAsZip`.

**Step 3: Tester le download**

Run: `npm run dev`
- Compléter le wizard
- Cliquer Télécharger → un ZIP est téléchargé
- Vérifier le contenu du ZIP (CLAUDE.md, settings.json, .claudeignore, etc.)

**Step 4: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "feat: implement recap step with ZIP download and vault save"
```

---

## Batch 4 — CLAUDE.md Drag & Drop + Expert Mode

### Task 13: Créer le composant Drag & Drop pour CLAUDE.md

**Files:**
- Create: `src/components/FileDropZone.tsx`

**Step 1: Implémenter le composant**

```typescript
// src/components/FileDropZone.tsx
"use client";

import { useState, useCallback, DragEvent } from "react";

interface FileDropZoneProps {
  onFileLoaded: (content: string) => void;
  currentContent: string;
  accept?: string;
}

export default function FileDropZone({ onFileLoaded, currentContent, accept = ".md" }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver
          ? "border-teal-500 bg-teal-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      {currentContent ? (
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-800 mb-1">Fichier importé</p>
          <p className="text-xs text-gray-500 mb-3">
            {currentContent.split("\n").length} lignes · Glissez un nouveau fichier pour remplacer
          </p>
          <pre className="text-left text-xs font-mono bg-gray-50 p-3 rounded max-h-32 overflow-auto">
            {currentContent.slice(0, 500)}{currentContent.length > 500 ? "\n..." : ""}
          </pre>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Glissez votre CLAUDE.md ici ou{" "}
            <label className="text-teal-600 cursor-pointer hover:underline">
              parcourez vos fichiers
              <input
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-gray-400">
            Accepte les fichiers {accept}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Exporter le composant**

Ajouter dans `src/components/index.ts`.

**Step 3: Intégrer dans le wizard étape 2 (Personnalité)**

Après la section langue/ton dans l'étape 2, ajouter une section "CLAUDE.md" avec :
- Le squelette auto-généré (lecture seule, preview)
- Le FileDropZone en dessous
- Un message expliquant que le drag & drop écrase le contenu généré

**Step 4: Vérifier**

Run: `npm run dev`
- Tester le drag & drop d'un fichier .md
- Vérifier que le contenu est importé et visible dans le preview

**Step 5: Commit**

```bash
git add src/components/FileDropZone.tsx src/components/index.ts src/app/wizard/page.tsx
git commit -m "feat: add CLAUDE.md drag & drop import component"
```

---

### Task 14: Refondre l'Expert Mode avec CodeMirror

**Files:**
- Modify: `src/app/expert/page.tsx`
- Create: `src/components/CodeEditor.tsx`

**ATTENTION SSR:** CodeMirror ne fonctionne pas côté serveur. Le composant CodeEditor doit être importé dynamiquement dans expert/page.tsx :
```typescript
import dynamic from "next/dynamic";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });
```

**Step 1: Créer le wrapper CodeMirror**

```typescript
// src/components/CodeEditor.tsx
"use client";

import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "json" | "markdown" | "text";
  height?: string;
}

const languageExtensions = {
  json: [json()],
  markdown: [markdown()],
  text: [],
};

const theme = EditorView.theme({
  "&": {
    fontSize: "13px",
    fontFamily: "var(--font-jetbrains), monospace",
  },
  ".cm-content": {
    padding: "12px 0",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "#fafafa",
    borderRight: "1px solid #e5e7eb",
    color: "#9ca3af",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#f0f0f0",
  },
  ".cm-activeLine": {
    backgroundColor: "#f8f9fa",
  },
});

export default function CodeEditor({ value, onChange, language, height = "100%" }: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      extensions={[...languageExtensions[language], theme, EditorView.lineWrapping]}
      onChange={handleChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: false,
      }}
    />
  );
}
```

**Step 2: Refondre expert/page.tsx**

Remplacer les spans statiques par le CodeEditor. L'Expert Mode doit :
- Lire le state depuis ConfigContext
- Afficher 3 onglets (CLAUDE.md, settings.json, .claudeignore) + onglets conditionnels (.mcp.json, rules)
- Chaque onglet est un CodeEditor avec le contenu généré
- Les modifications dans l'éditeur mettent à jour le ConfigContext
- Panel de documentation à droite avec liens vers docs.anthropic.com
- Boutons "Télécharger" et "Sauver dans Vault"

**Step 3: Ajouter les onglets dynamiques**

Si `enableMCP` est true, afficher l'onglet `.mcp.json`.
Si `enableRules` est true, afficher un onglet par fichier de rules activé.

**Step 4: Vérifier**

Run: `npm run dev`
- Aller dans /expert
- Modifier du contenu dans l'éditeur
- Vérifier la coloration syntaxique
- Tester les onglets

**Step 5: Commit**

```bash
git add src/components/CodeEditor.tsx src/app/expert/page.tsx src/components/index.ts
git commit -m "feat: implement CodeMirror editor for Expert Mode"
```

---

## Batch 5 — Template Library + Vault fonctionnels

### Task 15: Créer les données de templates

**Files:**
- Create: `src/data/templates.ts`

**Step 1: Implémenter les templates**

Créer 8-10 templates prédéfinis avec des configs réalistes :

```typescript
// src/data/templates.ts
import type { Template } from "@/types";

export const TEMPLATES: Template[] = [
  {
    id: "tpl-nodejs-backend",
    icon: "⬢",
    iconBg: "#F0FFF0",
    iconColor: "#16a34a",
    title: "Node.js Backend",
    description: "Configuration pour projets Node.js avec Express/Fastify, ESLint, Prettier.",
    category: "Backend",
    uses: 2400,
    popular: true,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "concise",
      permissions: {
        allow: ["Bash(npm run *)", "Bash(npx *)", "Bash(node *)"],
        deny: ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"],
      },
      enableHooks: true,
      enableRules: true,
      claudeIgnoreContent: "node_modules/\ndist/\n.env\n.env.*\ncoverage/\n*.log",
    },
  },
  {
    id: "tpl-react-frontend",
    icon: "⚛",
    iconBg: "#F0F8FF",
    iconColor: "#3b82f6",
    title: "React Frontend",
    description: "Setup React/Vite avec TailwindCSS, composants, tests unitaires.",
    category: "Frontend",
    uses: 1800,
    popular: true,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "detailed",
      permissions: {
        allow: ["Bash(npm run *)", "Bash(npx *)"],
        deny: ["Read(./.env)", "Read(./.env.*)"],
      },
      enableRules: true,
      claudeIgnoreContent: "node_modules/\ndist/\n.env\ncoverage/\nstorybook-static/",
    },
  },
  {
    id: "tpl-python-fastapi",
    icon: "🐍",
    iconBg: "#FFFFF0",
    iconColor: "#ca8a04",
    title: "Python FastAPI",
    description: "Projet Python avec FastAPI, SQLAlchemy, tests pytest.",
    category: "Backend",
    uses: 1200,
    popular: true,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "technical",
      permissions: {
        allow: ["Bash(python *)", "Bash(pip *)", "Bash(pytest *)"],
        deny: ["Read(./.env)", "Read(./secrets/**)"],
      },
      claudeIgnoreContent: "__pycache__/\n*.pyc\n.venv/\nvenv/\n.env\n*.egg-info/\ndist/",
    },
  },
  {
    id: "tpl-docker-compose",
    icon: "🐳",
    iconBg: "#F0F8FF",
    iconColor: "#0ea5e9",
    title: "Docker Compose",
    description: "Multi-conteneur Docker avec Compose, gestion d'infra locale.",
    category: "DevOps",
    uses: 956,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "technical",
      permissions: {
        allow: ["Bash(docker *)", "Bash(docker-compose *)"],
        deny: ["Read(./.env)", "Read(./secrets/**)"],
      },
      claudeIgnoreContent: ".env\nsecrets/\n*.pem\n*.key\nvolumes/",
    },
  },
  {
    id: "tpl-nextjs-fullstack",
    icon: "▲",
    iconBg: "#F5F5F5",
    iconColor: "#000000",
    title: "Next.js Full-Stack",
    description: "App Next.js avec API routes, Prisma, auth, et déploiement Vercel.",
    category: "Full-Stack",
    uses: 1500,
    popular: true,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "concise",
      permissions: {
        allow: ["Bash(npm run *)", "Bash(npx prisma *)"],
        deny: ["Read(./.env)", "Read(./.env.*)", "Read(./prisma/migrations/**)"],
      },
      enableHooks: true,
      enableRules: true,
      claudeIgnoreContent: "node_modules/\n.next/\n.env\n.env.*\nprisma/migrations/\ncoverage/",
    },
  },
  {
    id: "tpl-aws-lambda",
    icon: "λ",
    iconBg: "#FFF5F0",
    iconColor: "#ea580c",
    title: "AWS Lambda",
    description: "Fonctions serverless AWS avec SAM/CDK, DynamoDB, API Gateway.",
    category: "Cloud",
    uses: 780,
    config: {
      bundle: "safe",
      language: "en",
      tone: "pro",
      responseStyle: "technical",
      permissions: {
        allow: ["Bash(sam *)", "Bash(aws *)"],
        deny: ["Read(./.env)", "Read(./secrets/**)", "Read(./.aws/*)"],
      },
      claudeIgnoreContent: ".aws-sam/\nnode_modules/\n.env\n*.zip\ncdk.out/",
    },
  },
  {
    id: "tpl-security-hardened",
    icon: "🔒",
    iconBg: "#FFF0F0",
    iconColor: "#dc2626",
    title: "Security Hardened",
    description: "Configuration restrictive avec audit trail, pas de commandes destructrices.",
    category: "Security",
    uses: 540,
    config: {
      bundle: "safe",
      language: "en",
      tone: "pro",
      responseStyle: "technical",
      permissions: {
        allow: [],
        deny: [
          "Read(./.env)",
          "Read(./.env.*)",
          "Read(./secrets/**)",
          "Read(./*.pem)",
          "Read(./*.key)",
          "Bash(rm -rf *)",
          "Bash(git push --force *)",
          "Bash(curl *)",
          "Bash(wget *)",
        ],
      },
      enableRules: true,
      claudeIgnoreContent: ".env\n.env.*\nsecrets/\n*.pem\n*.key\n*.p12\n*.pfx\ncredentials.*",
    },
  },
  {
    id: "tpl-monorepo-turborepo",
    icon: "🏗",
    iconBg: "#F5F0FF",
    iconColor: "#7c3aed",
    title: "Monorepo (Turborepo)",
    description: "Monorepo avec Turborepo, packages partagés, CI/CD.",
    category: "Architecture",
    uses: 650,
    config: {
      bundle: "dev",
      language: "en",
      tone: "pro",
      responseStyle: "detailed",
      permissions: {
        allow: ["Bash(turbo *)", "Bash(pnpm *)", "Bash(npm run *)"],
        deny: ["Read(./.env)", "Read(./.env.*)"],
      },
      claudeIgnoreContent: "node_modules/\n**/dist/\n**/build/\n.turbo/\n.env\ncoverage/",
    },
  },
];
```

**Step 2: Vérifier le build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/templates.ts
git commit -m "feat: add template data with 8 pre-configured setups"
```

---

### Task 16: Rendre la Library fonctionnelle

**Files:**
- Modify: `src/app/library/page.tsx`

**Step 1: Connecter les templates réels**

Remplacer les templates hardcodés par l'import de `TEMPLATES` depuis `src/data/templates.ts`.

**Step 2: Implémenter le filtrage par catégorie**

Le dropdown catégorie doit maintenant filtrer les templates. Extraire les catégories uniques des templates pour peupler le dropdown.

**Step 3: Implémenter le bouton "Use"**

Quand l'utilisateur clique "Use" :
1. Charger la config du template dans le ConfigContext via `dispatch({ type: "LOAD_TEMPLATE", config: template.config })`
2. Rediriger vers `/expert` (toujours — flux one-way, l'Expert est le point d'entrée pour les configs pré-remplies)

Utiliser `useRouter()` de `next/navigation` pour la redirection.

**Step 4: Tester**

Run: `npm run dev`
- Filtrer par catégorie
- Chercher par texte
- Cliquer "Use" → vérifié redirection + config chargée

**Step 5: Commit**

```bash
git add src/app/library/page.tsx
git commit -m "feat: functional template library with filtering and use action"
```

---

### Task 17: Rendre le Vault fonctionnel

**Files:**
- Modify: `src/app/vault/page.tsx`

**Step 1: Connecter au localStorage**

Importer les fonctions de `src/lib/storage.ts`. Utiliser `useState` + `useEffect` pour charger les configs sauvegardées au mount.

**Step 2: Implémenter les interactions**

- **Star toggle** : cliquer sur l'étoile appelle `toggleStar(id)` et rafraîchit la liste
- **Export** : cliquer "Export" télécharge le ZIP de la config sauvegardée via `downloadAsZip(generateAllFiles(config))`
- **Restore** : cliquer "Restore" charge la config dans le ConfigContext et redirige vers `/expert` (toujours — cohérent avec le flux one-way)
- **Delete** : cliquer "Supprimer" appelle `deleteVaultEntry(id)` avec confirmation

**Step 3: Calculer les vraies stats**

Remplacer les stats hardcodées par des calculs réels :
- "Saved Configs" = `vault.length`
- "Total Exports" = compteur dans localStorage (incrémenter à chaque export)
- "Starred" = `vault.filter(c => c.starred).length`
- "Success Rate" = peut être retiré ou remplacé par une autre métrique utile

**Step 4: Implémenter le tri**

Le dropdown "Sort by: Date" doit trier par `updatedAt` desc (défaut) ou par nom alpha.

**Step 5: Tester**

Run: `npm run dev`
- Sauver une config depuis le wizard
- Aller dans /vault
- Vérifier qu'elle apparaît
- Tester star, export, restore, delete

**Step 6: Commit**

```bash
git add src/app/vault/page.tsx
git commit -m "feat: functional vault with localStorage persistence"
```

---

## Batch 6 — Navigation, Polish, et Sidebar

### Task 18: Ajouter la page Expert dans la Sidebar

**Files:**
- Modify: `src/components/Sidebar.tsx`

**Step 1: Ajouter le lien Expert**

Le design .pen montre que la sidebar a un lien "Expert" en plus de Home/Wizard/Library/Vault. Ajouter l'entrée dans la liste `navItems` :

```typescript
{ name: "Expert", href: "/expert", icon: "⚡" }
```

L'ordre dans la sidebar (basé sur les maquettes) : Home, Wizard, Expert, Library, Vault.

**Step 2: Vérifier le build et tester**

Run: `npm run dev`
- Vérifier que le lien Expert apparaît dans la sidebar
- Vérifier le active state

**Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Expert Mode link to sidebar navigation"
```

---

### Task 19: Connecter la Home aux flux

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Rendre les FeatureCards navigantes**

- "Start Wizard →" redirige vers `/wizard`
- "Open Editor" redirige vers `/expert`
- "Browse Templates" redirige vers `/library`
- Le mode "Manuel" désactive le Wizard card et met en avant Expert

**Step 2: Ajouter le lien vers Vault**

Ajouter un accès rapide au Vault depuis la page d'accueil si des configs sauvegardées existent.

**Step 3: Tester**

Run: `npm run dev`
- Vérifier navigation depuis la home vers chaque section

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: connect home page navigation to all sections"
```

---

### Task 20: Flux complet Wizard → Expert

**Files:**
- Modify: `src/app/wizard/page.tsx`

**Step 1: Ajouter le lien vers Expert depuis le récap**

Après le récap final (étape 8), ajouter un bouton "Affiner dans l'Expert Mode →" qui redirige vers `/expert` avec la config chargée.

**Step 2: Wizard → Expert flow**

Puisque les deux pages partagent le ConfigContext, naviguer de l'une à l'autre conserve l'état. Vérifier ce comportement.

**Step 3: Tester le flux complet**

1. `/` → Choisir "Guidé" → `/wizard`
2. Compléter étapes 1-4 → Affiner → Étapes 5-8
3. Récap → "Affiner dans Expert" → `/expert`
4. Modifier dans l'éditeur → Télécharger
5. Ou "Sauver dans Vault" → `/vault`
6. Vault → "Restore" → `/wizard`

**Step 4: Commit**

```bash
git add src/app/wizard/page.tsx
git commit -m "feat: add wizard-to-expert navigation flow"
```

---

## Batch 7 — Alignement Design .pen

### Task 21: Audit et alignement visuel avec les maquettes

**Files:**
- Potentiellement tous les fichiers de composants et pages

**Step 1: Comparer chaque page avec son équivalent .pen**

Utiliser les screenshots du .pen comme référence. Pour chaque page, vérifier :
- Spacing (padding, gap, margins)
- Typography (font-family, size, weight, color)
- Colors (backgrounds, borders, accents)
- Layout (proportions colonnes, alignements)

Les maquettes .pen de référence :
- `FEh7g` — Landing (Manuel sélectionné)
- `2fOg0` — Landing (Guidé sélectionné)
- `YmHmQ` — Étape 1 (Bundle)
- `QLjOB` — Étape 2 (Personnalité)
- `ewWp6` — Étape 3 (Permissions)
- `wyodK` — Étape 4 (Affiner)
- `chde8` — Étape 5 (Hooks)
- `jkaSI` — Étape 6 (MCP)
- `I2U7N` — Étape 7 (Rules)
- `nVT72` — Étape 8 (Récap)
- `eg3Zi` — Expert Mode
- `KffXZ` — Library
- `cV176` — Vault

**Step 2: Corriger les écarts**

Ajuster les styles Tailwind pour matcher les maquettes au pixel.

**Step 3: Commit**

```bash
git add .
git commit -m "style: align UI with .pen design mockups"
```

---

### Task 22: Responsive et polish final

**Files:**
- Modify: `src/app/globals.css`
- Modify: composants au besoin

**Step 1: Vérifier le responsive**

Le design est desktop-first (1440px). Ajouter des breakpoints Tailwind pour :
- Tablette (768px) : sidebar collapse, grid 2 colonnes
- Mobile (640px) : navigation bottom, grid 1 colonne, panels empilés

**Step 2: Animations et transitions**

Ajouter des transitions CSS douces pour :
- Changement d'étape du wizard (fade)
- Toggle des options (slide)
- Hover states cohérents

**Step 3: États vides**

Ajouter des empty states pour :
- Vault vide : "Aucune configuration sauvegardée. Lancez le Wizard pour commencer."
- Library sans résultats : "Aucun template ne correspond à votre recherche."

**Step 4: Tester et commit**

Run: `npm run build && npm run dev`

```bash
git add .
git commit -m "style: responsive design, animations, and empty states"
```

---

## Batch 8 — Tests minimaux

### Task 23: Setup Vitest et tests du generator

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/generator.test.ts`

**Step 1: Configurer Vitest**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Ajouter dans `package.json` scripts : `"test": "vitest run", "test:watch": "vitest"`

**Step 2: Écrire les tests du generator**

Tester :
- `generateClaudeMd` : vérifie que la langue, le ton, le style sont dans le output
- `generateClaudeMd` avec contenu importé : retourne le contenu importé tel quel
- `generateSettingsJson` : vérifie la structure JSON, les permissions du bundle safe/dev
- `generateSettingsJson` avec hooks activés : vérifie le bloc hooks
- `generateMcpJson` : retourne null si pas de serveurs activés, JSON valide sinon
- `generateClaudeIgnore` : vérifie les patterns par défaut
- `generateAllFiles` : vérifie le nombre de fichiers, leurs paths
- `generateRuleFiles` : vérifie le frontmatter paths dans le contenu

**Step 3: Run tests**

Run: `npx vitest run`
Expected: Tous les tests passent

**Step 4: Commit**

```bash
git add vitest.config.ts src/lib/__tests__/ package.json
git commit -m "test: add generator unit tests with vitest"
```

---

### Task 24: Tests du storage service

**Files:**
- Create: `src/lib/__tests__/storage.test.ts`

**Step 1: Écrire les tests du storage**

Tester (avec mock localStorage) :
- `loadVault` : retourne [] si vide, retourne les entrées si présentes
- `saveToVault` : ajoute une entrée, retourne l'entrée créée avec id et timestamps
- `updateVaultEntry` : met à jour les champs spécifiés, met à jour updatedAt
- `deleteVaultEntry` : supprime l'entrée par id
- `toggleStar` : inverse le flag starred

**Step 2: Run tests**

Run: `npx vitest run`
Expected: Tous les tests passent

**Step 3: Commit**

```bash
git add src/lib/__tests__/storage.test.ts
git commit -m "test: add storage service unit tests"
```

---

## Résumé des Batches

| Batch | Tasks | Description |
|-------|-------|-------------|
| 1 | T1-T6b | Fondations : deps, types, context, generator, download, storage, toasts |
| 2 | T7-T8 | Wizard refactor ConfigContext + Preview tabbed dynamique |
| 3 | T9-T12 | Wizard steps 5-8 : Hooks, MCP, Rules, Récap + ZIP |
| 4 | T13-T14 | Drag & drop CLAUDE.md + Expert Mode CodeMirror (dynamic import) |
| 5 | T15-T17 | Templates data + Library (→ Expert) + Vault (→ Expert) |
| 6 | T18-T20 | Navigation, sidebar, flux complets one-way |
| 7 | T21-T22 | Alignement design .pen + responsive + polish |
| 8 | T23-T24 | Tests unitaires generator + storage |

**Total : 25 tasks, 8 batches**

**Corrections apportées au plan (v2) :**
- Suppression du bundle "Custom" (redondant avec permissions custom à l'étape 3) → Safe / Dev uniquement
- Preview Panel : tabs + fichier contextuel auto-sélectionné
- Wizard step 2b : champ custom permissions ajouté à l'étape 3
- Wizard step 2c : navigation dynamique des étapes avancées (skip les désactivées)
- Wizard step 2d : reset au mount pour garantir état propre
- Task 6b : système de toasts pour feedback utilisateur (ZIP, save, import, erreurs)
- Task 8 : WizardProgress doit gérer un nombre variable d'étapes (4 à 8)
- Task 14 : `next/dynamic` avec `ssr: false` pour CodeMirror
- Task 16 : "Use" redirige vers `/expert` (pas `/wizard`)
- Task 17 : "Restore" redirige vers `/expert` (flux one-way)
- Tasks 23-24 : tests unitaires Vitest sur logique pure

Sources (documentation Claude Code) :
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [Hooks](https://code.claude.com/docs/en/hooks)
- [MCP Servers](https://code.claude.com/docs/en/mcp)
- [Memory & CLAUDE.md](https://code.claude.com/docs/en/memory)
