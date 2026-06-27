import { Menu, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { HospitalLogo } from "@/src/components/ui/HospitalLogo";

interface TopbarProps {
  onToggleMenu?: () => void;
}

const PAGE_LABELS: Record<string, string> = {
  "/": "대시보드",
  "/monitoring": "점검 조회/입력",
  "/data-management": "점검 데이터 관리",
  "/schedule": "점검 스케줄",
  "/committee": "위원회 명단 관리",
  "/events": "월별 행사 관리",
  "/management": "건물/부서 코드 관리",
  "/yearly-report": "연간 분석 리포트",
  "/admin": "시스템 설정",
};

export function Topbar({ onToggleMenu }: TopbarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pageLabel = PAGE_LABELS[location.pathname] ?? "절약위원회";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.slice(0, 1)
    : user?.email?.slice(0, 1).toUpperCase() ?? "관";

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

        {/* Breadcrumb */}
        <nav aria-label="현재 위치" className="flex items-center gap-2 text-sm">
          <span className="hidden md:flex items-center gap-1.5 text-surface-400">
            <HospitalLogo size={20} showText={false} variant="symbol" />
            <span>좋은문화병원</span>
          </span>
          <span className="text-surface-300 hidden md:inline">/</span>
          <span className="text-primary-700 font-semibold">{pageLabel}</span>
        </nav>
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

        {user?.name && (
          <span className="hidden md:inline text-xs text-surface-500">{user.name}</span>
        )}

        <div
          className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold cursor-default"
          aria-label={`사용자: ${user?.name ?? user?.email ?? "관리자"}`}
          title={user?.email ?? ""}
        >
          {initials}
        </div>

        <button
          onClick={handleLogout}
          aria-label="로그아웃"
          className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
