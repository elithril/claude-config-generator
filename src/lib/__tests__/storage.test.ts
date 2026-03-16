import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadVault, saveToVault, updateVaultEntry, deleteVaultEntry, toggleStar } from "../storage";
import { getDefaultConfig } from "../defaults";

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    for (const key in mockStorage) delete mockStorage[key];
  }),
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: vi.fn((index: number) => Object.keys(mockStorage)[index] || null),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => `test-uuid-${Date.now()}-${Math.random().toString(36).slice(2)}`,
});

describe("loadVault", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should return empty array when vault is empty", () => {
    expect(loadVault()).toEqual([]);
  });

  it("should return saved entries", () => {
    const entries = [{ id: "1", name: "test", config: getDefaultConfig(), createdAt: "", updatedAt: "", starred: false, tags: [] }];
    mockStorage["claude-config-vault"] = JSON.stringify(entries);
    expect(loadVault()).toEqual(entries);
  });

  it("should return empty array on invalid JSON", () => {
    mockStorage["claude-config-vault"] = "invalid json";
    expect(loadVault()).toEqual([]);
  });
});

describe("saveToVault", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should add entry to vault", () => {
    const entry = saveToVault("test config", getDefaultConfig());
    expect(entry.name).toBe("test config");
    expect(entry.id).toBeDefined();
    expect(entry.starred).toBe(false);
    expect(entry.createdAt).toBeDefined();
  });

  it("should prepend new entry", () => {
    saveToVault("first", getDefaultConfig());
    saveToVault("second", getDefaultConfig());
    const vault = loadVault();
    expect(vault[0].name).toBe("second");
    expect(vault[1].name).toBe("first");
  });

  it("should include tags", () => {
    const entry = saveToVault("test", getDefaultConfig(), ["node", "backend"]);
    expect(entry.tags).toEqual(["node", "backend"]);
  });
});

describe("updateVaultEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should update specified fields", () => {
    const entry = saveToVault("original", getDefaultConfig());
    updateVaultEntry(entry.id, { name: "updated" });
    const vault = loadVault();
    expect(vault[0].name).toBe("updated");
  });

  it("should update updatedAt timestamp", () => {
    const entry = saveToVault("test", getDefaultConfig());
    updateVaultEntry(entry.id, { name: "updated" });
    const vault = loadVault();
    // updatedAt should be a valid ISO string
    expect(new Date(vault[0].updatedAt).toISOString()).toBe(vault[0].updatedAt);
    expect(vault[0].name).toBe("updated");
  });

  it("should do nothing for non-existent id", () => {
    saveToVault("test", getDefaultConfig());
    updateVaultEntry("non-existent", { name: "updated" });
    const vault = loadVault();
    expect(vault[0].name).toBe("test");
  });
});

describe("deleteVaultEntry", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should remove entry by id", () => {
    const entry = saveToVault("to delete", getDefaultConfig());
    deleteVaultEntry(entry.id);
    expect(loadVault()).toHaveLength(0);
  });

  it("should not affect other entries", () => {
    const entry1 = saveToVault("keep", getDefaultConfig());
    const entry2 = saveToVault("delete", getDefaultConfig());
    deleteVaultEntry(entry2.id);
    const vault = loadVault();
    expect(vault).toHaveLength(1);
    expect(vault[0].id).toBe(entry1.id);
  });
});

describe("toggleStar", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should toggle starred from false to true", () => {
    const entry = saveToVault("test", getDefaultConfig());
    toggleStar(entry.id);
    const vault = loadVault();
    expect(vault[0].starred).toBe(true);
  });

  it("should toggle starred from true to false", () => {
    const entry = saveToVault("test", getDefaultConfig());
    toggleStar(entry.id);
    toggleStar(entry.id);
    const vault = loadVault();
    expect(vault[0].starred).toBe(false);
  });

  it("should do nothing for non-existent id", () => {
    saveToVault("test", getDefaultConfig());
    toggleStar("non-existent");
    const vault = loadVault();
    expect(vault[0].starred).toBe(false);
  });
});
