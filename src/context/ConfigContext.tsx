"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { ClaudeConfig } from "@/types";
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
  const [config, dispatch] = useReducer(configReducer, undefined, getDefaultConfig);
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
