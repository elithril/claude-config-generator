"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      {children}
    </ConfigProvider>
  );
}
