"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTransition } from "@/context/TransitionContext";

const NO_SIDEBAR_ROUTES = ["/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { phase } = useTransition();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);

  if (!showSidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <div className={`flex-1 flex flex-col min-h-0 ${
            phase === "hero-exit" ? "hero-exit" :
            phase === "hero-enter" ? "hero-enter" : ""
          }`}>
            {children}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
        <div className={
          phase === "app-enter" ? "sidebar-enter" :
          phase === "app-exit" ? "sidebar-exit" : ""
        }>
          <Sidebar />
        </div>
        <main className={`flex-1 min-h-0 min-w-0 flex flex-col ${
          phase === "app-enter" ? "main-enter" :
          phase === "app-exit" ? "main-exit" : ""
        }`}>
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
