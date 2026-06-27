import { NavLink } from "react-router";
import { cn } from "@/src/lib/utils";
import { HospitalLogo } from "@/src/components/ui/HospitalLogo";
import {
  LayoutDashboard, ClipboardList, Database, Calendar,
  Users, PartyPopper, Building2, BarChart3, Settings
} from "lucide-react";

const navItems = [
  { to: "/",                icon: LayoutDashboard, label: "대시보드" },
  { to: "/monitoring",      icon: ClipboardList,   label: "점검 조회/입력" },
  { to: "/data-management", icon: Database,        label: "점검 데이터 관리" },
  { to: "/schedule",        icon: Calendar,        label: "점검 스케줄" },
  { to: "/committee",       icon: Users,           label: "위원회 명단 관리" },
  { to: "/events",          icon: PartyPopper,     label: "월별 행사 관리" },
  { to: "/management",      icon: Building2,       label: "건물/부서 코드 관리" },
  { to: "/yearly-report",   icon: BarChart3,       label: "연간 분석 리포트" },
  { to: "/admin",           icon: Settings,        label: "시스템 설정" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <aside
      aria-label="메인 네비게이션"
      className={cn(
        "w-60 bg-primary-900 flex flex-col shrink-0",
        "fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b border-primary-800">
        <HospitalLogo size={44} showText={false} variant="symbol" />
        <div className="ml-3">
          <div className="text-white font-bold text-sm leading-tight">좋은문화병원</div>
          <div className="text-primary-300 text-[10px] leading-tight mt-0.5">은성의료재단</div>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="주요 메뉴" className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] font-semibold text-primary-400 uppercase tracking-widest px-2 mb-2">메뉴</div>
        <ul role="list" className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-accent-400 text-white font-semibold"
                      : "text-primary-200 hover:bg-primary-800 hover:text-white"
                  )
                }
              >
                <span className="shrink-0" aria-hidden="true">
                  <item.icon size={16} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-primary-800">
        <div className="text-primary-400 text-[10px]">절약위원회 관리시스템</div>
        <div className="text-primary-500 text-[10px] mt-0.5">v2.0 · 2026</div>
      </div>
    </aside>
  );
}
