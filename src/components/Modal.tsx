"use client";

import { ReactNode, useEffect, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Small delay to trigger CSS transition after mount
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? "bg-black/50" : "bg-black/0"}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`bg-white rounded-lg p-6 w-[720px] max-w-[90vw] max-h-[92vh] flex flex-col shadow-xl transition-all duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-medium text-[#1A1A1A]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#F0F0F0] transition-colors text-[#888888] hover:text-[#1A1A1A] cursor-pointer" aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
