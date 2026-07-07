import type { ReactNode } from "react";

export interface TabItem {
  key: string;
  label: ReactNode;
  shortLabel?: ReactNode;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="flex space-x-1 border-b border-surface-200">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            active === item.key
              ? "border-primary-500 text-primary-600"
              : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          {item.icon}
          {item.shortLabel ? (
            <>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>
            </>
          ) : (
            item.label
          )}
        </button>
      ))}
    </div>
  );
}
