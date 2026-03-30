"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

type Phase = "idle" | "hero-exit" | "app-enter" | "app-exit" | "hero-enter";

const TIMING = {
  "hero-exit": 600,
  "app-enter": 700,
  "app-exit": 500,
  "hero-enter": 700,
};

interface TransitionContextType {
  phase: Phase;
  navigateTo: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  phase: "idle",
  navigateTo: () => {},
});

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isTransitioning = useRef(false);

  const navigateTo = useCallback((href: string) => {
    // Already there or mid-transition
    if (href === pathname || isTransitioning.current) return;

    const isHero = NO_SIDEBAR_ROUTES.includes(pathname);
    const goingToHero = NO_SIDEBAR_ROUTES.includes(href);

    // Same layout type (app↔app): navigate instantly
    if (isHero === goingToHero) {
      router.push(href);
      return;
    }

    // Hero↔App: animate exit FIRST, then navigate
    isTransitioning.current = true;
    const exitPhase: Phase = isHero ? "hero-exit" : "app-exit";
    const enterPhase: Phase = isHero ? "app-enter" : "hero-enter";

    setPhase(exitPhase);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Exit animation done → now actually navigate
      router.push(href);

      // Start enter animation after a tick (new page needs to render)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase(enterPhase);

          timerRef.current = setTimeout(() => {
            setPhase("idle");
            isTransitioning.current = false;
          }, TIMING[enterPhase]);
        });
      });
    }, TIMING[exitPhase]);
  }, [pathname, router]);

  return (
    <TransitionContext.Provider value={{ phase, navigateTo }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
