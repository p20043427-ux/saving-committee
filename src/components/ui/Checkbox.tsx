import type { InputHTMLAttributes } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={`w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 ${className}`}
      {...props}
    />
  );
}
