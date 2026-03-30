"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

interface TransitionContextType {
  navigateTo: (href: string) => void;
  overlayVisible: boolean;
  overlayPhase: "none" | "covering" | "revealing";
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
  overlayVisible: false,
  overlayPhase: "none",
});

const COVER_DURATION = 500;
const REVEAL_DURATION = 600;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [overlayPhase, setOverlayPhase] = useState<"none" | "covering" | "revealing">("none");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busy = useRef(false);

  const navigateTo = useCallback((href: string) => {
    if (href === pathname || busy.current) return;

    const isHeroNav = NO_SIDEBAR_ROUTES.includes(pathname) !== NO_SIDEBAR_ROUTES.includes(href);

    if (!isHeroNav) {
      // App↔App: just navigate, no fancy transition
      router.push(href);
      return;
    }

    // Hero↔App: overlay transition
    busy.current = true;
    setOverlayPhase("covering");

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Overlay is fully covering — navigate now (invisible to user)
      router.push(href);

      // Wait a tick for the new page to render behind the overlay
      setTimeout(() => {
        setOverlayPhase("revealing");

        timerRef.current = setTimeout(() => {
          setOverlayPhase("none");
          busy.current = false;
        }, REVEAL_DURATION);
      }, 100);
    }, COVER_DURATION);
  }, [pathname, router]);

  return (
    <TransitionContext.Provider value={{ navigateTo, overlayVisible: overlayPhase !== "none", overlayPhase }}>
      {children}
      {/* Transition overlay */}
      {overlayPhase !== "none" && (
        <div
          className={`fixed inset-0 z-[100] pointer-events-none ${
            overlayPhase === "covering" ? "overlay-cover" : "overlay-reveal"
          }`}
          style={{ backgroundColor: "#1A1A1A" }}
        />
      )}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
