import { NavLink } from "react-router";
import { LayoutDashboard, ClipboardList, Database, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/src/lib/utils";

const TABS = [
  { to: "/",                icon: LayoutDashboard, label: "대시보드" },
  { to: "/monitoring",      icon: ClipboardList,   label: "점검" },
  { to: "/data-management", icon: Database,        label: "데이터" },
  { to: "/schedule",        icon: Calendar,        label: "스케줄" },
  { to: "/yearly-report",   icon: BarChart3,       label: "리포트" },
];

export function BottomTabBar() {
  return (
    <nav
      aria-label="모바일 탭 네비게이션"
      className="md:hidden no-print fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-surface-200 flex"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors min-h-[52px]",
              isActive ? "text-primary-700" : "text-surface-400"
            )
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon size={20} aria-hidden="true" strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
