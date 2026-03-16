"use client";

import { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import type { McpServer, McpTransportType } from "@/types";

export default function McpStep() {
  const { config, dispatch } = useConfig();
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTransport, setCustomTransport] = useState<McpTransportType>("http");
  const [customUrl, setCustomUrl] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [customEnvKey, setCustomEnvKey] = useState("");
  const [customEnvValue, setCustomEnvValue] = useState("");
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});
  const [customHeaderKey, setCustomHeaderKey] = useState("");
  const [customHeaderValue, setCustomHeaderValue] = useState("");
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});

  const toggleMcpServer = (serverId: string) => {
    const updated = config.mcpServers.map((s: McpServer) =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    );
    dispatch({ type: "SET_FIELD", field: "mcpServers", value: updated });
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    if (customTransport === "http" && !customUrl.trim()) return;
    if (customTransport === "stdio" && !customCommand.trim()) return;

    const parts = customTransport === "stdio" ? customCommand.trim().split(/\s+/) : [];

    const newServer: McpServer = {
      id: `mcp-custom-${Date.now()}`,
      name: customName.trim(),
      description: "Serveur personnalisé",
      transport: customTransport,
      ...(customTransport === "stdio" ? {
        command: parts[0],
        args: parts.slice(1),
      } : {
        url: customUrl.trim(),
      }),
      ...(Object.keys(customEnv).length > 0 ? { env: customEnv } : {}),
      ...(Object.keys(customHeaders).length > 0 ? { headers: customHeaders } : {}),
      enabled: true,
      icon: "🔧",
    };

    dispatch({
      type: "SET_FIELD",
      field: "mcpServers",
      value: [...config.mcpServers, newServer],
    });

    // Reset form
    setCustomName("");
    setCustomUrl("");
    setCustomCommand("");
    setCustomEnv({});
    setCustomHeaders({});
    setShowAddForm(false);
  };

  const handleAddEnv = () => {
    if (!customEnvKey.trim() || !customEnvValue.trim()) return;
    setCustomEnv({ ...customEnv, [customEnvKey.trim()]: customEnvValue.trim() });
    setCustomEnvKey("");
    setCustomEnvValue("");
  };

  const removeCustomServer = (serverId: string) => {
    dispatch({
      type: "SET_FIELD",
      field: "mcpServers",
      value: config.mcpServers.filter((s: McpServer) => s.id !== serverId),
    });
  };

  const popular = config.mcpServers.filter((s: McpServer) => s.popular);
  const others = config.mcpServers.filter((s: McpServer) => !s.popular && !s.id.startsWith("mcp-custom-"));
  const custom = config.mcpServers.filter((s: McpServer) => s.id.startsWith("mcp-custom-"));

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
              <input type="checkbox" checked={server.enabled} onChange={() => toggleMcpServer(server.id)} className="mt-0.5 w-4 h-4 accent-[#0D6E6E]" />
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
              <input type="checkbox" checked={server.enabled} onChange={() => toggleMcpServer(server.id)} className="w-4 h-4 accent-[#0D6E6E]" />
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

      {/* Custom servers list */}
      {custom.length > 0 && (
        <div className="bg-white rounded-md border border-[#E5E5E5] p-5">
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Serveurs personnalisés</h4>
          <div className="flex flex-col gap-2">
            {custom.map((server) => (
              <div key={server.id} className="flex items-center gap-3 p-3 border border-[#0D6E6E] bg-[#F0FAFA] rounded">
                <span className="text-lg">{server.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-[#1A1A1A]">{server.name}</span>
                  <span className="text-xs text-[#666666] ml-2">
                    {server.transport === "stdio" ? server.command : server.url}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] bg-[#F0F0F0] text-[#666666] rounded">{server.transport}</span>
                <button onClick={() => removeCustomServer(server.id)} className="text-xs text-[#dc2626] hover:underline">Suppr</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom form */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-[#E5E5E5] rounded-lg text-sm text-[#888888] hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors"
        >
          + Ajouter un serveur personnalisé
        </button>
      ) : (
        <div className="bg-white rounded-md border border-[#0D6E6E] p-5">
          <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">Nouveau serveur MCP</h4>
          <div className="flex flex-col gap-3">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-[#666666] mb-1 block">Nom</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="mon-api"
                className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
              />
            </div>

            {/* Transport */}
            <div>
              <label className="text-xs font-medium text-[#666666] mb-1 block">Transport</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomTransport("http")}
                  className={`flex-1 py-2 text-sm rounded border ${customTransport === "http" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E] font-medium" : "border-[#E5E5E5] text-[#666666]"}`}
                >
                  HTTP (remote)
                </button>
                <button
                  onClick={() => setCustomTransport("stdio")}
                  className={`flex-1 py-2 text-sm rounded border ${customTransport === "stdio" ? "border-[#0D6E6E] bg-[#F0FAFA] text-[#0D6E6E] font-medium" : "border-[#E5E5E5] text-[#666666]"}`}
                >
                  stdio (local)
                </button>
              </div>
            </div>

            {/* URL or Command */}
            {customTransport === "http" ? (
              <div>
                <label className="text-xs font-medium text-[#666666] mb-1 block">URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://mcp.example.com/mcp"
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E]"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-[#666666] mb-1 block">Commande</label>
                <input
                  type="text"
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  placeholder="npx -y @package/server"
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono text-xs"
                />
                <p className="text-[10px] text-[#AAAAAA] mt-1">La commande complète avec ses arguments, séparés par des espaces.</p>
              </div>
            )}

            {/* Env vars */}
            <div>
              <label className="text-xs font-medium text-[#666666] mb-1 block">Variables d&apos;environnement (optionnel)</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={customEnvKey} onChange={(e) => setCustomEnvKey(e.target.value)} placeholder="CLÉ" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                <input type="text" value={customEnvValue} onChange={(e) => setCustomEnvValue(e.target.value)} placeholder="valeur" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                <button onClick={handleAddEnv} className="px-2 py-1.5 text-xs bg-[#F0F0F0] text-[#666666] rounded hover:bg-[#E5E5E5]">+</button>
              </div>
              {Object.keys(customEnv).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(customEnv).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F5] text-[#666666] text-[10px] rounded font-mono">
                      {k}={v}
                      <button onClick={() => { const e = { ...customEnv }; delete e[k]; setCustomEnv(e); }} className="hover:text-[#dc2626]">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Headers (HTTP only) */}
            {customTransport === "http" && (
              <div>
                <label className="text-xs font-medium text-[#666666] mb-1 block">Headers HTTP (optionnel)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={customHeaderKey} onChange={(e) => setCustomHeaderKey(e.target.value)} placeholder="Authorization" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                  <input type="text" value={customHeaderValue} onChange={(e) => setCustomHeaderValue(e.target.value)} placeholder="Bearer $MY_TOKEN" className="flex-1 px-2 py-1.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-[#0D6E6E] font-mono" />
                  <button onClick={() => {
                    if (!customHeaderKey.trim()) return;
                    setCustomHeaders({ ...customHeaders, [customHeaderKey.trim()]: customHeaderValue.trim() });
                    setCustomHeaderKey(""); setCustomHeaderValue("");
                  }} className="px-2 py-1.5 text-xs bg-[#F0F0F0] text-[#666666] rounded hover:bg-[#E5E5E5]">+</button>
                </div>
                {Object.keys(customHeaders).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(customHeaders).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F5] text-[#666666] text-[10px] rounded font-mono">
                        {k}: {v}
                        <button onClick={() => { const h = { ...customHeaders }; delete h[k]; setCustomHeaders(h); }} className="hover:text-[#dc2626]">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-[#666666] hover:text-[#1A1A1A]">Annuler</button>
              <button onClick={handleAddCustom} className="px-4 py-1.5 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555]">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
