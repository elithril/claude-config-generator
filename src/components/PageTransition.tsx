"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [visible, setVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      // Fade out
      setVisible(false);
      const timer = setTimeout(() => {
        // Swap content while hidden, then fade in
        setDisplayChildren(children);
        setVisible(true);
      }, 120);
      return () => clearTimeout(timer);
    } else {
      // Same page, just update children (state changes within page)
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`transition-opacity duration-150 ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ minHeight: "100%" }}
    >
      {displayChildren}
    </div>
  );
}
