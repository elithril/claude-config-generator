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
      className={className}
    >
      {item.name}
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] h-screen bg-[#1A1A1A] border-r border-[#2D2D2D] flex-col justify-between py-6 px-5 flex-shrink-0">
        <div className="flex flex-col gap-8">
          <Link href="/" onClick={(e) => handleNav(e, "/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-white">
              Claude Config
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6E6E]" />
          </Link>

          <nav className="flex flex-col gap-1">
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

        <div className="flex flex-col gap-3">
          <LanguageSwitcher variant="dark" />
          <a
            href="https://code.claude.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#888888] text-[13px] hover:text-[#AAAAAA] transition-colors"
          >
            {t("sidebar.docs")}
          </a>
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#666666]">
            v1.0.0
          </span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-[#2D2D2D] flex items-center justify-around py-2 px-1">
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
