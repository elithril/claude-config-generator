"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { name: "Wizard", href: "/wizard" },
  { name: "Expert", href: "/expert" },
  { name: "Vault", href: "/vault" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] h-screen bg-[#1A1A1A] border-r border-[#2D2D2D] flex-col justify-between py-6 px-5 flex-shrink-0">
        <div className="flex flex-col gap-8">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <span className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-white">
              Claude Config
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6E6E]" />
          </Link>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3.5 py-3 rounded text-[14px] transition-colors ${
                  isActive(item.href)
                    ? "text-[#0D6E6E] font-medium bg-[#ffffff0a]"
                    : "text-[#888888] hover:text-[#AAAAAA]"
                }`}
              >
                {item.name}
              </Link>
            ))}
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
            Documentation →
          </a>
          <span className="font-[family-name:var(--font-jetbrains)] text-[11px] text-[#666666]">
            v1.0.0
          </span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-[#2D2D2D] flex justify-around py-2 px-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-[11px] ${
              isActive(item.href)
                ? "text-[#0D6E6E] font-medium"
                : "text-[#888888]"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  );
}
