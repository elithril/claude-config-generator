"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Layout, PageHeader } from "@/components";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/context/ToastContext";
import { TEMPLATES } from "@/data/templates";

export default function LibraryPage() {
  const router = useRouter();
  const { dispatch } = useConfig();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = new Set(TEMPLATES.map((t) => t.category));
    return ["All", ...Array.from(cats).sort()];
  }, []);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleUseTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    dispatch({ type: "LOAD_TEMPLATE", config: template.config });
    addToast(`Template "${template.title}" charge`);
    router.push("/expert");
  };

  const formatUses = (uses: number) => {
    if (uses >= 1000) return `${(uses / 1000).toFixed(1)}k uses`;
    return `${uses} uses`;
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
        <PageHeader
          breadcrumb="TEMPLATES / ALL"
          title="Template Library"
          subtitle="Parcourez et utilisez des templates de configuration pre-configures."
        />

        {/* Search Bar */}
        <div className="flex items-center gap-4 px-10 py-4">
          <div className="flex-1 flex items-center gap-2.5 bg-white border border-[#E5E5E5] rounded px-4 py-3">
            <span className="text-[#888888]">⌕</span>
            <input
              type="text"
              placeholder="Rechercher des templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm text-[#1A1A1A] placeholder:text-[#AAAAAA] outline-none bg-transparent"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-[#E5E5E5] rounded px-4 py-3 pr-8 text-sm text-[#666666] cursor-pointer outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888888] pointer-events-none">▾</span>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 px-10 py-6 overflow-auto">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#888888] text-sm">Aucun template ne correspond a votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-4 p-6 bg-white rounded-md border border-[#E5E5E5] h-[220px] hover:border-[#0D6E6E] transition-colors"
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
                    <div className="flex items-center gap-2">
                      {template.popular && (
                        <span className="text-[10px] font-semibold text-[#0D6E6E] bg-[#F0FAFA] px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <span className="text-[10px] text-[#888888] bg-[#F5F5F5] px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                    </div>
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
                      {formatUses(template.uses)}
                    </span>
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="text-[13px] font-medium text-[#0D6E6E] hover:underline"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
