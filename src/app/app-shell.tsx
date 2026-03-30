"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTransition } from "@/context/TransitionContext";

const NO_SIDEBAR_ROUTES = ["/"];

const ENTER_DURATION = 600;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { phase, onEnterDone } = useTransition();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);
  const [enterReady, setEnterReady] = useState(false);
  const prevPhase = useRef(phase);

  // When phase switches to "entering" (new page just mounted), wait for paint then animate in
  useEffect(() => {
    if (phase === "entering" && prevPhase.current !== "entering") {
      setEnterReady(false);
      // Double rAF: ensure browser has painted at opacity:0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnterReady(true);
          setTimeout(onEnterDone, ENTER_DURATION);
        });
      });
    }
    prevPhase.current = phase;
  }, [phase, onEnterDone]);

  // Reset enterReady when going idle
  useEffect(() => {
    if (phase === "idle") setEnterReady(false);
  }, [phase]);

  // Determine styles
  const isExiting = phase === "exiting";
  const isEnteringHidden = phase === "entering" && !enterReady;
  const isEnteringVisible = phase === "entering" && enterReady;

  if (!showSidebar) {
    // Hero layout
    return (
      <ErrorBoundary>
        <div className="h-screen overflow-hidden flex flex-col">
          <div
            className="flex-1 flex flex-col min-h-0"
            style={{
              ...(isExiting ? {
                opacity: 0,
                transform: "scale(0.96)",
                transition: `opacity 500ms ease-in, transform 500ms ease-in`,
              } : isEnteringHidden ? {
                opacity: 0,
                transform: "scale(1.02)",
              } : isEnteringVisible ? {
                opacity: 1,
                transform: "scale(1)",
                transition: `opacity ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              } : {}),
            }}
          >
            {children}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // App layout with sidebar
  return (
    <ErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
        <div
          style={{
            ...(isExiting ? {
              opacity: 0,
              transform: "translateX(-30px)",
              transition: `opacity 400ms ease-in, transform 400ms ease-in`,
            } : isEnteringHidden ? {
              opacity: 0,
              transform: "translateX(-30px)",
            } : isEnteringVisible ? {
              opacity: 1,
              transform: "translateX(0)",
              transition: `opacity ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            } : {}),
          }}
        >
          <Sidebar />
        </div>
        <main
          className="flex-1 min-h-0 min-w-0 flex flex-col"
          style={{
            ...(isExiting ? {
              opacity: 0,
              transform: "translateY(16px)",
              transition: `opacity 400ms ease-in, transform 400ms ease-in`,
            } : isEnteringHidden ? {
              opacity: 0,
              transform: "translateY(20px)",
            } : isEnteringVisible ? {
              opacity: 1,
              transform: "translateY(0)",
              transition: `opacity ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) 100ms, transform ${ENTER_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1) 100ms`,
            } : {}),
          }}
        >
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
