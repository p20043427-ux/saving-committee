import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { SkeletonCard } from "@/src/components/ui/Skeleton";
import { ClipboardList, Database, Calendar, Users, PartyPopper, Building2, BarChart3, Settings } from "lucide-react";
import { useDashboardData } from "@/src/hooks/useDashboardData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export function Dashboard() {
  const { departments, buildings, isLoading: orgLoading } = useOrganization();
  const { schedules, events, todayRecords, monthlyRecords, isLoading, today, currentMonth } = useDashboardData();

  const totalDepts = departments.length;
  const inspectedCount = todayRecords.length;
  const progressPct = totalDepts > 0 ? Math.round((inspectedCount / totalDepts) * 100) : 0;
  const normalCount = todayRecords.filter((r) => r.status === "정상").length;
  const warningCount = todayRecords.filter((r) => r.status === "주의").length;
  const urgentCount = todayRecords.filter((r) => r.status === "긴급").length;
  const avgScore =
    inspectedCount > 0
      ? Math.round((todayRecords.reduce((s, r) => s + r.total_score, 0) / inspectedCount) * 10) / 10
      : null;

  // 최근 7일 일별 점검 수
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyChartData = last7Days.map((date) => ({
    date: date.slice(5), // MM-DD
    count: monthlyRecords.filter((r) => r.date.startsWith(date)).length,
  }));

  // 이번 달 달성 통계
  const monthlyDays = [...new Set(monthlyRecords.map((r) => r.date.split("T")[0]))].length;
  const monthlyTotal = monthlyRecords.length;
  const monthlyAvg =
    monthlyTotal > 0
      ? (monthlyRecords.reduce((s, r) => s + r.total_score, 0) / monthlyTotal).toFixed(1)
      : "-";

  // currentMonth 참조를 유지 (lint용)
  void currentMonth;

  const mobileNavItems = [
    { to: "/monitoring",      icon: ClipboardList,  label: "점검 조회/입력",   color: "bg-primary-50 text-primary-700 border-primary-100" },
    { to: "/data-management", icon: Database,       label: "점검 데이터",      color: "bg-info-50 text-info-700 border-info-100" },
    { to: "/schedule",        icon: Calendar,       label: "점검 스케줄",      color: "bg-success-50 text-success-700 border-success-100" },
    { to: "/committee",       icon: Users,          label: "명단 관리",        color: "bg-warning-50 text-warning-700 border-warning-100" },
    { to: "/events",          icon: PartyPopper,    label: "월별 행사",        color: "bg-danger-50 text-danger-700 border-danger-100" },
    { to: "/management",      icon: Building2,      label: "코드 관리",        color: "bg-surface-100 text-surface-700 border-surface-200" },
    { to: "/yearly-report",   icon: BarChart3,      label: "연간 리포트",      color: "bg-success-50 text-success-600 border-success-100" },
    { to: "/admin",           icon: Settings,       label: "시스템 설정",      color: "bg-surface-50 text-surface-600 border-surface-100" },
  ];

  if (isLoading || orgLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const todayLabel = today.replace(/-/g, ".");

  return (
    <div className="animate-in fade-in duration-500 space-y-6">

      {/* Mobile Menu View */}
      <div className="lg:hidden flex flex-col gap-4">
        <h2 className="text-xl font-bold text-surface-900 border-l-4 border-primary-500 pl-3">메뉴</h2>
        <div className="grid grid-cols-2 gap-3">
          {mobileNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-xl border p-4 flex flex-col items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all min-h-[80px] ${item.color}`}
            >
              <item.icon size={22} aria-hidden="true" />
              <span className="text-xs font-bold text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile today summary */}
        <div className="bg-primary-900 rounded-xl p-4 text-white">
          <div className="text-xs text-primary-300 mb-1">{todayLabel} 오늘 점검 현황</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold">{inspectedCount}</span>
            <span className="text-primary-300 mb-1">/ {totalDepts} 부서</span>
          </div>
          <div className="w-full bg-primary-800 rounded-full h-2">
            <div
              className="bg-accent-400 h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop Dashboard View */}
      <div className="hidden lg:block space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="col-span-2 bg-primary-900 text-white border-0 shadow-md">
            <CardContent className="p-5">
              <div className="text-xs text-primary-300 mb-1">{todayLabel} 오늘 점검 진행률</div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold">{inspectedCount}</span>
                <span className="text-primary-300 mb-1 text-sm">/ {totalDepts} 부서 완료</span>
              </div>
              <div className="w-full bg-primary-800 rounded-full h-2.5">
                <div
                  className="bg-accent-400 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-right text-primary-300 text-xs mt-1">{progressPct}%</div>
            </CardContent>
          </Card>

          <Card className="border-success-200 shadow-gh-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="text-xs text-surface-500 font-medium uppercase tracking-wide">정상</div>
              <div className="text-3xl font-bold text-success-600 mt-2">{normalCount}</div>
              <div className="text-xs text-surface-400">부서</div>
            </CardContent>
          </Card>

          <Card className="border-warning-200 shadow-gh-sm">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="text-xs text-surface-500 font-medium uppercase tracking-wide">주의</div>
              <div className="text-3xl font-bold text-warning-600 mt-2">{warningCount}</div>
              <div className="text-xs text-surface-400">부서</div>
            </CardContent>
          </Card>

          <Card className={`shadow-gh-sm ${urgentCount > 0 ? "border-danger-300 bg-danger-50" : "border-surface-200"}`}>
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="text-xs text-surface-500 font-medium uppercase tracking-wide">긴급</div>
              <div className={`text-3xl font-bold mt-2 ${urgentCount > 0 ? "text-danger-600" : "text-surface-400"}`}>
                {urgentCount}
              </div>
              <div className="text-xs text-surface-400">부서</div>
            </CardContent>
          </Card>
        </div>

        {/* Average score + building breakdown */}
        {inspectedCount > 0 && (
          <div className="grid grid-cols-5 gap-4">
            <Card className="col-span-2 border-surface-200 shadow-gh-sm">
              <CardContent className="p-5">
                <div className="text-xs text-surface-500 uppercase tracking-wide mb-2">오늘 평균 점수</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary-700">{avgScore ?? "-"}</span>
                  <span className="text-surface-400 text-sm">/ 20점</span>
                </div>
                <div className="mt-3 w-full bg-surface-100 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: avgScore ? `${(avgScore / 20) * 100}%` : "0%" }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 border-surface-200 shadow-gh-sm">
              <CardContent className="p-5">
                <div className="text-xs text-surface-500 uppercase tracking-wide mb-3">건물별 점검 현황</div>
                <div className="space-y-2">
                  {buildings.map((b) => {
                    const bDepts = departments.filter((d) => d.buildingId === b.id);
                    const bRecords = todayRecords.filter((r) =>
                      bDepts.some((d) => d.id === r.department_id)
                    );
                    const bPct = bDepts.length > 0 ? Math.round((bRecords.length / bDepts.length) * 100) : 0;
                    return (
                      <div key={b.id} className="flex items-center gap-3">
                        <span className="text-sm text-surface-700 w-16 shrink-0">{b.name}</span>
                        <div className="flex-1 bg-surface-100 rounded-full h-1.5">
                          <div
                            className="bg-accent-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${bPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-surface-500 w-16 text-right shrink-0">
                          {bRecords.length}/{bDepts.length} ({bPct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly KPI row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-surface-200 shadow-gh-sm">
            <CardContent className="p-5">
              <div className="text-xs text-surface-500 uppercase tracking-wide mb-1">이번 달 점검 일수</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-primary-700">{monthlyDays}</span>
                <span className="text-surface-400 text-sm">일</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-surface-200 shadow-gh-sm">
            <CardContent className="p-5">
              <div className="text-xs text-surface-500 uppercase tracking-wide mb-1">이번 달 총 점검 건수</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-info-600">{monthlyTotal}</span>
                <span className="text-surface-400 text-sm">건</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-surface-200 shadow-gh-sm">
            <CardContent className="p-5">
              <div className="text-xs text-surface-500 uppercase tracking-wide mb-1">이번 달 평균 점수</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-accent-600">{monthlyAvg}</span>
                <span className="text-surface-400 text-sm">/ 20점</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 최근 7일 BarChart */}
        <Card className="border-surface-200 shadow-gh-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">최근 7일 점검 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={dailyChartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="점검 수" radius={[3, 3, 0, 0]}>
                  {dailyChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.date === today.slice(5) ? "#45b3b4" : "#85b2e0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Events + Schedules */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-surface-200 shadow-gh-sm">
            <CardHeader className="pb-2">
              <CardTitle>이번 달 행사 일정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-1">
                {events.length === 0 && (
                  <div className="text-sm text-surface-400 py-6 text-center">이번 달 등록된 행사가 없습니다.</div>
                )}
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors">
                    <span className="text-xs font-mono text-surface-500 bg-surface-100 px-2 py-1 rounded shrink-0">
                      {e.date.slice(5)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-surface-900">{e.title}</div>
                      {e.attendees.length > 0 && (
                        <div className="text-xs text-surface-500 mt-0.5">{e.attendees.join(", ")}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-surface-200 shadow-gh-sm">
            <CardHeader className="pb-2">
              <CardTitle>이번 달 점검 스케줄</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-1">
                {schedules.length === 0 && (
                  <div className="text-sm text-surface-400 py-6 text-center">이번 달 등록된 스케줄이 없습니다.</div>
                )}
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors">
                    <span className="text-xs font-mono text-surface-500 bg-surface-100 px-2 py-1 rounded shrink-0">
                      {s.date.slice(5)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-surface-900">{s.turn}차 점검</div>
                      {s.inspectors.length > 0 && (
                        <div className="text-xs text-surface-500 mt-0.5">{s.inspectors.join(", ")}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
