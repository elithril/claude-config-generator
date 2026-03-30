"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname);
  const [ready, setReady] = useState(true);
  const [fromHero, setFromHero] = useState(false);
  const prevPath = useRef(pathname);
  const frameRef = useRef(0);

  // Detect path change synchronously before paint
  if (pathname !== currentPath) {
    const wasHero = prevPath.current === "/";
    const goingToApp = pathname !== "/";
    setFromHero(wasHero && goingToApp);
    prevPath.current = pathname;
    setCurrentPath(pathname);
    setReady(false);
  }

  useEffect(() => {
    if (!ready) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => {
          setReady(true);
        });
      });
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [ready]);

  const heroTransition: React.CSSProperties = fromHero
    ? {
        opacity: ready ? 1 : 0,
        transform: ready ? "scale(1) translateY(0)" : "scale(0.97) translateY(12px)",
        transition: ready ? "opacity 400ms ease-out, transform 400ms ease-out" : "none",
      }
    : {
        opacity: ready ? 1 : 0,
        transition: ready ? "opacity 180ms ease-in" : "none",
      };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={heroTransition}>
      {children}
    </div>
  );
}
