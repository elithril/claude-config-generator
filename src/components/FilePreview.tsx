"use client";

interface FilePreviewProps {
  filename: string;
  content: string;
  maxLines?: number;
}

export default function FilePreview({ filename, content, maxLines = 15 }: FilePreviewProps) {
  const lines = content.split("\n").slice(0, maxLines);
  const hasMore = content.split("\n").length > maxLines;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
        <span className="text-xs font-mono font-medium text-gray-600">{filename}</span>
      </div>
      <div className="p-3 bg-white overflow-x-auto">
        <pre className="text-xs font-mono leading-5">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="text-gray-400 select-none w-6 text-right mr-3 shrink-0">{i + 1}</span>
              <span className="text-gray-800">{line}</span>
            </div>
          ))}
          {hasMore && (
            <div className="text-gray-400 text-center mt-1">...</div>
          )}
        </pre>
      </div>
    </div>
  );
}
