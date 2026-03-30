"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/i18n";
import { useConfig } from "@/context/ConfigContext";
import Modal from "./Modal";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useConfig();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const navItems = [
    { name: t("sidebar.wizard"), href: "/wizard" },
    { name: t("sidebar.expert"), href: "/expert" },
    { name: t("sidebar.vault"), href: "/vault" },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  const handleNav = (e: React.MouseEvent, href: string) => {
    if (hasUnsavedChanges && !pathname.startsWith(href)) {
      e.preventDefault();
      setPendingHref(href);
    }
  };

  const confirmLeave = () => {
    setHasUnsavedChanges(false);
    const href = pendingHref;
    setPendingHref(null);
    if (href) router.push(href);
  };

  const cancelLeave = () => {
    setPendingHref(null);
  };

  const navLink = (item: { name: string; href: string }, className: string) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={(e) => handleNav(e, item.href)}
      aria-current={isActive(item.href) ? "page" : undefined}
      className={className}
    >
      {item.name}
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] h-screen bg-[#1A1A1A] border-r border-[#2D2D2D] flex-col py-6 px-5 flex-shrink-0">
        <div className="flex flex-col gap-8">
          <Link href="/" onClick={(e) => handleNav(e, "/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-white">
              Claude Config
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6E6E]" />
          </Link>

          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {navItems.map((item) =>
              navLink(
                item,
                `px-3.5 py-3 rounded text-[14px] transition-colors ${
                  isActive(item.href)
                    ? "text-[#0D6E6E] font-medium bg-[#ffffff0a]"
                    : "text-[#888888] hover:text-[#AAAAAA]"
                }`
              )
            )}
          </nav>
        </div>

        <div className="flex flex-col gap-3 mt-auto">
          <LanguageSwitcher variant="dark" />
          <div className="flex items-center gap-3">
            <a
              href="https://code.claude.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#666666] text-[12px] hover:text-[#AAAAAA] transition-colors"
            >
              {t("sidebar.docs")}
            </a>
            <span className="text-[#333333]">·</span>
            <a
              href="https://github.com/elithril/claude-config-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#666666] hover:text-[#AAAAAA] transition-colors"
              aria-label="GitHub"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
          <span className="font-[family-name:var(--font-jetbrains)] text-[10px] text-[#444444]">
            v1.0.0
          </span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-[#2D2D2D] flex items-center justify-around py-2 px-1" aria-label="Mobile navigation">
        {navItems.map((item) =>
          navLink(
            item,
            `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-[11px] ${
              isActive(item.href)
                ? "text-[#0D6E6E] font-medium"
                : "text-[#888888]"
            }`
          )
        )}
        <LanguageSwitcher variant="dark" />
      </nav>

      {/* Unsaved changes modal */}
      <Modal open={!!pendingHref} onClose={cancelLeave} title={t("modal.unsavedTitle")}>
        <p className="text-sm text-[#666666] mb-6">{t("modal.unsavedMessage")}</p>
        <div className="flex justify-end gap-3">
          <button onClick={confirmLeave} className="px-4 py-2 text-sm text-[#888888] hover:text-[#1A1A1A] cursor-pointer">
            {t("modal.unsavedLeave")}
          </button>
          <button onClick={cancelLeave} className="px-4 py-2 text-sm bg-[#0D6E6E] text-white rounded hover:bg-[#0A5555] cursor-pointer">
            {t("modal.unsavedStay")}
          </button>
        </div>
      </Modal>
    </>
  );
}
