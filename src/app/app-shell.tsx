"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";

const NO_SIDEBAR_ROUTES = ["/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);
  const prevPath = useRef(pathname);
  const [sidebarEnter, setSidebarEnter] = useState(false);

  useEffect(() => {
    if (prevPath.current === "/" && pathname !== "/") {
      setSidebarEnter(true);
      const timer = setTimeout(() => setSidebarEnter(false), 500);
      return () => clearTimeout(timer);
    }
    prevPath.current = pathname;
  }, [pathname]);

  if (!showSidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <PageTransition>{children}</PageTransition>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
        <div
          className={sidebarEnter ? "animate-sidebar-enter" : ""}
        >
          <Sidebar />
        </div>
        <main className="flex-1 min-h-0 min-w-0 flex flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </ErrorBoundary>
  );
}
