"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";

const NO_SIDEBAR_ROUTES = ["/"];

type TransitionPhase = "idle" | "hero-exit" | "app-enter" | "app-exit" | "hero-enter";

const PHASE_DURATION = {
  "hero-exit": 400,
  "app-enter": 500,
  "app-exit": 300,
  "hero-enter": 500,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [displayedChildren, setDisplayedChildren] = useState<ReactNode>(children);
  const [showSidebar, setShowSidebar] = useState(!NO_SIDEBAR_ROUTES.includes(pathname));
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (pathname === prevPath.current) {
      setDisplayedChildren(children);
      return;
    }

    const wasHero = NO_SIDEBAR_ROUTES.includes(prevPath.current);
    const goingToHero = NO_SIDEBAR_ROUTES.includes(pathname);
    prevPath.current = pathname;

    clearTimeout(timerRef.current);

    if (wasHero && !goingToHero) {
      // Hero → App
      setPhase("hero-exit");
      timerRef.current = setTimeout(() => {
        setDisplayedChildren(children);
        setShowSidebar(true);
        setPhase("app-enter");
        timerRef.current = setTimeout(() => setPhase("idle"), PHASE_DURATION["app-enter"]);
      }, PHASE_DURATION["hero-exit"]);
    } else if (!wasHero && goingToHero) {
      // App → Hero
      setPhase("app-exit");
      timerRef.current = setTimeout(() => {
        setDisplayedChildren(children);
        setShowSidebar(false);
        setPhase("hero-enter");
        timerRef.current = setTimeout(() => setPhase("idle"), PHASE_DURATION["hero-enter"]);
      }, PHASE_DURATION["app-exit"]);
    } else {
      // App → App (simple swap)
      setDisplayedChildren(children);
    }

    return () => clearTimeout(timerRef.current);
  }, [pathname, children]);

  if (!showSidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <div className={getHeroClass(phase)}>
            {displayedChildren}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
        <div className={getSidebarClass(phase)}>
          <Sidebar />
        </div>
        <main className={getMainClass(phase)}>
          {displayedChildren}
        </main>
      </div>
    </ErrorBoundary>
  );
}

function getHeroClass(phase: TransitionPhase): string {
  const base = "flex-1 flex flex-col min-h-0 will-change-transform";
  switch (phase) {
    case "hero-exit":
      return `${base} hero-exit`;
    case "hero-enter":
      return `${base} hero-enter`;
    default:
      return `${base}`;
  }
}

function getSidebarClass(phase: TransitionPhase): string {
  switch (phase) {
    case "app-enter":
      return "sidebar-enter";
    case "app-exit":
      return "sidebar-exit";
    default:
      return "";
  }
}

function getMainClass(phase: TransitionPhase): string {
  const base = "flex-1 min-h-0 min-w-0 flex flex-col will-change-transform";
  switch (phase) {
    case "app-enter":
      return `${base} main-enter`;
    case "app-exit":
      return `${base} main-exit`;
    default:
      return base;
  }
}
