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
});

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

  it("should not include hooks when none enabled", () => {
    const result = JSON.parse(generateSettingsJson(makeConfig({ enableHooks: true })));
    expect(result.hooks).toBeUndefined();
  });
});

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

  it("should include url for http transport", () => {
    const config = makeConfig({ enableMCP: true });
    config.mcpServers = config.mcpServers.map((s) =>
      s.id === "mcp-github" ? { ...s, enabled: true } : s
    );
    const result = JSON.parse(generateMcpJson(config)!);
    expect(result.mcpServers["github"].url).toBeDefined();
  });
});

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
});

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
});

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
