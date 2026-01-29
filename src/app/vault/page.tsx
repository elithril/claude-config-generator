"use client";

import { Layout, PageHeader } from "@/components";

interface Config {
  id: string;
  name: string;
  modified: string;
  starred: boolean;
  badge?: { text: string; color: string; bg: string };
  icon?: string;
}

const configs: Config[] = [
  {
    id: "1",
    name: "production-api.yml",
    modified: "Modified 2 hours ago",
    starred: true,
    badge: { text: "Node.js", color: "#0D6E6E", bg: "#F0FAFA" },
  },
  {
    id: "2",
    name: "docker-compose.yml",
    modified: "Modified yesterday",
    starred: false,
    badge: { text: "Docker", color: "#7C3AED", bg: "#F5F0FF" },
  },
  {
    id: "3",
    name: "cloud-deploy.yml",
    modified: "Modified 1 day ago",
    starred: false,
    icon: "☁",
  },
];

const stats = [
  { value: "12", label: "Saved Configs" },
  { value: "47", label: "Total Exports" },
  { value: "3", label: "Starred", highlight: true },
  { value: "89%", label: "Success Rate" },
];

export default function VaultPage() {
  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          title="Configuration Vault"
          subtitle="Your saved configurations and export history."
        />

        {/* Stats */}
        <div className="flex gap-3 px-10 py-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex-1 flex flex-col gap-1 p-4 rounded-md border ${
                stat.highlight
                  ? "bg-[#F0FAFA] border-[#0D6E6E]"
                  : "bg-white border-[#E5E5E5]"
              }`}
            >
              <span
                className={`font-[family-name:var(--font-jetbrains)] text-[32px] font-semibold ${
                  stat.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"
                }`}
              >
                {stat.value}
              </span>
              <span
                className={`text-xs ${
                  stat.highlight ? "text-[#0D6E6E]" : "text-[#888888]"
                }`}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Config List */}
        <div className="flex-1 px-10 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A]">
              Recent Configurations
            </h2>
            <span className="text-xs text-[#888888]">Sort by: Date ▾</span>
          </div>

          <div className="flex flex-col gap-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 bg-white rounded-md border border-[#E5E5E5]"
              >
                <div className="flex items-center gap-4">
                  {config.starred ? (
                    <span className="text-[#E6B800]">★</span>
                  ) : config.icon ? (
                    <div className="w-9 h-9 bg-[#F5F5F5] rounded-md flex items-center justify-center text-[#666666]">
                      {config.icon}
                    </div>
                  ) : (
                    <span className="text-[#CCCCCC]">☆</span>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="font-[family-name:var(--font-jetbrains)] text-sm font-medium text-[#1A1A1A]">
                      {config.name}
                    </span>
                    <span className="text-xs text-[#888888]">
                      {config.modified}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {config.badge ? (
                    <span
                      className="text-[11px] font-medium px-2 py-1 rounded"
                      style={{
                        color: config.badge.color,
                        backgroundColor: config.badge.bg,
                      }}
                    >
                      {config.badge.text}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#888888] font-medium">
                      Draft
                    </span>
                  )}
                  <button className="text-[13px] font-medium text-[#0D6E6E] hover:underline">
                    Export →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
