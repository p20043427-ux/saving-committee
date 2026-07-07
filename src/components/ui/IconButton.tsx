import type { ButtonHTMLAttributes } from "react";

type IconButtonVariant = "default" | "danger";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: IconButtonVariant;
}

const variants: Record<IconButtonVariant, string> = {
  default: "text-surface-500 hover:bg-surface-100",
  danger: "text-surface-400 hover:text-danger-600 hover:bg-danger-50",
};

export function IconButton({ variant = "default", className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
