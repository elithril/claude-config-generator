"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

type Phase = "idle" | "exiting" | "entering";

interface TransitionContextType {
  phase: Phase;
  navigateTo: (href: string) => void;
  onEnterDone: () => void;
}

const TransitionContext = createContext<TransitionContextType>({
  phase: "idle",
  navigateTo: () => {},
  onEnterDone: () => {},
});

const EXIT_DURATION = 500;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busy = useRef(false);

  const navigateTo = useCallback((href: string) => {
    if (href === pathname || busy.current) return;

    const isHeroNav = NO_SIDEBAR_ROUTES.includes(pathname) !== NO_SIDEBAR_ROUTES.includes(href);

    if (!isHeroNav) {
      router.push(href);
      return;
    }

    // Hero↔App: animate exit, then navigate
    busy.current = true;
    setPhase("exiting");

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Set entering BEFORE push — new page will mount at opacity:0
      setPhase("entering");
      router.push(href);
    }, EXIT_DURATION);
  }, [pathname, router]);

  const onEnterDone = useCallback(() => {
    setPhase("idle");
    busy.current = false;
  }, []);

  return (
    <TransitionContext.Provider value={{ phase, navigateTo, onEnterDone }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
