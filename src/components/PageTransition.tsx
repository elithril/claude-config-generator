"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [opacity, setOpacity] = useState(1);
  const mountFrame = useRef(0);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      // Start invisible, wait for mount effects to settle, then fade in
      setOpacity(0);
      // Cancel any pending frame
      cancelAnimationFrame(mountFrame.current);
      // Wait 2 frames for React to finish mount + effects
      mountFrame.current = requestAnimationFrame(() => {
        mountFrame.current = requestAnimationFrame(() => {
          setOpacity(1);
        });
      });
    }
    return () => cancelAnimationFrame(mountFrame.current);
  }, [pathname]);

  return (
    <div
      style={{
        opacity,
        transition: opacity === 1 ? "opacity 200ms ease-in" : "none",
        minHeight: "100%",
      }}
    >
      {children}
    </div>
  );
}
