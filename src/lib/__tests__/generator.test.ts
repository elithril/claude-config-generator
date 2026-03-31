import { describe, it, expect } from "vitest";
import {
  generateClaudeMd,
  generateSettingsJson,
  generateMcpJson,
  generateClaudeIgnore,
  generateRuleFiles,
  generateAllFiles,
} from "../generator";
import { getDefaultConfig } from "../defaults";
import type { ClaudeConfig } from "@/types";

function makeConfig(overrides: Partial<ClaudeConfig> = {}): ClaudeConfig {
  return { ...getDefaultConfig(), ...overrides };
}

// ========== CLAUDE.md ==========

describe("generateClaudeMd", () => {
  it("should include language in output", () => {
    const result = generateClaudeMd(makeConfig({ language: "fr" }));
    expect(result).toContain("Français");
  });

  it("should include tone in output", () => {
    const result = generateClaudeMd(makeConfig({ tone: "pro" }));
    expect(result).toContain("Professionnel");
  });

  it("should include response style in output", () => {
    const result = generateClaudeMd(makeConfig({ responseStyle: "concise" }));
    expect(result).toContain("concise");
  });

  it("should include safe mode section for safe bundle", () => {
    const result = generateClaudeMd(makeConfig({ bundle: "safe" }));
    expect(result).toContain("Sécurité");
  });

  it("should include dev mode section for dev bundle", () => {
    const result = generateClaudeMd(makeConfig({ bundle: "dev" }));
    expect(result).toContain("Développement");
  });

  it("should return imported content when claudeMdImported is true", () => {
    const imported = "# My custom CLAUDE.md\nCustom content here";
    const result = generateClaudeMd(
      makeConfig({ claudeMdImported: true, claudeMdContent: imported })
    );
    expect(result).toBe(imported);
  });

  it("should generate in English when language is en", () => {
    const result = generateClaudeMd(makeConfig({ language: "en" }));
    expect(result).toContain("Always respond in English");
    expect(result).toContain("# Claude Code Configuration");
  });

  it("should generate in Spanish when language is es", () => {
    const result = generateClaudeMd(makeConfig({ language: "es" }));
    expect(result).toContain("Siempre responder en Español");
  });

  it("should include HTML comment header", () => {
    const result = generateClaudeMd(makeConfig({ language: "fr" }));
    expect(result).toContain("<!--");
    expect(result).toContain("-->");
  });

  it("should include project stack when provided", () => {
    const result = generateClaudeMd(makeConfig({ projectStack: "Next.js 15, TypeScript" }));
    expect(result).toContain("Stack technique");
    expect(result).toContain("Next.js 15, TypeScript");
  });

  it("should include build/test/lint commands when provided", () => {
    const result = generateClaudeMd(makeConfig({
      buildCommand: "npm run build",
      testCommand: "npm test",
      lintCommand: "npm run lint",
    }));
    expect(result).toContain("Commandes");
    expect(result).toContain("`npm run build`");
    expect(result).toContain("`npm test`");
    expect(result).toContain("`npm run lint`");
  });

  it("should not include commands section when empty", () => {
    const result = generateClaudeMd(makeConfig());
    expect(result).not.toContain("Commandes");
  });

  it("should include project structure when provided", () => {
    const result = generateClaudeMd(makeConfig({ projectStructure: "src/ → code" }));
    expect(result).toContain("Structure du projet");
    expect(result).toContain("src/ → code");
  });
});

// ========== settings.json ==========

