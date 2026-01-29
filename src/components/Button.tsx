import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const baseStyles =
    "flex items-center justify-center gap-2 px-6 py-3 rounded text-sm font-medium transition-all";

  const variants = {
    primary: "bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]",
    secondary: "bg-[#F0F0F0] text-[#1A1A1A] hover:bg-[#E5E5E5]",
    outline:
      "bg-transparent border border-[#E5E5E5] text-[#666666] hover:bg-[#F0F0F0]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
