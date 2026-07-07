import type { InputHTMLAttributes } from "react";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function Switch({ label, className = "", ...props }: SwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer gap-3 min-h-[44px]">
      <input type="checkbox" className="sr-only peer" {...props} />
      <div
        className={`w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 ${className}`}
      />
      {label && <span className="text-sm font-medium text-surface-700">{label}</span>}
    </label>
  );
}
