"use client";

import React, { type ReactNode } from "react";

// React experimental exports ViewTransition when Next.js has viewTransition enabled.
// At build time, Next.js swaps react for react-experimental which includes it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ViewTransition = (React as any).ViewTransition as
  | React.ComponentType<{ name?: string; children: ReactNode }>
  | undefined;

export function VT({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  if (!ViewTransition) {
    return <>{children}</>;
  }
  return <ViewTransition name={name}>{children}</ViewTransition>;
}
