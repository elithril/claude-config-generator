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
