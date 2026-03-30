"use client";

import { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = ["/"];

interface TransitionContextType {
  navigateTo: (href: string, e?: React.MouseEvent) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
});

const COVER_DURATION = 600;
const REVEAL_DURATION = 500;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [overlay, setOverlay] = useState<{
    phase: "covering" | "revealing";
    cx: number;
    cy: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const busy = useRef(false);

  const navigateTo = useCallback((href: string, e?: React.MouseEvent) => {
    if (href === pathname || busy.current) return;

    const isHeroNav = NO_SIDEBAR_ROUTES.includes(pathname) !== NO_SIDEBAR_ROUTES.includes(href);

    if (!isHeroNav) {
      router.push(href);
      return;
    }

    // Capture click position (fallback to center)
    const cx = e ? e.clientX : window.innerWidth / 2;
    const cy = e ? e.clientY : window.innerHeight / 2;

    busy.current = true;
    setOverlay({ phase: "covering", cx, cy });

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Covered — navigate behind the overlay
      router.push(href);

      setTimeout(() => {
        // Reveal from center
        setOverlay({ phase: "revealing", cx: window.innerWidth / 2, cy: window.innerHeight / 2 });

        timerRef.current = setTimeout(() => {
          setOverlay(null);
          busy.current = false;
        }, REVEAL_DURATION);
      }, 100);
    }, COVER_DURATION);
  }, [pathname, router]);

  // Calculate the radius needed to cover the entire screen from (cx, cy)
  const getMaxRadius = (cx: number, cy: number) => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1920;
    const h = typeof window !== "undefined" ? window.innerHeight : 1080;
    return Math.ceil(Math.sqrt(
      Math.max(cx, w - cx) ** 2 + Math.max(cy, h - cy) ** 2
    ));
  };

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {children}
      {overlay && (
        <div
          className="fixed inset-0 z-[100] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundColor: "#0D6E6E",
            clipPath: overlay.phase === "covering"
              ? undefined  // Animated via CSS
              : undefined,
            ["--cx" as string]: `${overlay.cx}px`,
            ["--cy" as string]: `${overlay.cy}px`,
            ["--r" as string]: `${getMaxRadius(overlay.cx, overlay.cy)}px`,
          }}
        >
          <div
            className={overlay.phase === "covering" ? "circle-cover" : "circle-reveal"}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#0D6E6E",
              ["--cx" as string]: `${overlay.cx}px`,
              ["--cy" as string]: `${overlay.cy}px`,
              ["--r" as string]: `${getMaxRadius(overlay.cx, overlay.cy)}px`,
            }}
          />
        </div>
      )}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
