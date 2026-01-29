interface MetricProps {
  value: string;
  label: string;
  highlight?: boolean;
}

interface PreviewPanelProps {
  title: string;
  metrics: MetricProps[];
  previewTitle: string;
  previewContent: { text: string; highlight?: boolean }[];
}

export default function PreviewPanel({
  title,
  metrics,
  previewTitle,
  previewContent,
}: PreviewPanelProps) {
  return (
    <div className="w-[520px] h-full bg-[#F0F0F0] border-l border-[#E0E0E0] p-8 flex flex-col gap-4">
      {/* Header */}
      <span className="font-[family-name:var(--font-jetbrains)] text-[11px] font-semibold text-[#0D6E6E] tracking-[2px]">
        {title}
      </span>

      {/* Metrics */}
      <div className="flex gap-3">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex-1 bg-white rounded-md border border-[#E0E0E0] p-3 flex flex-col gap-1"
          >
            <span
              className={`font-[family-name:var(--font-jetbrains)] text-xl font-semibold ${
                metric.highlight ? "text-[#0D6E6E]" : "text-[#1A1A1A]"
              }`}
            >
              {metric.value}
            </span>
            <span className="text-[11px] text-[#888888]">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Code Preview */}
      <div className="bg-white rounded-md border border-[#E0E0E0] p-6 flex flex-col gap-4">
        <span className="font-[family-name:var(--font-jetbrains)] text-sm font-semibold text-[#1A1A1A]">
          {previewTitle}
        </span>
        <div className="flex flex-col gap-1">
          {previewContent.map((line, index) => (
            <span
              key={index}
              className={`font-[family-name:var(--font-jetbrains)] text-xs ${
                line.highlight ? "text-[#0D6E6E]" : "text-[#666666]"
              }`}
            >
              {line.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
