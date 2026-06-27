import React, { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router";
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  Database,
  Calendar,
  Users,
  PartyPopper,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  departments: { id: string; name: string; buildingId: string }[];
  buildings: { id: string; name: string }[];
}

const MENU_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "대시보드" },
  { to: "/monitoring", icon: ClipboardList, label: "점검 조회/입력" },
  { to: "/data-management", icon: Database, label: "점검 데이터 관리" },
  { to: "/schedule", icon: Calendar, label: "점검 스케줄" },
  { to: "/committee", icon: Users, label: "위원회 명단 관리" },
  { to: "/events", icon: PartyPopper, label: "월별 행사 관리" },
  { to: "/management", icon: Building2, label: "건물/부서 코드 관리" },
  { to: "/yearly-report", icon: BarChart3, label: "연간 분석 리포트" },
  { to: "/admin", icon: Settings, label: "시스템 설정" },
];

export function CommandPalette({
  open,
  onClose,
  departments,
  buildings,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = useCallback(
    (to: string) => {
      navigate(to);
      onClose();
    },
    [navigate, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-surface-200">
        <Command className="w-full" shouldFilter>
          <div className="flex items-center gap-3 px-4 border-b border-surface-200">
            <Search size={16} className="text-surface-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="메뉴 또는 부서 검색..."
              className="flex-1 py-3.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none bg-transparent"
              autoFocus
            />
            <kbd className="text-[10px] text-surface-400 border border-surface-200 rounded px-1.5 py-0.5 shrink-0">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-sm text-surface-400">
              검색 결과가 없습니다.
            </Command.Empty>

            <Command.Group
              heading="메뉴"
              className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-surface-400"
            >
              {MENU_ITEMS.map((item) => (
                <Command.Item
                  key={item.to}
                  value={item.label}
                  onSelect={() => go(item.to)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm text-surface-700 aria-selected:bg-primary-50 aria-selected:text-primary-800 transition-colors"
                >
                  <item.icon size={15} className="text-surface-400" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>

            {departments.length > 0 && (
              <Command.Group
                heading="부서 — 점검 조회"
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-surface-400"
              >
                {departments.map((dept) => {
                  const bldg = buildings.find((b) => b.id === dept.buildingId);
                  return (
                    <Command.Item
                      key={dept.id}
                      value={`${dept.name} ${bldg?.name ?? ""}`}
                      onSelect={() => go("/monitoring")}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm text-surface-700 aria-selected:bg-primary-50 aria-selected:text-primary-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ClipboardList size={14} className="text-surface-400" />
                        {dept.name}
                      </span>
                      {bldg && (
                        <span className="text-xs text-surface-400">
                          {bldg.name}
                        </span>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
          </Command.List>
          <div className="px-4 py-2 border-t border-surface-100 flex gap-4 text-[11px] text-surface-400">
            <span>
              <kbd className="border border-surface-200 rounded px-1">↑↓</kbd>{" "}
              이동
            </span>
            <span>
              <kbd className="border border-surface-200 rounded px-1">
                Enter
              </kbd>{" "}
              선택
            </span>
            <span>
              <kbd className="border border-surface-200 rounded px-1">ESC</kbd>{" "}
              닫기
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
