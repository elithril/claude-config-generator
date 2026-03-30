"use client";

import { ReactNode } from "react";
import { ConfigProvider } from "@/context/ConfigContext";
import { ToastProvider } from "@/context/ToastContext";
import { TransitionProvider } from "@/context/TransitionContext";
import { I18nProvider } from "@/i18n";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ConfigProvider>
          <ToastProvider>
            <TransitionProvider>
              {children}
            </TransitionProvider>
          </ToastProvider>
        </ConfigProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
