"use client";

import { useConfig } from "@/context/ConfigContext";
import type { HookEntry } from "@/types";

export default function HooksStep() {
  const { config, dispatch } = useConfig();

  const toggleHook = (hookId: string) => {
    const updated = config.hooks.map((h: HookEntry) =>
      h.id === hookId ? { ...h, enabled: !h.enabled } : h
    );
    dispatch({ type: "SET_FIELD", field: "hooks", value: updated });
  };

  const groupedHooks: Record<string, HookEntry[]> = {};
  for (const hook of config.hooks) {
    if (!groupedHooks[hook.event]) groupedHooks[hook.event] = [];
    groupedHooks[hook.event].push(hook);
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupedHooks).map(([event, hooks]) => (
        <div key={event} className="bg-white rounded-md border border-[#E5E5E5] p-5">
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#F0FAFA] text-[#0D6E6E] text-xs rounded font-mono">{event}</span>
          </h4>
          <div className="flex flex-col gap-2">
            {hooks.map((hook) => (
              <label
                key={hook.id}
                className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                  hook.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hook.enabled}
                  onChange={() => toggleHook(hook.id)}
                  className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#1A1A1A]">{hook.description}</span>
                  {hook.enabled && (
                    <p className="font-[family-name:var(--font-jetbrains)] text-xs text-[#666666] mt-1 bg-[#F5F5F5] px-2 py-1 rounded">
                      {hook.command}
                    </p>
                  )}
                  {hook.matcher && (
                    <span className="text-xs text-[#888888] mt-1 block">Matcher: {hook.matcher}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
