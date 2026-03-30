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

  // Dark morph panel: fixed overlay that bridges hero↔sidebar
  // hero-out/morph: visible at 100vw, shrinks to 260px
  // app-out/morph-back: visible at 260px, expands to 100vw
  const showMorphPanel =
    phase === "hero-out" || phase === "morph" ||
    phase === "app-out" || phase === "morph-back";

  let morphWidth = "100vw";
  if (phase === "morph") morphWidth = "260px";
  else if (phase === "app-out") morphWidth = "260px";
  else if (phase === "morph-back") morphWidth = "100vw";
  // hero-out stays at 100vw

  const morphTransition = (phase === "morph" || phase === "morph-back")
    ? "width 500ms cubic-bezier(0.65, 0, 0.35, 1)"
    : "none";

  // Content animations
  const contentStyle = (): React.CSSProperties => {
    switch (phase) {
      case "hero-out":
        return { opacity: 0, transition: "opacity 350ms ease-out" };
      case "app-out":
        return { opacity: 0, transition: "opacity 300ms ease-out" };
      case "morph":
      case "morph-back":
        return { opacity: 0 };
      case "app-in":
        return { animation: "content-slide-in 450ms cubic-bezier(0.16, 1, 0.3, 1) both" };
      case "hero-in":
        return { animation: "fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both" };
      default:
        return {};
    }
  };

  // Sidebar text animation
  const sidebarStyle = (): React.CSSProperties => {
    switch (phase) {
      case "app-in":
        return { animation: "sidebar-text-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both" };
      case "app-out":
        return { opacity: 0, transition: "opacity 250ms ease-out" };
      default:
        return {};
    }
  };

  return (
    <ErrorBoundary>
      {/* Morph panel overlay */}
      {showMorphPanel && (
        <div
          className="fixed top-0 left-0 bottom-0 z-50 bg-[#1A1A1A]"
          style={{ width: morphWidth, transition: morphTransition }}
          aria-hidden="true"
        />
      )}

      {isHero ? (
        <div className="h-screen overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col min-h-0" style={contentStyle()}>
            {children}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
          <div style={sidebarStyle()}>
            <Sidebar />
          </div>
          <main className="flex-1 min-h-0 min-w-0 flex flex-col" style={contentStyle()}>
            {children}
          </main>
        </div>
      )}
    </ErrorBoundary>
  );
}
