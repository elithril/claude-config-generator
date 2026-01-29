interface RadioOptionProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  detail?: string;
  emoji?: string;
}

export default function RadioOption({
  selected,
  onClick,
  title,
  description,
  detail,
  emoji,
}: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded border-2 transition-all ${
        selected
          ? "bg-[#F0FAFA] border-[#0D6E6E]"
          : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Radio circle */}
        <div
          className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5 ${
            selected ? "border-[#0D6E6E] bg-[#0D6E6E]" : "border-[#CCCCCC]"
          }`}
        >
          {selected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span
            className={`text-sm ${
              selected ? "text-[#1A1A1A] font-semibold" : "text-[#666666]"
            }`}
          >
            {emoji && <span className="mr-2">{emoji}</span>}
            {title}
          </span>
          {description && (
            <span className="text-[13px] text-[#666666]">{description}</span>
          )}
          {detail && (
            <span
              className={`font-[family-name:var(--font-jetbrains)] text-[11px] ${
                selected ? "text-[#0D6E6E]" : "text-[#888888]"
              }`}
            >
              {detail}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
