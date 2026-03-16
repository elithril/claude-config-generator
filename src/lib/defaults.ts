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
  {
    id: "hook-validate-prompt",
    event: "UserPromptSubmit",
    action: "command",
    command: ".claude/hooks/validate-prompt.sh",
    description: "Valider le prompt utilisateur avant envoi",
    enabled: false,
  },
  {
    id: "hook-on-failure",
    event: "PostToolUseFailure",
    matcher: "Bash",
    action: "command",
    command: "echo 'Tool failed' >> .claude/failure.log",
    description: "Logger les échecs de commandes Bash",
    enabled: false,
  },
  {
    id: "hook-ai-review-stop",
    event: "Stop",
    action: "prompt",
    command: "Vérifie que toutes les tâches demandées sont complètes et que le code compile: $ARGUMENTS",
    description: "Vérification IA avant de terminer",
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
    model: "claude-sonnet-4-6",
    effortLevel: "high",
    extendedThinking: false,
    attribution: { commit: "🤖 Generated with Claude Code", pr: "" },
    outputStyle: "",
    autoMemoryEnabled: true,
    includeGitInstructions: true,
    responseStyle: "concise",
    permissionMode: "default",
    sandboxEnabled: false,
    disallowedTools: [],
    permissions: {
      allow: [],
      ask: [],
      deny: ["Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"],
    },
    enableHooks: false,
    enableMCP: false,
    enableRules: false,
    teammateMode: "auto",
    autoUpdatesChannel: "latest",
    hooks: DEFAULT_HOOKS,
    mcpServers: DEFAULT_MCP_SERVERS,
    rules: DEFAULT_RULES,
    claudeMdContent: "",
    claudeMdImported: false,
    envVars: {},
    claudeIgnoreContent: "",
  };
}
