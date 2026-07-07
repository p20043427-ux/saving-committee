import type { ReactNode } from "react";

interface TableCardProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function TableCard({ children, header, className = "" }: TableCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-gh-sm border border-surface-200 overflow-hidden ${className}`}>
      {header && (
        <div className="bg-surface-50 px-6 py-4 border-b border-surface-200">
          {header}
        </div>
      )}
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
