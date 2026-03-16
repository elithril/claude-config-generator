"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(0);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setAnimKey((k) => k + 1);
    }
  }, [pathname]);

  return (
    <div key={animKey} className="animate-page-enter" style={{ minHeight: "100%" }}>
      {children}
    </div>
  );
}
