"use client";

import Sidebar from "./Sidebar";
import PageTransition from "./PageTransition";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#FAFAFA]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-0">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
