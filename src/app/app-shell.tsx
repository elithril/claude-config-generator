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
  const isHero = NO_SIDEBAR_ROUTES.includes(pathname);

  // Panel visible during all transition phases
  const showPanel = phase !== "idle";

  // Panel width: starts full, shrinks for morph, or vice versa
  let panelWidth = "100vw";
  if (phase === "morph") panelWidth = "260px";
  else if (phase === "app-in") panelWidth = "260px";
  else if (phase === "app-out") panelWidth = "260px";
  else if (phase === "morph-back") panelWidth = "100vw";
  else if (phase === "hero-in") panelWidth = "100vw";

  // Only animate width during morph phases
  const panelTransition = (phase === "morph" || phase === "morph-back")
    ? "width 600ms cubic-bezier(0.65, 0, 0.35, 1)"
    : "none";

  // Panel opacity: fade out when entering final phase
  let panelOpacity = 1;
  if (phase === "app-in" || phase === "hero-in") panelOpacity = 0;

  const panelOpacityTransition = (phase === "app-in")
    ? "opacity 300ms ease-out 200ms" // fade after sidebar text starts appearing
    : (phase === "hero-in")
    ? "opacity 300ms ease-out"
    : "none";

  return (
    <ErrorBoundary>
      {/* Morph panel overlay */}
      {showPanel && (
        <div
          className="fixed top-0 left-0 bottom-0 z-50 bg-[#1A1A1A]"
          style={{
            width: panelWidth,
            opacity: panelOpacity,
            transition: [panelTransition, panelOpacityTransition].filter(Boolean).join(", "),
          }}
          aria-hidden="true"
        />
      )}

      {isHero ? (
        <div className="h-screen overflow-hidden flex flex-col">
          <div
            className="flex-1 flex flex-col min-h-0"
            style={phaseStyle(phase, "hero")}
          >
            {children}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
          <div style={phaseStyle(phase, "sidebar")}>
            <Sidebar />
          </div>
          <main
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            style={phaseStyle(phase, "content")}
          >
            {children}
          </main>
        </div>
      )}
    </ErrorBoundary>
  );
}

function phaseStyle(phase: string, element: "hero" | "sidebar" | "content"): React.CSSProperties {
  if (element === "hero") {
    switch (phase) {
      case "hero-out":
        return { opacity: 0, transition: "opacity 400ms ease-out" };
      case "morph":
      case "morph-back":
        return { opacity: 0 };
      case "hero-in":
        return { animation: "fade-in-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both 100ms" };
      default:
        return {};
    }
  }

  if (element === "sidebar") {
    switch (phase) {
      case "app-in":
        return { animation: "sidebar-text-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both 100ms" };
      case "app-out":
        return { opacity: 0, transition: "opacity 300ms ease-out" };
      case "morph":
      case "morph-back":
        return { opacity: 0 };
      default:
        return {};
    }
  }

  // content
  switch (phase) {
    case "app-in":
      return { animation: "content-slide-in 500ms cubic-bezier(0.16, 1, 0.3, 1) both 200ms" };
    case "app-out":
      return { opacity: 0, transition: "opacity 300ms ease-out" };
    case "hero-out":
      return { opacity: 0, transition: "opacity 400ms ease-out" };
    case "morph":
    case "morph-back":
      return { opacity: 0 };
    case "hero-in":
      return { opacity: 0 };
    default:
      return {};
  }
}
