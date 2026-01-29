"use client";

import { useState } from "react";
import { Layout, PageHeader } from "@/components";

interface Template {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  uses: string;
  popular?: boolean;
}

const templates: Template[] = [
  {
    id: "1",
    icon: "⚙",
    iconBg: "#F0FAFA",
    iconColor: "#0D6E6E",
    title: "Node.js Backend",
    description:
      "Production-ready Node.js configuration with ESLint, Prettier, and TypeScript.",
    uses: "2.4k uses",
    popular: true,
  },
  {
    id: "2",
    icon: "◈",
    iconBg: "#FFF5F0",
    iconColor: "#E65C00",
    title: "React Frontend",
    description:
      "Modern React setup with Vite, TailwindCSS, and testing utilities.",
    uses: "1.8k uses",
  },
  {
    id: "3",
    icon: "⬡",
    iconBg: "#F5F0FF",
    iconColor: "#7C3AED",
    title: "Docker Compose",
    description:
      "Multi-container Docker setup for microservices architecture.",
    uses: "956 uses",
  },
  {
    id: "4",
    icon: "⚡",
    iconBg: "#FFF5F0",
    iconColor: "#E07B54",
    title: "Python FastAPI",
    description:
      "High-performance Python API with async support and auto-documentation.",
    uses: "1.2k uses",
  },
  {
    id: "5",
    icon: "☁",
    iconBg: "#F0F0F0",
    iconColor: "#666666",
    title: "AWS Lambda",
    description:
      "Serverless functions with proper IAM roles and deployment scripts.",
    uses: "780 uses",
  },
  {
    id: "6",
    icon: "🔒",
    iconBg: "#F0FAFA",
    iconColor: "#0D6E6E",
    title: "Security Hardened",
    description:
      "Maximum security configuration with strict permissions and auditing.",
    uses: "540 uses",
  },
];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          title="Template Library"
          subtitle="Browse and use pre-built configuration templates."
        />

        {/* Search Bar */}
        <div className="flex items-center gap-4 px-10 py-4">
          <div className="flex-1 flex items-center gap-2.5 bg-white border border-[#E5E5E5] rounded px-4 py-3">
            <span className="text-[#888888]">⌕</span>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#AAAAAA] outline-none bg-transparent"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-[#E5E5E5] rounded px-4 py-3">
            <span className="text-sm text-[#666666]">{selectedCategory}</span>
            <span className="text-xs text-[#888888]">▾</span>
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 px-10 py-6 overflow-auto">
          <div className="grid grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-4 p-6 bg-white rounded-md border border-[#E5E5E5] h-[220px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{
                      backgroundColor: template.iconBg,
                      color: template.iconColor,
                    }}
                  >
                    {template.icon}
                  </div>
                  {template.popular && (
                    <span className="text-[10px] font-semibold text-[#0D6E6E] bg-[#F0FAFA] px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-[family-name:var(--font-newsreader)] text-lg font-medium text-[#1A1A1A]">
                  {template.title}
                </h3>
                <p className="text-[13px] text-[#666666] leading-[1.5] flex-1">
                  {template.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#888888]">
                    {template.uses}
                  </span>
                  <button className="text-[13px] font-medium text-[#0D6E6E] hover:underline">
                    Use →
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
