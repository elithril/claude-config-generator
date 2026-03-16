"use client";

import { useConfig } from "@/context/ConfigContext";
import type { McpServer } from "@/types";

export default function McpStep() {
  const { config, dispatch } = useConfig();

  const toggleMcpServer = (serverId: string) => {
    const updated = config.mcpServers.map((s: McpServer) =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    );
    dispatch({ type: "SET_FIELD", field: "mcpServers", value: updated });
  };

  const popular = config.mcpServers.filter((s: McpServer) => s.popular);
  const others = config.mcpServers.filter((s: McpServer) => !s.popular);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
        <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Serveurs populaires</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popular.map((server) => (
            <label
              key={server.id}
              className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                server.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
              }`}
            >
              <input
                type="checkbox"
                checked={server.enabled}
                onChange={() => toggleMcpServer(server.id)}
                className="mt-0.5 w-4 h-4 accent-[#0D6E6E]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{server.icon}</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{server.name}</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F0F0] text-[#666666] rounded">{server.transport}</span>
                </div>
                <p className="text-xs text-[#666666] mt-1">{server.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
        <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Autres serveurs</h4>
        <div className="flex flex-col gap-2">
          {others.map((server) => (
            <label
              key={server.id}
              className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                server.enabled ? "border-[#0D6E6E] bg-[#F0FAFA]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
              }`}
            >
              <input
                type="checkbox"
                checked={server.enabled}
                onChange={() => toggleMcpServer(server.id)}
                className="w-4 h-4 accent-[#0D6E6E]"
              />
              <span className="text-lg">{server.icon}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-[#1A1A1A]">{server.name}</span>
                <span className="text-xs text-[#666666] ml-2">{server.description}</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F0F0] text-[#666666] rounded">{server.transport}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
