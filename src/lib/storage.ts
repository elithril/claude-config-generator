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
