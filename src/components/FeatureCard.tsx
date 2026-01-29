import Link from "next/link";

interface FeatureCardProps {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  buttonVariant?: "primary" | "secondary";
  stats: { value: string; label: string; highlight?: boolean }[];
  disabled?: boolean;
}

export default function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  buttonText,
  buttonHref,
  buttonVariant = "secondary",
  stats,
  disabled = false,
}: FeatureCardProps) {
  return (
    <div className={`flex flex-col justify-between gap-4 p-6 bg-white rounded-xl border border-[#E5E5E5] transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl"
        style={{ backgroundColor: disabled ? "#CCCCCC" : iconBg }}
      >
        <span className="text-white">{icon}</span>
      </div>

      {/* Content */}
      <h3 className="font-[family-name:var(--font-newsreader)] text-2xl font-medium text-[#1A1A1A]">
        {title}
      </h3>
      <p className="text-[15px] text-[#666666] leading-[1.6]">{description}</p>

      {/* Button */}
      <Link
        href={disabled ? "#" : buttonHref}
        className={`flex items-center justify-center py-3.5 px-6 rounded-lg text-sm font-medium transition-colors ${
          buttonVariant === "primary"
            ? "bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]"
            : "bg-[#F0F0F0] text-[#1A1A1A] hover:bg-[#E5E5E5]"
        } ${disabled ? "cursor-not-allowed" : ""}`}
        onClick={(e) => disabled && e.preventDefault()}
      >
        {buttonText}
      </Link>

      {/* Stats */}
      <div className="flex gap-4 pt-4 border-t border-[#E5E5E5]">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col gap-0.5 flex-1">
            <span
              className={`font-[family-name:var(--font-jetbrains)] text-sm font-semibold ${
                stat.highlight && !disabled ? "text-[#0D6E6E]" : "text-[#1A1A1A]"
              }`}
            >
              {stat.value}
            </span>
            <span className="text-[11px] text-[#888888]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
