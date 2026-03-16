"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"visible" | "fade-out" | "fade-in">("visible");
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // First render or same path — no transition needed
    if (prevPathname.current === pathname) {
      setDisplayChildren(children);
      return;
    }

    // New path — start fade-out
    prevPathname.current = pathname;
    setStage("fade-out");

    const fadeOutTimer = setTimeout(() => {
      // Swap content while invisible
      setDisplayChildren(children);
      setStage("fade-in");

      const fadeInTimer = setTimeout(() => {
        setStage("visible");
      }, 250);

      return () => clearTimeout(fadeInTimer);
    }, 150);

    return () => clearTimeout(fadeOutTimer);
  }, [pathname, children]);

  // Also update children if they change on the same page (e.g. state updates)
  useEffect(() => {
    if (stage === "visible") {
      setDisplayChildren(children);
    }
  }, [children, stage]);

  return (
    <div
      className={`page-transition ${
        stage === "fade-out" ? "page-exit" :
        stage === "fade-in" ? "page-enter" :
        "page-visible"
      }`}
      style={{ minHeight: "100%" }}
    >
      {displayChildren}
    </div>
  );
}
