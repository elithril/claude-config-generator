"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setVisible(false);
      const timer = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div
      className={`transition-opacity duration-150 ease-in-out ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ minHeight: "100%" }}
    >
      {children}
    </div>
  );
}
