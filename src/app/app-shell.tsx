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

  // During morph phases, show the morphing panel overlay
  const isMorphing = phase === "morph" || phase === "morph-back";
  const isHeroExiting = phase === "hero-out";
  const isAppEntering = phase === "app-in";
  const isAppExiting = phase === "app-out";
  const isHeroEntering = phase === "hero-in";

  return (
    <ErrorBoundary>
      {/* Morphing dark panel — visible only during morph phases */}
      {isMorphing && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          aria-hidden="true"
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              backgroundColor: "#1A1A1A",
              width: phase === "morph" ? "260px" : "40%",
              transition: `width 500ms cubic-bezier(0.65, 0, 0.35, 1)`,
              // Start from the opposite width
              ...(phase === "morph" ? { animation: "morph-shrink 500ms cubic-bezier(0.65, 0, 0.35, 1) forwards" } : {}),
              ...(phase === "morph-back" ? { animation: "morph-expand 500ms cubic-bezier(0.65, 0, 0.35, 1) forwards" } : {}),
            }}
          />
        </div>
      )}

      {isHero ? (
        // Hero layout
        <div className="h-screen overflow-hidden flex flex-col">
          <div
            className="flex-1 flex flex-col min-h-0"
            style={{
              ...(isHeroExiting ? {
                opacity: 0,
                transition: "opacity 350ms ease-out",
              } : isHeroEntering ? {
                animation: "fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
              } : isMorphing ? {
                opacity: 0,
              } : {}),
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        // App layout
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
          <div
            style={{
              ...(isAppEntering ? {
                animation: "sidebar-text-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both 50ms",
              } : isAppExiting ? {
                opacity: 0,
                transition: "opacity 250ms ease-out",
              } : isMorphing ? {
                opacity: 0,
              } : {}),
            }}
          >
            <Sidebar />
          </div>
          <main
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            style={{
              ...(isAppEntering ? {
                animation: "content-slide-in 450ms cubic-bezier(0.16, 1, 0.3, 1) both 150ms",
              } : isAppExiting ? {
                opacity: 0,
                transition: "opacity 300ms ease-out",
              } : isMorphing ? {
                opacity: 0,
              } : {}),
            }}
          >
            {children}
          </main>
        </div>
      )}
    </ErrorBoundary>
  );
}
