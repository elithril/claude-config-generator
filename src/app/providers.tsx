"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";
import { ToastProvider } from "@/context/ToastContext";
import { I18nProvider } from "@/i18n";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ConfigProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConfigProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
