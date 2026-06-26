import { Menu } from "lucide-react";

interface TopbarProps {
  onToggleMenu?: () => void;
}

export function Topbar({ onToggleMenu }: TopbarProps) {
  return (
    <header className="flex justify-between items-center shrink-0 bg-white border-b border-surface-200 px-6 py-0 h-14 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          aria-label="메뉴 열기"
          aria-expanded={false}
          className="md:hidden p-1.5 text-surface-500 hover:bg-surface-100 rounded transition-colors"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-primary-700 font-bold text-base">절약위원회</span>
          <span className="hidden sm:inline text-surface-300 text-sm">|</span>
          <span className="hidden sm:inline text-surface-500 text-xs">에너지 점검 관리 시스템</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          role="status"
          aria-live="polite"
          aria-label="시스템 상태: 정상"
          className="hidden sm:flex items-center gap-1.5 text-xs text-surface-500"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400" />
          </span>
          <span className="font-medium text-accent-600">시스템 정상</span>
        </div>
        <div className="h-5 w-px bg-surface-200 hidden sm:block" aria-hidden="true" />
        <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold" aria-label="사용자">
          관
        </div>
      </div>
    </header>
  );
}
