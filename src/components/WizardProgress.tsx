interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export default function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <div className="flex flex-col gap-2 items-center w-full py-4" role="navigation" aria-label="Wizard progress">
      {/* Circles and lines */}
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              aria-current={index === currentStep ? "step" : undefined}
              aria-label={`Étape ${index + 1}: ${step}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStep
                  ? "bg-[#0D6E6E] text-white"
                  : "bg-white border-2 border-[#E5E5E5] text-[#888888]"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 md:w-12 h-0.5 ${
                  index < currentStep ? "bg-[#0D6E6E]" : "bg-[#E5E5E5]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-3 md:gap-6">
        {steps.map((step, index) => (
          <span
            key={index}
            className={`text-[10px] md:text-xs transition-colors ${
              index <= currentStep
                ? "text-[#0D6E6E] font-semibold"
                : "text-[#888888]"
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
