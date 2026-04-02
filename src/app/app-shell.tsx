"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import { VT } from "@/components/VT";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";

const NO_SIDEBAR_ROUTES = ["/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);

  // Single tree — Sidebar stays mounted across navigations (no mount/unmount blink).
  // On hero: aside hidden everywhere, mobile nav invisible (exists in DOM for VT).
  return (
    <ErrorBoundary>
      <div className={showSidebar ? "flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]" : "h-screen overflow-hidden flex flex-col"}>
        <Sidebar hidden={!showSidebar} />
        {showSidebar ? (
          <VT name="page-content">
            <main className="flex-1 min-h-0 min-w-0 flex flex-col">
              <PageTransition>{children}</PageTransition>
            </main>
          </VT>
        ) : (
          <PageTransition>{children}</PageTransition>
        )}
      </div>
    </ErrorBoundary>
  );
}
