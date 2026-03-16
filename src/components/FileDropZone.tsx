"use client";

import { useState, useCallback, DragEvent } from "react";

interface FileDropZoneProps {
  onFileLoaded: (content: string) => void;
  currentContent: string;
  accept?: string;
}

export default function FileDropZone({ onFileLoaded, currentContent, accept = ".md" }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") onFileLoaded(text);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragOver
          ? "border-[#0D6E6E] bg-[#F0FAFA]"
          : "border-[#E5E5E5] hover:border-[#CCCCCC]"
      }`}
    >
      {currentContent ? (
        <div className="text-sm text-[#666666]">
          <p className="font-medium text-[#1A1A1A] mb-1">Fichier importe</p>
          <p className="text-xs text-[#888888] mb-3">
            {currentContent.split("\n").length} lignes - Glissez un nouveau fichier pour remplacer
          </p>
          <pre className="text-left text-xs font-mono bg-[#F5F5F5] p-3 rounded max-h-32 overflow-auto">
            {currentContent.slice(0, 500)}{currentContent.length > 500 ? "\n..." : ""}
          </pre>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#666666] mb-2">
            Glissez votre CLAUDE.md ici ou{" "}
            <label className="text-[#0D6E6E] cursor-pointer hover:underline">
              parcourez vos fichiers
              <input
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-[#AAAAAA]">
            Accepte les fichiers {accept}
          </p>
        </div>
      )}
    </div>
  );
}
