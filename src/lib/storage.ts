import type { SavedConfig, ClaudeConfig } from "@/types";

const VAULT_KEY = "claude-config-vault";

function generateTags(config: ClaudeConfig): string[] {
  const tags: string[] = [];
  tags.push(config.bundle); // "safe" or "dev"
  if (config.enableHooks && config.hooks.some(h => h.enabled)) tags.push("hooks");
  if (config.enableMCP && config.mcpServers.some(s => s.enabled)) tags.push("mcp");
  if (config.enableRules && config.rules.some(r => r.enabled)) tags.push("rules");
  if (config.sandboxEnabled) tags.push("sandbox");
  if (config.permissionMode && config.permissionMode !== "default") tags.push(config.permissionMode);
  return tags;
}

export function loadVault(): SavedConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return [];
    const vault: SavedConfig[] = JSON.parse(raw);
    // Migrate legacy tags: regenerate from config for consistency
    let migrated = false;
    for (const entry of vault) {
      const fresh = generateTags(entry.config);
      if (JSON.stringify(entry.tags) !== JSON.stringify(fresh)) {
        entry.tags = fresh;
        migrated = true;
      }
    }
    if (migrated) localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    return vault;
  } catch {
    return [];
  }
}

export function saveToVault(name: string, config: ClaudeConfig): SavedConfig {
  const vault = loadVault();
  const entry: SavedConfig = {
    id: crypto.randomUUID(),
    name,
    config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    starred: false,
    tags: generateTags(config),
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
