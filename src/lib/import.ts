import JSZip from "jszip";
import type { ClaudeConfig } from "@/types";
import { getDefaultConfig } from "./defaults";

export async function importFromZip(file: File): Promise<ClaudeConfig> {
  const zip = await JSZip.loadAsync(file);

  // Validate: must contain at least CLAUDE.md or .claude/settings.json
  const hasClaudeMd = !!zip.file("CLAUDE.md");
  const hasSettings = !!zip.file(".claude/settings.json");
  if (!hasClaudeMd && !hasSettings) {
    throw new Error("Invalid config ZIP: missing CLAUDE.md and .claude/settings.json");
  }

  const config = getDefaultConfig();

  // Parse settings.json
  const settingsFile = zip.file(".claude/settings.json");
  if (settingsFile) {
    try {
      const raw = await settingsFile.async("string");
      const settings = JSON.parse(raw);

      if (settings.language) {
        config.language = settings.language === "french" ? "fr" : settings.language === "spanish" ? "es" : "en";
      }
      if (settings.model) config.model = settings.model;
      if (settings.effortLevel) config.effortLevel = settings.effortLevel;
      if (typeof settings.alwaysThinkingEnabled === "boolean") config.extendedThinking = settings.alwaysThinkingEnabled;
      if (settings.outputStyle) config.outputStyle = settings.outputStyle;
      if (typeof settings.autoMemoryEnabled === "boolean") config.autoMemoryEnabled = settings.autoMemoryEnabled;
      if (typeof settings.includeGitInstructions === "boolean") config.includeGitInstructions = settings.includeGitInstructions;
      if (settings.teammateMode) config.teammateMode = settings.teammateMode;
      if (settings.autoUpdatesChannel) config.autoUpdatesChannel = settings.autoUpdatesChannel;
      if (settings.env) config.envVars = settings.env;

      if (settings.attribution) {
        config.attribution = {
          commit: settings.attribution.commit || "",
          pr: settings.attribution.pr || "",
        };
      }

      if (settings.permissions) {
        if (settings.permissions.defaultMode) config.permissionMode = settings.permissions.defaultMode;
        if (settings.permissions.allow) config.permissions.allow = settings.permissions.allow;
        if (settings.permissions.ask) config.permissions.ask = settings.permissions.ask;
        if (settings.permissions.deny) config.permissions.deny = settings.permissions.deny;
      }

      if (settings.sandbox?.enabled) config.sandboxEnabled = true;

      // Detect bundle from permissions patterns
      const denyStr = JSON.stringify(settings.permissions?.deny || []);
      const allowStr = JSON.stringify(settings.permissions?.allow || []);
      if (allowStr.includes("npm run") && allowStr.includes("git")) {
        config.bundle = "dev";
      } else if (denyStr.includes("rm -rf") || denyStr.includes("push --force")) {
        config.bundle = "safe";
      }

      // Hooks
      if (settings.hooks) {
        config.enableHooks = true;
        // Mark matching default hooks as enabled
        for (const hook of config.hooks) {
          const eventHooks = settings.hooks[hook.event];
          if (!eventHooks) continue;
          for (const entry of eventHooks) {
            if (hook.matcher && entry.matcher !== hook.matcher) continue;
            for (const h of entry.hooks || []) {
              if ((h.type === "command" && h.command === hook.command) ||
                  (h.type === "prompt" && h.prompt === hook.command)) {
                hook.enabled = true;
              }
            }
          }
        }
      }
    } catch {
      // Invalid settings.json, continue with defaults
    }
  }

  // Parse CLAUDE.md
  const claudeMdFile = zip.file("CLAUDE.md");
  if (claudeMdFile) {
    config.claudeMdContent = await claudeMdFile.async("string");
    config.claudeMdImported = true;
  }

  // Parse .claudeignore
  const claudeIgnoreFile = zip.file(".claudeignore");
  if (claudeIgnoreFile) {
    config.claudeIgnoreContent = await claudeIgnoreFile.async("string");
  }

  // Parse .mcp.json
  const mcpFile = zip.file(".mcp.json");
  if (mcpFile) {
    try {
      const raw = await mcpFile.async("string");
      const mcp = JSON.parse(raw);
      config.enableMCP = true;
      if (mcp.mcpServers) {
        // Match enabled servers with defaults
        for (const server of config.mcpServers) {
          const name = server.name.toLowerCase().replace(/\s+/g, "-");
          if (mcp.mcpServers[name]) {
            server.enabled = true;
            // Update env/url if present
            const imported = mcp.mcpServers[name];
            if (imported.env) server.env = imported.env;
            if (imported.url) server.url = imported.url;
            if (imported.args) server.args = imported.args;
          }
        }
      }
    } catch {
      // Invalid mcp.json
    }
  }

  // Parse rules
  const rulesFolder = zip.folder(".claude/rules");
  if (rulesFolder) {
    const ruleFiles = Object.keys(zip.files).filter(f => f.startsWith(".claude/rules/") && f.endsWith(".md"));
    if (ruleFiles.length > 0) {
      config.enableRules = true;
      for (const rule of config.rules) {
        const match = ruleFiles.find(f => f.endsWith(`/${rule.filename}`));
        if (match) {
          rule.enabled = true;
          const content = await zip.file(match)!.async("string");
          // Strip frontmatter comment and YAML, keep content
          const cleaned = content
            .replace(/^<!-- .* -->\n/, "")
            .replace(/^---\n[\s\S]*?---\n\n?/, "");
          if (cleaned.trim()) rule.content = cleaned;
        }
      }
    }
  }

  return config;
}
