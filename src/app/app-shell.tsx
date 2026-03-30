"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";

const NO_SIDEBAR_ROUTES = ["/"];

type Phase = "idle" | "hero-exit" | "app-enter" | "app-exit" | "hero-enter";

const TIMING = {
  "hero-exit": 600,
  "app-enter": 700,
  "app-exit": 500,
  "hero-enter": 700,
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [frozen, setFrozen] = useState<ReactNode>(children);
  const [sidebar, setSidebar] = useState(!NO_SIDEBAR_ROUTES.includes(pathname));
  const prevPathRef = useRef(pathname);
  const pendingRef = useRef<ReactNode>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isTransitioning = useRef(false);

  // Detect hero↔app navigation and manage phases
  useEffect(() => {
    if (pathname === prevPathRef.current) {
      // Same path — update content if not mid-transition
      if (!isTransitioning.current) setFrozen(children);
      return;
    }

    const wasHero = NO_SIDEBAR_ROUTES.includes(prevPathRef.current);
    const goingToHero = NO_SIDEBAR_ROUTES.includes(pathname);
    prevPathRef.current = pathname;

    if (wasHero === goingToHero) {
      // App↔App or Hero↔Hero: instant swap
      setFrozen(children);
      return;
    }

    // Hero↔App: start transition
    isTransitioning.current = true;
    pendingRef.current = children;

    const exitPhase: Phase = wasHero ? "hero-exit" : "app-exit";
    const enterPhase: Phase = wasHero ? "app-enter" : "hero-enter";
    const showSidebarNext = wasHero;

    setPhase(exitPhase);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Exit done → swap content + switch layout + start enter
      setFrozen(pendingRef.current);
      setSidebar(showSidebarNext);
      setPhase(enterPhase);

      timerRef.current = setTimeout(() => {
        setPhase("idle");
        isTransitioning.current = false;
      }, TIMING[enterPhase]);
    }, TIMING[exitPhase]);

    return () => clearTimeout(timerRef.current);
  }, [pathname, children]);

  // Inline style to prevent flash: hide content instantly when children
  // change but frozen hasn't updated yet (between render and effect)
  const isHeroTransition = phase !== "idle";
  const hideFlash = isTransitioning.current && !isHeroTransition
    ? { opacity: 0 } as React.CSSProperties
    : undefined;

  if (!sidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <div
            className={`flex-1 flex flex-col min-h-0 ${
              phase === "hero-exit" ? "hero-exit" :
              phase === "hero-enter" ? "hero-enter" : ""
            }`}
            style={hideFlash}
          >
            {frozen}
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
        <main
          className={`flex-1 min-h-0 min-w-0 flex flex-col ${
            phase === "app-enter" ? "main-enter" :
            phase === "app-exit" ? "main-exit" : ""
          }`}
          style={hideFlash}
        >
          {frozen}
        </main>
      </div>
    </ErrorBoundary>
  );
}
