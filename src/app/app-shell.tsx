"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import PageTransition from "@/components/PageTransition";

const NO_SIDEBAR_ROUTES = ["/", "/test", "/test2"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);

  if (!showSidebar) {
    return (
      <div className="h-screen overflow-hidden flex flex-col">
        <PageTransition>{children}</PageTransition>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
      <Sidebar />
      <main className="flex-1 min-h-0 min-w-0 flex flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
