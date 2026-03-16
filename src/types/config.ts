// === WIZARD STATE ===

export type BundleType = "safe" | "dev";
export type LanguageType = "fr" | "en" | "es";
export type ToneType = "cool" | "pro" | "pedagogue";
export type ResponseStyleType = "concise" | "detailed" | "technical";
export type ModelType = "claude-sonnet-4-6" | "claude-opus-4-6" | "claude-haiku-4-5";
export type PermissionModeType = "default" | "plan" | "acceptEdits" | "dontAsk";
export type EffortLevelType = "low" | "medium" | "high";
export type TeammateModeType = "auto" | "in-process" | "tmux";
export type UpdateChannelType = "stable" | "latest";

// === HOOKS ===

export type HookEventType =
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "UserPromptSubmit"
  | "Stop"
  | "SessionStart"
  | "PreCompact"
  | "PostCompact";

export type HookActionType = "command" | "prompt" | "http" | "agent";

export interface HookEntry {
  id: string;
  event: HookEventType;
  matcher?: string;
  action: HookActionType;
  command: string;  // command for "command" type, prompt text for "prompt"/"agent", url for "http"
  description: string;
  enabled: boolean;
  timeout?: number;
  async?: boolean;
}

// === MCP SERVERS ===

export type McpTransportType = "stdio" | "http";

export interface McpServer {
  id: string;
  name: string;
  description: string;
  transport: McpTransportType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
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
  model: ModelType;
  effortLevel: EffortLevelType;
  extendedThinking: boolean;
  includeCoAuthoredBy: boolean;

  // Step 2 - Additional preferences
  outputStyle: string;
  autoMemoryEnabled: boolean;
  includeGitInstructions: boolean;

  // Step 3 - Permissions
  responseStyle: ResponseStyleType;
  permissionMode: PermissionModeType;
  sandboxEnabled: boolean;
  disallowedTools: string[];
  permissions: Permissions;

  // Step 4 - Advanced toggle
  enableHooks: boolean;
  enableMCP: boolean;
  enableRules: boolean;
  teammateMode: TeammateModeType;
  autoUpdatesChannel: UpdateChannelType;

  // Step 5 - Hooks
  hooks: HookEntry[];

  // Step 6 - MCP
  mcpServers: McpServer[];

  // Step 7 - Rules
  rules: RuleEntry[];

  // CLAUDE.md
  claudeMdContent: string;
  claudeMdImported: boolean;

  // Environment variables
  envVars: Record<string, string>;

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
