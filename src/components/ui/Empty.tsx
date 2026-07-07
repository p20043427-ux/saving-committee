import type { ReactNode } from "react";

interface EmptyProps {
  message: string;
  action?: ReactNode;
  className?: string;
}

export function Empty({ message, action, className = "" }: EmptyProps) {
  return (
    <div className={`text-center py-10 text-surface-500 text-sm ${className}`}>
      <p>{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
