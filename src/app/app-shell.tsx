"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";

const NO_SIDEBAR_ROUTES = ["/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);

  if (!showSidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          {children}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
        <Sidebar />
        <main className="flex-1 min-h-0 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