describe("generateSettingsJson", () => {
  it("should return valid JSON", () => {
    const result = generateSettingsJson(makeConfig());
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("should include $schema", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig()));
    expect(result.$schema).toBeDefined();
  });

  it("should set language to french for fr", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ language: "fr" })));
    expect(result.language).toBe("french");
  });

  it("should set language to english for en", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ language: "en" })));
    expect(result.language).toBe("english");
  });

  it("should add deny rules for safe bundle", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ bundle: "safe" })));
    expect(result.permissions.deny).toContain("Bash(rm -rf *)");
    expect(result.permissions.deny).toContain("Bash(git push --force *)");
    expect(result.permissions.deny).toContain("Bash(git reset --hard *)");
  });

  it("should add ask rules for safe bundle", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ bundle: "safe" })));
    expect(result.permissions.ask).toContain("Bash(git push *)");
    expect(result.permissions.ask).toContain("Bash(docker *)");
    expect(result.permissions.ask).toContain("Bash(kubectl *)");
  });

  it("should add allow rules for dev bundle", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ bundle: "dev" })));
    expect(result.permissions.allow).toContain("Bash(npm run *)");
  });

  it("should include hooks when enabled", () => {
    const config = makeConfig({ enableHooks: true });
    config.hooks = config.hooks.map((h) => ({ ...h, enabled: true }));
    const result = JSON.parse(generateSettingsJson(config));
    expect(result.hooks).toBeDefined();
    expect(result.hooks.PostToolUse).toBeDefined();
  });

  it("should merge hooks with same event and matcher", () => {
    const config = makeConfig({ enableHooks: true });
    // Enable both lint and format hooks (same event + matcher)
    config.hooks = config.hooks.map((h) =>
      h.id === "hook-lint-on-save" || h.id === "hook-format-on-save"
        ? { ...h, enabled: true }
        : h
    );
    const result = JSON.parse(generateSettingsJson(config));
    // Should be ONE entry for PostToolUse with matcher Write|Edit
    expect(result.hooks.PostToolUse).toHaveLength(1);
    expect(result.hooks.PostToolUse[0].hooks).toHaveLength(2);
    expect(result.hooks.PostToolUse[0].matcher).toBe("Write|Edit");
  });

  it("should not merge hooks with different matchers", () => {
    const config = makeConfig({ enableHooks: true });
    // Enable lint (PostToolUse Write|Edit) and validate-bash (PreToolUse Bash)
    config.hooks = config.hooks.map((h) =>
      h.id === "hook-lint-on-save" || h.id === "hook-validate-bash"
        ? { ...h, enabled: true }
        : h
    );
    const result = JSON.parse(generateSettingsJson(config));
    expect(result.hooks.PostToolUse).toHaveLength(1);
    expect(result.hooks.PreToolUse).toHaveLength(1);
  });

  it("should not include hooks when none enabled", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ enableHooks: true })));
    expect(result.hooks).toBeUndefined();
  });

  it("should include model", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ model: "claude-opus-4-6" })));
    expect(result.model).toBe("claude-opus-4-6");
  });

  it("should include effortLevel", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ effortLevel: "low" })));
    expect(result.effortLevel).toBe("low");
  });

  it("should include attribution", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ attribution: { commit: "test commit", pr: "test pr" } })));
    expect(result.attribution.commit).toBe("test commit");
    expect(result.attribution.pr).toBe("test pr");
  });

  it("should include alwaysThinkingEnabled", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ extendedThinking: true })));
    expect(result.alwaysThinkingEnabled).toBe(true);
  });

  it("should include outputStyle when set", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ outputStyle: "Explanatory" })));
    expect(result.outputStyle).toBe("Explanatory");
  });

  it("should not include outputStyle when empty", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ outputStyle: "" })));
    expect(result.outputStyle).toBeUndefined();
  });

  it("should include sandbox when enabled", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ sandboxEnabled: true })));
    expect(result.sandbox.enabled).toBe(true);
  });

  it("should merge disallowedTools into permissions.deny", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ disallowedTools: ["WebFetch", "Bash"] })));
    expect(result.disallowedTools).toBeUndefined();
    expect(result.permissions.deny).toContain("WebFetch");
    expect(result.permissions.deny).toContain("Bash");
  });

  it("should include env when set", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ envVars: { FOO: "bar" } })));
    expect(result.env.FOO).toBe("bar");
  });

  it("should include teammateMode when not auto", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ teammateMode: "tmux" })));
    expect(result.teammateMode).toBe("tmux");
  });

  it("should include permission ask rules", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ permissions: { allow: [], ask: ["Bash(git push *)"], deny: [] } })));
    expect(result.permissions.ask).toContain("Bash(git push *)");
  });

  it("should include defaultMode when not default", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ permissionMode: "plan" })));
    expect(result.permissions.defaultMode).toBe("plan");
  });

  it("should set auto mode correctly", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ permissionMode: "auto" })));
    expect(result.permissions.defaultMode).toBe("auto");
  });

  it("should include credentials in default deny rules", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig()));
    expect(result.permissions.deny).toContain("Read(./**/*.pem)");
    expect(result.permissions.deny).toContain("Read(./**/*.key)");
    expect(result.permissions.deny).toContain("Read(./**/credentials.json)");
  });
});

// ========== .mcp.json ==========

