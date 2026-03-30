import { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="page-enter flex-1 flex flex-col min-h-0">
      {children}
    </div>
  );
}
