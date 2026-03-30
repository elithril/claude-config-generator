"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

type Phase =
  | "idle"
  | "hero-out"     // hero content fades out (panel stays at 100vw)
  | "morph"        // panel shrinks 100vw → 260px (new page already loaded behind)
  | "app-in"       // sidebar text + main content animate in
  | "app-out"      // main content + sidebar text fade out
  | "morph-back"   // panel expands 260px → 100vw (new page already loaded behind)
  | "hero-in";     // hero content fades in

const TIMING = {
  "hero-out": 400,
  "morph": 600,
  "app-in": 500,
  "app-out": 350,
  "morph-back": 600,
  "hero-in": 500,
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
  const busy = useRef(false);

  const navigateTo = useCallback((href: string) => {
    if (href === pathname || busy.current) return;

    const isHeroNav = NO_SIDEBAR_ROUTES.includes(pathname) !== NO_SIDEBAR_ROUTES.includes(href);
    if (!isHeroNav) {
      router.push(href);
      return;
    }

    busy.current = true;
    const goingToApp = NO_SIDEBAR_ROUTES.includes(pathname);

    if (goingToApp) {
      // Hero → App
      // 1. Fade out hero content (panel at 100vw covers everything)
      setPhase("hero-out");
      setTimeout(() => {
        // 2. Navigate NOW — panel at 100vw hides everything
        router.push(href);
        // 3. Small delay for React to render new page behind panel
        setTimeout(() => {
          // 4. Shrink panel to reveal new page
          setPhase("morph");
          setTimeout(() => {
            // 5. Panel done shrinking → animate sidebar + content in
            setPhase("app-in");
            setTimeout(() => {
              setPhase("idle");
              busy.current = false;
            }, TIMING["app-in"]);
          }, TIMING["morph"]);
        }, 50);
      }, TIMING["hero-out"]);
    } else {
      // App → Hero
      // 1. Fade out sidebar + content
      setPhase("app-out");
      setTimeout(() => {
        // 2. Expand panel to cover everything
        setPhase("morph-back");
        setTimeout(() => {
          // 3. Panel at 100vw — navigate behind it
          router.push(href);
          setTimeout(() => {
            // 4. Fade in hero content
            setPhase("hero-in");
            setTimeout(() => {
              setPhase("idle");
              busy.current = false;
            }, TIMING["hero-in"]);
          }, 50);
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

export function useTransition() {
  return useContext(TransitionContext);
}