describe("generateMcpJson", () => {
  it("should return null when MCP is disabled", () => {
    expect(generateMcpJson(makeConfig({ enableMCP: false }))).toBeNull();
  });

  it("should return null when no servers enabled", () => {
    expect(generateMcpJson(makeConfig({ enableMCP: true }))).toBeNull();
  });

  it("should return valid JSON when servers are enabled", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-github" ? { ...s, enabled: true } : s
    );
    const result = generateMcpJson(config);
    expect(result).not.toBeNull();
    const parsed = JSON.parse(result!);
    expect(parsed.mcpServers).toBeDefined();
    expect(parsed.mcpServers["github"]).toBeDefined();
  });

  it("should include command for stdio transport", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-chrome-devtools" ? { ...s, enabled: true } : s
    );
    const result = JSON.parse(generateMcpJson(config)!);
    expect(result.mcpServers["chrome-devtools"].command).toBe("npx");
  });

  it("should include command and args for GitHub stdio transport", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-github" ? { ...s, enabled: true } : s
    );
    const result = JSON.parse(generateMcpJson(config)!);
    expect(result.mcpServers["github"].command).toBe("npx");
    expect(result.mcpServers["github"].args).toContain("@modelcontextprotocol/server-github");
  });

  it("should include env vars for servers that need them", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-github" ? { ...s, enabled: true } : s
    );
    const result = JSON.parse(generateMcpJson(config)!);
    expect(result.mcpServers["github"].env).toBeDefined();
    expect(result.mcpServers["github"].env.GITHUB_PERSONAL_ACCESS_TOKEN).toBeDefined();
  });

  it("should include url for http transport", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-sentry" ? { ...s, enabled: true } : s
    );
    const result = JSON.parse(generateMcpJson(config)!);
    expect(result.mcpServers["sentry"].url).toBeDefined();
    expect(result.mcpServers["sentry"].type).toBe("http");
  });
});

// ========== .claudeignore ==========

describe("generateClaudeIgnore", () => {
  it("should return custom content when provided", () => {
    const custom = "node_modules/\n.env";
    const result = generateClaudeIgnore(makeConfig({ claudeIgnoreContent: custom }));
    expect(result).toBe(custom);
  });

  it("should include default patterns", () => {
    const result = generateClaudeIgnore(makeConfig());
    expect(result).toContain("node_modules/");
    expect(result).toContain(".env");
    expect(result).toContain(".DS_Store");
  });

  it("should include secrets section for safe bundle", () => {
    const result = generateClaudeIgnore(makeConfig({ bundle: "safe" }));
    expect(result).toContain("*.pem");
    expect(result).toContain("*.key");
  });

  it("should include bilingual header comment", () => {
    const result = generateClaudeIgnore(makeConfig());
    expect(result).toContain("invisible to Claude");
    expect(result).toContain("invisibles pour Claude");
  });
});

// ========== Rule files ==========

describe("generateRuleFiles", () => {
  it("should return empty array when rules disabled", () => {
    expect(generateRuleFiles(makeConfig({ enableRules: false }))).toEqual([]);
  });

  it("should return only enabled rules", () => {
    const config = makeConfig({ enableRules: true });
    config.rules = config.rules.map((r) =>
      r.id === "rule-code-style" ? { ...r, enabled: true } : r
    );
    const result = generateRuleFiles(config);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe(".claude/rules/code-style.md");
  });

  it("should include frontmatter paths when present", () => {
    const config = makeConfig({ enableRules: true });
    config.rules = config.rules.map((r) =>
      r.id === "rule-code-style" ? { ...r, enabled: true } : r
    );
    const result = generateRuleFiles(config);
    expect(result[0].content).toContain("---");
    expect(result[0].content).toContain("paths:");
  });

  it("should include HTML comment header", () => {
    const config = makeConfig({ enableRules: true });
    config.rules = config.rules.map((r) =>
      r.id === "rule-code-style" ? { ...r, enabled: true } : r
    );
    const result = generateRuleFiles(config);
    expect(result[0].content).toContain("<!-- Claude rule file");
  });
});

// ========== All files ==========

describe("generateAllFiles", () => {
  it("should generate at least 3 files by default", () => {
    const result = generateAllFiles(makeConfig());
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it("should include CLAUDE.md, settings.json, and .claudeignore", () => {
    const result = generateAllFiles(makeConfig());
    const paths = result.map((f) => f.path);
    expect(paths).toContain("CLAUDE.md");
    expect(paths).toContain(".claude/settings.json");
    expect(paths).toContain(".claudeignore");
  });

  it("should include .mcp.json when MCP servers are enabled", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-github" ? { ...s, enabled: true } : s
    );
    const result = generateAllFiles(config);
    const paths = result.map((f) => f.path);
    expect(paths).toContain(".mcp.json");
  });

  it("should not include .mcp.json when no servers enabled", () => {
    const result = generateAllFiles(makeConfig({ enableMCP: true }));
    const paths = result.map((f) => f.path);
    expect(paths).not.toContain(".mcp.json");
  });

  it("should include rule files when rules are enabled", () => {
    const config = makeConfig({ enableRules: true });
    config.rules = config.rules.map((r) => ({ ...r, enabled: true }));
    const result = generateAllFiles(config);
    const rulePaths = result.filter((f) => f.path.startsWith(".claude/rules/"));
    expect(rulePaths.length).toBeGreaterThan(0);
  });

  it("should have size > 0 for all files", () => {
    const result = generateAllFiles(makeConfig());
    for (const file of result) {
      expect(file.size).toBeGreaterThan(0);
    }
  });
});
