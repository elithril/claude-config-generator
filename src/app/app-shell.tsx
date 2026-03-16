"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components";
import PageTransition from "@/components/PageTransition";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-0">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
