"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ConfigProvider>
  );
}
