"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

// hero→app: hero-out → morph → app-in → idle
// app→hero: app-out → morph-back → hero-in → idle
type Phase =
  | "idle"
  | "hero-out"     // hero content fades out
  | "morph"        // panel shrinks 40%→260px, navigation happens mid-way
  | "app-in"       // sidebar text + main content enter
  | "app-out"      // main content + sidebar text fade out
  | "morph-back"   // panel expands 260px→40%, navigation happens mid-way
  | "hero-in";     // hero content fades in

const TIMING = {
  "hero-out": 350,
  "morph": 500,
  "app-in": 450,
  "app-out": 300,
  "morph-back": 500,
  "hero-in": 400,
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
  const busy = useRef(false);

  const chain = (steps: [Phase, number][]) => {
    let delay = 0;
    for (const [p, d] of steps) {
      const capturedDelay = delay;
      setTimeout(() => setPhase(p), capturedDelay);
      delay += d;
    }
    setTimeout(() => {
      setPhase("idle");
      busy.current = false;
    }, delay);
  };

  const navigateTo = useCallback((href: string) => {
    if (href === pathname || busy.current) return;

    const isHeroNav = NO_SIDEBAR_ROUTES.includes(pathname) !== NO_SIDEBAR_ROUTES.includes(href);
    if (!isHeroNav) {
      router.push(href);
      return;
    }

    busy.current = true;
    clearTimeout(timerRef.current);

    const goingToApp = NO_SIDEBAR_ROUTES.includes(pathname);

    if (goingToApp) {
      // Hero → App
      setPhase("hero-out");
      setTimeout(() => {
        setPhase("morph");
        // Navigate mid-morph (panel covers everything)
        setTimeout(() => router.push(href), TIMING["morph"] * 0.5);
        setTimeout(() => {
          setPhase("app-in");
          setTimeout(() => {
            setPhase("idle");
            busy.current = false;
          }, TIMING["app-in"]);
        }, TIMING["morph"]);
      }, TIMING["hero-out"]);
    } else {
      // App → Hero
      setPhase("app-out");
      setTimeout(() => {
        setPhase("morph-back");
        setTimeout(() => router.push(href), TIMING["morph-back"] * 0.5);
        setTimeout(() => {
          setPhase("hero-in");
          setTimeout(() => {
            setPhase("idle");
            busy.current = false;
          }, TIMING["hero-in"]);
        }, TIMING["morph-back"]);
      }, TIMING["app-out"]);
    }
  }, [pathname, router]);

  return (
    <TransitionContext.Provider value={{ phase, navigateTo }}>
      {children}
    </TransitionContext.Provider>
  );
}

export const TRANSITION_TIMING = TIMING;

export function useTransition() {
  return useContext(TransitionContext);
}
