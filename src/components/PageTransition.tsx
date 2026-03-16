"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname);
  const [ready, setReady] = useState(true);
  const frameRef = useRef(0);

  // Detect path change DURING render (synchronous, before paint)
  // React will re-render before committing to DOM, so browser never sees opacity:1 flash
  if (pathname !== currentPath) {
    setCurrentPath(pathname);
    setReady(false);
  }

  useEffect(() => {
    if (!ready) {
      // Wait for mount effects to settle, then fade in
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => {
          setReady(true);
        });
      });
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [ready]);

  return (
    <div
      style={{
        opacity: ready ? 1 : 0,
        transition: ready ? "opacity 180ms ease-in" : "none",
        minHeight: "100%",
      }}
    >
      {children}
    </div>
  );
}
