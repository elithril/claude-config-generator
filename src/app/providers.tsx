"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";
import { ToastProvider } from "@/context/ToastContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ToastProvider>
          <PageTransition>{children}</PageTransition>
        </ToastProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
