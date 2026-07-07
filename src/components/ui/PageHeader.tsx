import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-surface-900 border-l-4 border-primary-500 pl-3">
          {title}
        </h1>
        {subtitle && <p className="text-surface-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-4 shrink-0">{action}</div>}
    </div>
  );
}
