import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const sideClass = side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${sideClass} whitespace-nowrap rounded-md bg-surface-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 z-50`}
      >
        {content}
      </span>
    </span>
  );
}
