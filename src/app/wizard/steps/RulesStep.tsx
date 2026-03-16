"use client";

import { useConfig } from "@/context/ConfigContext";
import type { RuleEntry } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "code-style": "bg-blue-50 text-blue-700 border-blue-200",
  testing: "bg-purple-50 text-purple-700 border-purple-200",
  security: "bg-red-50 text-red-700 border-red-200",
  api: "bg-orange-50 text-orange-700 border-orange-200",
  git: "bg-green-50 text-green-700 border-green-200",
  custom: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function RulesStep() {
  const { config, dispatch } = useConfig();

  const toggleRule = (ruleId: string) => {
    const updated = config.rules.map((r: RuleEntry) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    dispatch({ type: "SET_FIELD", field: "rules", value: updated });
  };

  return (
    <div className="flex flex-col gap-3">
      {config.rules.map((rule: RuleEntry) => (
        <div
          key={rule.id}
          className={`bg-white rounded-md border p-4 transition-colors ${
            rule.enabled ? "border-[#0D6E6E]" : "border-[#E5E5E5]"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => toggleRule(rule.id)}
              className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-[#1A1A1A]">{rule.title}</span>
                <span className={`px-2 py-0.5 text-[10px] rounded border ${CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.custom}`}>
                  {rule.category}
                </span>
              </div>
              <p className="text-xs text-[#666666]">{rule.description}</p>
              {rule.paths && rule.paths.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {rule.paths.map((p, i) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] bg-[#F5F5F5] text-[#888888] rounded font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {rule.enabled && (
                <pre className="mt-2 p-3 bg-[#FAFAFA] rounded text-xs font-mono text-[#666666] max-h-24 overflow-auto">
                  {rule.content}
                </pre>
              )}
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}
