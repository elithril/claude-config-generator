interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export default function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const label = steps[currentStep] ?? "";

  return (
    <div className="w-full flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#0D6E6E]">{label}</span>
        <span className="text-[11px] text-[#888888] tabular-nums">
          {currentStep + 1}/{steps.length}
        </span>
      </div>
      <div className="w-full h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: "#0D6E6E",
            transition: "width 400ms ease-in-out",
          }}
        />
      </div>
    </div>
  );
}
