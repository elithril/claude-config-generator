"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";
import { ToastProvider } from "@/context/ToastContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
