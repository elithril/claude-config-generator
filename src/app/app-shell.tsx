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
  const prevPath = useRef(pathname);
  const pending = useRef<ReactNode>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const transitioning = useRef(false);

  // ---- SYNCHRONOUS detection (runs during render, before paint) ----
  if (pathname !== prevPath.current && !transitioning.current) {
    const wasHero = NO_SIDEBAR_ROUTES.includes(prevPath.current);
    const goingToHero = NO_SIDEBAR_ROUTES.includes(pathname);
    prevPath.current = pathname;

    if (wasHero !== goingToHero) {
      // Hero ↔ App transition: freeze current content, store new for later
      transitioning.current = true;
      pending.current = children;
      // Start exit phase — frozen still shows OLD content, no flash
      if (wasHero) {
        setPhase("hero-exit");
      } else {
        setPhase("app-exit");
      }
    } else {
      // App → App: just swap
      setFrozen(children);
    }
  }

  // ---- Timer-driven phase progression ----
  useEffect(() => {
    if (phase === "hero-exit") {
      timer.current = setTimeout(() => {
        setFrozen(pending.current);
        setSidebar(true);
        setPhase("app-enter");
      }, TIMING["hero-exit"]);
    } else if (phase === "app-enter") {
      timer.current = setTimeout(() => {
        setPhase("idle");
        transitioning.current = false;
      }, TIMING["app-enter"]);
    } else if (phase === "app-exit") {
      timer.current = setTimeout(() => {
        setFrozen(pending.current);
        setSidebar(false);
        setPhase("hero-enter");
      }, TIMING["app-exit"]);
    } else if (phase === "hero-enter") {
      timer.current = setTimeout(() => {
        setPhase("idle");
        transitioning.current = false;
      }, TIMING["hero-enter"]);
    }
    return () => clearTimeout(timer.current);
  }, [phase]);

  // Keep frozen in sync when idle and children change (e.g. config updates)
  if (phase === "idle" && !transitioning.current) {
    if (frozen !== children) {
      setFrozen(children);
    }
  }

  // ---- Render ----
  if (!sidebar) {
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <div className={`flex-1 flex flex-col min-h-0 ${
            phase === "hero-exit" ? "hero-exit" :
            phase === "hero-enter" ? "hero-enter" : ""
          }`}>
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
        <main className={`flex-1 min-h-0 min-w-0 flex flex-col ${
          phase === "app-enter" ? "main-enter" :
          phase === "app-exit" ? "main-exit" : ""
        }`}>
          {frozen}
        </main>
      </div>
    </ErrorBoundary>
  );
}
