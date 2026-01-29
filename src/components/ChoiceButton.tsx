interface ChoiceButtonProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function ChoiceButton({
  emoji,
  label,
  selected,
  onClick,
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-4 px-3 rounded-lg border-2 transition-all ${
        selected
          ? "bg-[#F0FAFA] border-[#0D6E6E]"
          : "bg-white border-[#E5E5E5] hover:border-[#CCCCCC]"
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span
        className={`text-sm ${
          selected ? "text-[#1A1A1A] font-semibold" : "text-[#666666]"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
