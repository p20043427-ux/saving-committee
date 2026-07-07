import type { ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error: "text-danger-600 bg-danger-50 border-danger-200",
  success: "text-success-700 bg-success-50 border-success-200",
  warning: "text-warning-700 bg-warning-50 border-warning-200",
  info: "text-info-700 bg-info-50 border-info-200",
};

export function Alert({ variant = "info", children, className = "" }: AlertProps) {
  return (
    <div
      role={variant === "success" ? "status" : "alert"}
      className={`p-3 text-sm rounded-lg border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
