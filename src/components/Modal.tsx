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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-lg p-6 w-[400px] max-w-[90vw] shadow-xl transition-all duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <h3 className="text-lg font-medium text-[#1A1A1A] mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
