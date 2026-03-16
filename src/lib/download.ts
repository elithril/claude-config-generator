import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { GeneratedFile } from "@/types";

export async function downloadAsZip(files: GeneratedFile[], zipName = "claude-config"): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${zipName}.zip`);
}

export function downloadSingleFile(file: GeneratedFile): void {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, file.path.split("/").pop() || file.path);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
