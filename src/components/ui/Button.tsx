import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:   "bg-primary-700 text-white hover:bg-primary-800 active:scale-95",
  secondary: "border border-surface-300 text-surface-700 hover:bg-surface-100 bg-white",
  ghost:     "bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200",
  danger:    "border border-danger-200 text-danger-600 hover:bg-danger-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2.5 text-sm min-h-[44px]",
  md: "px-4 py-2.5 text-sm min-h-[44px]",
  lg: "px-5 py-3 text-base min-h-[44px]",
};

export function Button({
  variant = "secondary",
  size = "sm",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
        focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
