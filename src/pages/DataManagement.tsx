import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/src/lib/supabase";
import { liveQuery, rowToRecord, RecordRow } from "@/src/lib/db";
import { RecordEditDialog } from "@/src/components/features/RecordEditDialog";
import { useInspectionItemNames } from "@/src/hooks/useInspectionItemNames";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { Download, CalendarDays, BarChart2, ArrowUp, ArrowDown, Users } from "lucide-react";
import { toast } from "../components/ui/Toast";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { PageHeader } from "../components/ui/PageHeader";
import { Tabs } from "../components/ui/Tabs";
import { TableCard } from "../components/ui/TableCard";
import { Checkbox } from "../components/ui/Checkbox";
import { Tooltip } from "../components/ui/Tooltip";
import { Empty } from "../components/ui/Empty";
import { Pagination } from "../components/ui/Pagination";

export interface RecordDoc {
  id: string;
  buildingId: string;
  departmentId: string;
  departmentName: string;
  inspector: string;
  date: string;
  scores: {
    lights: number;
    water: number;
    recycle: number;
    focus: number;
  };
  totalScore: number;
  notes: string;
  status: string;
  userId: string;
  createdAt: string;
}

/** 건물·입력자 리포트용 집계 한 칸 */
interface ReportAgg {
  count: number;
  total: number;
  normal: number;
  warning: number;
  urgent: number;
  depts: Set<string>;
}

const newAgg = (): ReportAgg => ({ count: 0, total: 0, normal: 0, warning: 0, urgent: 0, depts: new Set() });

function addToAgg(agg: ReportAgg, r: RecordDoc) {
  agg.count += 1;
  agg.total += r.totalScore || 0;
  agg.depts.add(r.departmentId);
  if (r.status === "긴급") agg.urgent += 1;
  else if (r.status === "주의") agg.warning += 1;
  else agg.normal += 1;
}

const avgOf = (agg: ReportAgg) => (agg.count > 0 ? Math.round((agg.total / agg.count) * 10) / 10 : null);

export function DataManagement() {
  const { user } = useAuth();
  const { buildings, departments, isLoading: orgLoading } = useOrganization();
  const [allRecords, setAllRecords] = useState<RecordDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"raw" | "aggregate" | "report">("raw");

  // Filter State (Raw)
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [filterType, setFilterType] = useState<"month" | "range">("month");
  const [filterMonth, setFilterMonth] = useState(currentYearMonth);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Filter State (Aggregate)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  // Filter State (건물·부서 — 두 탭 공통, 빈 값은 전체)
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const deptOptions = useMemo(
    () => departments.filter((d) => !filterBuilding || d.buildingId === filterBuilding),
    [departments, filterBuilding]
  );
  // 점검자 필터 (상세 점검 내역 탭, 빈 값은 전체)
  const [filterInspector, setFilterInspector] = useState("");
  const inspectorOptions = useMemo(() => {
    const names = new Set(allRecords.map((r) => r.inspector).filter(Boolean));
    if (filterInspector) names.add(filterInspector); // 기간을 바꿔도 선택값이 목록에서 사라지지 않게
    return [...names].sort((a, b) => a.localeCompare(b, "ko"));
  }, [allRecords, filterInspector]);
  const matchesOrg = (buildingId: string, departmentId: string) =>
    (!filterBuilding || buildingId === filterBuilding) && (!filterDept || departmentId === filterDept);
  const handleBuildingFilter = (id: string) => {
    setFilterBuilding(id);
    // 선택된 부서가 새 건물 소속이 아니면 부서 필터 해제
    if (filterDept && id && departments.find((d) => d.id === filterDept)?.buildingId !== id) setFilterDept("");
  };

  // Pagination State (Raw)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // Edit State — 수정은 팝업(RecordEditDialog)에서 처리
  const [editingRecord, setEditingRecord] = useState<RecordDoc | null>(null);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const itemNames = useInspectionItemNames();
  const [isExporting, setIsExporting] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  // Selection State (Raw)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort State (Raw)
  type RawSortKey = 'date' | 'buildingName' | 'departmentName' | 'inspector' | 'lights' | 'water' | 'recycle' | 'focus' | 'totalScore' | 'status';
  const [rawSortConfig, setRawSortConfig] = useState<{key: RawSortKey, direction: 'asc' | 'desc'} | null>(null);

  const handleRawSort = (key: RawSortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (rawSortConfig && rawSortConfig.key === key && rawSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setRawSortConfig({ key, direction });
  };

  // Sort State (Aggregate)
  type AggSortKey = 'departmentName' | 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12' | 'yearlyAvg';
  const [aggSortConfig, setAggSortConfig] = useState<{key: AggSortKey, direction: 'asc' | 'desc'} | null>({key: 'yearlyAvg', direction: 'desc'});

  const handleAggSort = (key: AggSortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (aggSortConfig && aggSortConfig.key === key && aggSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setAggSortConfig({ key, direction });
  };

  useEffect(() => {
    setIsLoading(true);
    let isMounted = true;
    
    let startOfDay = "";
    let endOfDay = "";

    if (activeTab === "aggregate") {
      startOfDay = `${filterYear}-01-01T00:00:00`;
      endOfDay = `${filterYear}-12-31T23:59:59.999Z`;
    } else {
      if (filterType === "month") {
        startOfDay = `${filterMonth}-01T00:00:00`;
        const year = parseInt(filterMonth.split("-")[0]);
        let month = parseInt(filterMonth.split("-")[1]) + 1;
        let nextYear = year;
        if (month > 12) {
          month = 1;
          nextYear = year + 1;
        }
        endOfDay = `${nextYear}-${String(month).padStart(2, "0")}-01T00:00:00`;
      } else {
        startOfDay = `${startDate}T00:00:00`;
        endOfDay = `${endDate}T23:59:59.999Z`;
      }
    }

    const unsubscribe = liveQuery<RecordRow>(
      "sc_records",
      () =>
        supabase
          .from("sc_records")
          .select("*")
          .gte("date", startOfDay)
          .lt("date", endOfDay)
          .order("date", { ascending: false }),
      (rows) => {
        if (isMounted) {
          setAllRecords(rows.map(rowToRecord) as RecordDoc[]);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("데이터 로딩 오류:", error);
        if (isMounted) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeTab, filterType, filterMonth, startDate, endDate, filterYear]);

  // 필터/페이지 변경 시 선택 초기화
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, filterType, filterMonth, startDate, endDate, filterBuilding, filterDept, filterInspector]);

  // 필터 변경 시 page 리셋
  useEffect(() => {
    setPage(1);
  }, [filterType, filterMonth, startDate, endDate, rawSortConfig, filterBuilding, filterDept, filterInspector]);

  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || id;

  const inPeriod = (r: RecordDoc) => {
    const d = r.date.split("T")[0];
    return filterType === "month" ? d.startsWith(filterMonth) : d >= startDate && d <= endDate;
  };

  // Computed: Display Records (Raw)
  const filteredRecords = useMemo(() => {
    let filtered = allRecords.filter(r => {
      if (!matchesOrg(r.buildingId, r.departmentId)) return false;
      if (filterInspector && r.inspector !== filterInspector) return false;
      return inPeriod(r);
    });

    if (rawSortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        if (rawSortConfig.key === 'buildingName') {
           aValue = getBuildingName(a.buildingId);
           bValue = getBuildingName(b.buildingId);
        } else if (['lights', 'water', 'recycle', 'focus'].includes(rawSortConfig.key)) {
           aValue = a.scores?.[rawSortConfig.key as keyof RecordDoc['scores']] ?? 0;
           bValue = b.scores?.[rawSortConfig.key as keyof RecordDoc['scores']] ?? 0;
        } else {
           aValue = a[rawSortConfig.key as keyof RecordDoc];
           bValue = b[rawSortConfig.key as keyof RecordDoc];
        }
  
        if (aValue < bValue) {
          return rawSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return rawSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [allRecords, filterType, filterMonth, startDate, endDate, rawSortConfig, buildings, filterBuilding, filterDept, filterInspector]);

  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);

  // Computed: Aggregate Data
  const aggregateData = useMemo(() => {
    const deptStats: Record<string, { id: string, name: string, months: Record<number, {total: number, count: number}> }> = {};
    
    departments.forEach(d => {
      if (!matchesOrg(d.buildingId, d.id)) return;
      deptStats[d.id] = { id: d.id, name: d.name, months: {} };
    });

    allRecords.forEach(r => {
      if (!r.date.startsWith(filterYear)) return;
      if (!matchesOrg(r.buildingId, r.departmentId)) return;
      if (!deptStats[r.departmentId]) {
        deptStats[r.departmentId] = { id: r.departmentId, name: r.departmentName, months: {} };
      }
      
      const parts = r.date.split("-");
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!deptStats[r.departmentId].months[m]) {
          deptStats[r.departmentId].months[m] = { total: 0, count: 0 };
        }
        deptStats[r.departmentId].months[m].total += r.totalScore;
        deptStats[r.departmentId].months[m].count += 1;
      }
    });
    
    type AggRow = { departmentId: string; departmentName: string; yearlyAvg: number | null } & Record<string, number | null | string>;
    let resultArr = Object.values(deptStats).map(dept => {
      const result: AggRow = { departmentId: dept.id, departmentName: dept.name, yearlyAvg: null };
      let yearlyTotal = 0;
      let yearlyCount = 0;
      for (let i = 1; i <= 12; i++) {
        if (dept.months[i] && dept.months[i].count > 0) {
          const avg = dept.months[i].total / dept.months[i].count;
          result[`m${i}`] = Math.round(avg * 10) / 10;
          yearlyTotal += dept.months[i].total;
          yearlyCount += dept.months[i].count;
        } else {
          result[`m${i}`] = null;
        }
      }
      result.yearlyAvg = yearlyCount > 0 ? Math.round((yearlyTotal / yearlyCount) * 10) / 10 : null;
      return result;
    });

    if (aggSortConfig) {
      resultArr.sort((a, b) => {
        let aValue = a[aggSortConfig.key];
        let bValue = b[aggSortConfig.key];

        if (aValue === null && bValue !== null) return 1;
        if (aValue !== null && bValue === null) return -1;
        if (aValue === null && bValue === null) return 0;

        if (aValue < bValue) {
          return aggSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return aggSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return resultArr;
  }, [allRecords, filterYear, departments, aggSortConfig, filterBuilding, filterDept]);

  // Computed: 건물·입력자 리포트 (상세 내역과 같은 필터가 적용된 기록을 집계)
  const reportData = useMemo(() => {
    const summary = newAgg();
    const byBuilding = new Map<string, ReportAgg>();
    const byInspector = new Map<string, { buildingId: string; inspector: string; agg: ReportAgg }>();

    filteredRecords.forEach((r) => {
      addToAgg(summary, r);
      if (!byBuilding.has(r.buildingId)) byBuilding.set(r.buildingId, newAgg());
      addToAgg(byBuilding.get(r.buildingId)!, r);

      const inspector = r.inspector || "(미지정)";
      const key = `${r.buildingId}|${inspector}`;
      if (!byInspector.has(key)) byInspector.set(key, { buildingId: r.buildingId, inspector, agg: newAgg() });
      addToAgg(byInspector.get(key)!.agg, r);
    });

    // 건물은 조직 설정의 순서를 따르고, 삭제된 건물의 기록은 맨 뒤로
    const buildingOrder = (id: string) => {
      const i = buildings.findIndex((b) => b.id === id);
      return i === -1 ? buildings.length : i;
    };
    const buildingRows = [...byBuilding.entries()]
      .map(([id, agg]) => ({ id, name: getBuildingName(id), agg }))
      .sort((a, b) => buildingOrder(a.id) - buildingOrder(b.id));
    const inspectorRows = [...byInspector.values()]
      .map((v) => ({ ...v, buildingName: getBuildingName(v.buildingId) }))
      .sort((a, b) => buildingOrder(a.buildingId) - buildingOrder(b.buildingId) || b.agg.count - a.agg.count);

    return { summary, buildingRows, inspectorRows };
  }, [filteredRecords, buildings]);

  // Computed: 입력 누락 확인 — 선택 기간에 기록이 하나도 없는 부서 (점검자 필터와 무관하게 건물/부서 기준)
  const coverage = useMemo(() => {
    const covered = new Set(
      allRecords.filter((r) => inPeriod(r) && matchesOrg(r.buildingId, r.departmentId)).map((r) => r.departmentId)
    );
    const rows = buildings
      .filter((b) => !filterBuilding || b.id === filterBuilding)
      .map((b) => {
        const depts = departments.filter((d) => d.buildingId === b.id && matchesOrg(b.id, d.id));
        const missing = depts.filter((d) => !covered.has(d.id));
        return { id: b.id, name: b.name, total: depts.length, done: depts.length - missing.length, missing };
      })
      .filter((row) => row.total > 0);
    const total = rows.reduce((s, r) => s + r.total, 0);
    const done = rows.reduce((s, r) => s + r.done, 0);
    return { rows, total, done, missingCount: total - done };
  }, [allRecords, departments, buildings, filterType, filterMonth, startDate, endDate, filterBuilding, filterDept]);

  // Export handlers
  const exportReportCSV = () => {
    const headers = ["소속 건물", "입력자", "입력 건수", "점검 부서 수", "평균 점수", "정상", "주의", "긴급"];
    const rows = reportData.inspectorRows.map(({ buildingName, inspector, agg }) => [
      buildingName, inspector, agg.count, agg.depts.size, avgOf(agg) ?? "", agg.normal, agg.warning, agg.urgent,
    ]);
    const missingRows = coverage.rows.flatMap((row) => row.missing.map((d) => [row.name, d.name]));
    const csvLines = [headers.join(","), ...rows.map((r) => r.join(","))];
    if (missingRows.length > 0) {
      csvLines.push("", "입력 누락 부서", ["소속 건물", "부서명"].join(","), ...missingRows.map((r) => r.join(",")));
    }
    const csvContent = "﻿" + csvLines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `건물_입력자_리포트_${filterType === "month" ? filterMonth : `${startDate}_${endDate}`}.csv`;
    link.click();
  };

  const exportRawCSV = () => {
    const headers = ["점검일", "소속 건물", "부서명", "점검자", "조명/전열", "수돗물", "재활용", "중점점검", "총점", "상태", "특이사항"];
    const rows = filteredRecords.map(r => [
      r.date.split("T")[0],
      getBuildingName(r.buildingId) || "",
      r.departmentName || "",
      r.inspector || "",
      r.scores?.lights ?? 0,
      r.scores?.water ?? 0,
      r.scores?.recycle ?? 0,
      r.scores?.focus ?? 0,
      r.totalScore ?? 0,
      r.status || "",
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `점검데이터_${filterType === 'month' ? filterMonth : `${startDate}_${endDate}`}.csv`;
    link.click();
  };

  const exportAggregateCSV = () => {
    const headers = ["부서명", "1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월", "연간 평균"];
    const rows = aggregateData.map(row => [
      row.departmentName,
      row.m1 ?? "", row.m2 ?? "", row.m3 ?? "", row.m4 ?? "", row.m5 ?? "", row.m6 ?? "",
      row.m7 ?? "", row.m8 ?? "", row.m9 ?? "", row.m10 ?? "", row.m11 ?? "", row.m12 ?? "",
      row.yearlyAvg ?? ""
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `부서별_월별_점수표_${filterYear}년.csv`;
    link.click();
  };

  const scoreFields: { key: keyof RecordDoc['scores']; label: string }[] = [
    { key: 'lights', label: itemNames.lights },
    { key: 'water', label: itemNames.water },
    { key: 'recycle', label: itemNames.recycle },
    { key: 'focus', label: itemNames.focus },
  ];

  const renderRawSortIcon = (key: RawSortKey) => {
    if (rawSortConfig?.key !== key) return <span className="w-3 inline-block" />;
    return rawSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary-500"/> : <ArrowDown className="w-3 h-3 inline ml-1 text-primary-500"/>;
  };

  const renderAggSortIcon = (key: AggSortKey) => {
    if (aggSortConfig?.key !== key) return <span className="w-3 inline-block" />;
    return aggSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary-500"/> : <ArrowDown className="w-3 h-3 inline ml-1 text-primary-500"/>;
  };

  // 점검자 선택지: 활동 중인 위원
  useEffect(() => {
    return liveQuery<{ id: string; name: string; is_active: boolean }>(
      "sc_committee",
      () => supabase.from("sc_committee").select("id,name,is_active"),
      (rows) => setMembers(rows.filter((r) => r.is_active !== false).map((r) => ({ id: r.id, name: r.name })))
    );
  }, []);

  const deleteRecord = async (id: string) => {
    const ok = await confirm("데이터 삭제", "정말 이 데이터를 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다.)");
    if (!ok) return;
    try {
      const { error } = await supabase.from("sc_records").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("삭제 오류:", error);
      toast.error("문서 삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading || orgLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-surface-500">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
        <p>데이터 관리를 위해 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  const selectClass =
    "bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-700 font-medium min-h-[44px] max-w-[11rem]";
  const orgFilter = (
    <>
      <select
        aria-label="건물 필터"
        value={filterBuilding}
        onChange={(e) => handleBuildingFilter(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 건물</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <select
        aria-label="부서 필터"
        value={filterDept}
        onChange={(e) => setFilterDept(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 부서</option>
        {deptOptions.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      {(filterBuilding || filterDept) && (
        <button
          type="button"
          onClick={() => { setFilterBuilding(""); setFilterDept(""); }}
          className="px-3 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 min-h-[44px]"
        >
          필터 초기화
        </button>
      )}
    </>
  );

  // 상세 점검 내역·건물/입력자 리포트 탭이 같이 쓰는 필터 (기간 + 건물 + 부서 + 점검자)
  const periodFilter = (
    <div className="flex items-center flex-wrap gap-2">
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value as "month" | "range")}
        className="bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-700 font-medium min-h-[44px]"
      >
        <option value="month">월간 조회</option>
        <option value="range">기간 조회</option>
      </select>

      {filterType === "month" ? (
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 font-medium min-h-[44px]"
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 min-h-[44px]"
          />
          <span className="text-surface-500">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white border border-surface-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 min-h-[44px]"
          />
        </div>
      )}
      {orgFilter}
      <select
        aria-label="점검자 필터"
        value={filterInspector}
        onChange={(e) => setFilterInspector(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 점검자</option>
        {inspectorOptions.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="점검 데이터 관리" subtitle="상세 점검 내역을 관리하고 연간/월별 점수표를 확인하세요." />

      {/* Tabs */}
      <Tabs
        items={[
          { key: "raw", label: "상세 점검 내역", shortLabel: "상세", icon: <CalendarDays className="w-4 h-4" /> },
          { key: "aggregate", label: "부서별 월간/연간 점수표", shortLabel: "집계", icon: <BarChart2 className="w-4 h-4" /> },
          { key: "report", label: "건물·입력자 리포트", shortLabel: "리포트", icon: <Users className="w-4 h-4" /> },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as "raw" | "aggregate" | "report")}
      />

      {activeTab === "raw" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
            {periodFilter}
            <button
              onClick={exportRawCSV}
              className="flex items-center gap-2 shrink-0 whitespace-nowrap px-4 py-2.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 text-sm font-medium rounded-lg transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 border border-primary-200 rounded-xl text-sm">
              <span className="font-semibold text-primary-700">{selectedIds.size}건 선택됨</span>
              <button
                onClick={async () => {
                  const ok = await confirm("선택 항목 삭제", `선택한 ${selectedIds.size}건을 모두 삭제하시겠습니까? (되돌릴 수 없습니다.)`);
                  if (!ok) return;
                  try {
                    const ids = Array.from(selectedIds);
                    const { error } = await supabase.from("sc_records").delete().in("id", ids);
                    if (error) throw error;
                    setSelectedIds(new Set());
                  } catch (err) {
                    console.error("일괄 삭제 오류:", err);
                    toast.error("일괄 삭제 중 오류가 발생했습니다.");
                  }
                }}
                className="px-3 py-1 bg-danger-600 text-white rounded-lg text-xs font-semibold hover:bg-danger-700 transition-colors"
              >
                선택 삭제
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1 bg-surface-200 text-surface-700 rounded-lg text-xs font-semibold hover:bg-surface-300 transition-colors"
              >
                선택 해제
              </button>
            </div>
          )}

          {/* 모바일: 카드 뷰 */}
          <div className="sm:hidden space-y-3">
            {filteredRecords.length === 0 ? (
              <Empty message="선택된 기간에 입력된 점검 데이터가 없습니다." className="bg-white rounded-xl border border-surface-200" />
            ) : (
              pagedRecords.map(record => {
                return (
                  <div
                    key={record.id}
                    className={`bg-white rounded-xl border p-4 shadow-gh-sm space-y-3 ${selectedIds.has(record.id) ? "border-primary-300 bg-primary-50" : "border-surface-200"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <Checkbox
                          aria-label={`${record.departmentName} 선택`}
                          checked={selectedIds.has(record.id)}
                          onChange={(e) => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(record.id);
                              else next.delete(record.id);
                              return next;
                            });
                          }}
                          className="mt-1 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs text-surface-500">{record.date.split("T")[0]} · {getBuildingName(record.buildingId)}</div>
                          <div className="font-semibold text-surface-900 truncate">{record.departmentName}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-md ${
                        record.status === '정상' ? 'bg-success-100 text-success-700' :
                        record.status === '주의' ? 'bg-warning-100 text-warning-700' :
                        'bg-danger-100 text-danger-700'
                      }`}>
                        {record.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      {scoreFields.map(({ key, label }) => (
                        <div key={key}>
                          <div className="text-[10px] text-surface-500 mb-1 break-keep">{label}</div>
                          <div className="text-sm font-semibold text-surface-900">{record.scores?.[key] || 0}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm border-t border-surface-100 pt-2">
                      <span className="text-surface-500 flex items-center gap-1">
                        점검자
                        <span className="font-medium text-surface-800">{record.inspector}</span>
                      </span>
                      <span className="font-bold text-surface-900">총점 {record.totalScore}</span>
                    </div>

                    {record.notes && (
                      <div className="text-xs text-surface-600 bg-surface-50 rounded-md px-2 py-1.5">{record.notes}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setEditingRecord(record)} className="px-3 py-1.5 text-primary-600 bg-primary-50 rounded-md text-xs font-semibold hover:bg-primary-100 min-h-[36px]">수정</button>
                      <button onClick={() => deleteRecord(record.id)} className="px-3 py-1.5 text-danger-600 bg-danger-50 rounded-md text-xs font-semibold hover:bg-danger-100 min-h-[36px]">삭제</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 데스크탑: 테이블 뷰 */}
          <TableCard className="hidden sm:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <Checkbox
                        aria-label="전체 선택"
                        checked={pagedRecords.length > 0 && pagedRecords.every(r => selectedIds.has(r.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => new Set([...prev, ...pagedRecords.map(r => r.id)]));
                          } else {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              pagedRecords.forEach(r => next.delete(r.id));
                              return next;
                            });
                          }
                        }}
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('date')}>점검일{renderRawSortIcon('date')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('buildingName')}>소속 건물{renderRawSortIcon('buildingName')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('departmentName')}>부서명{renderRawSortIcon('departmentName')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('inspector')}>점검자{renderRawSortIcon('inspector')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('lights')}>{itemNames.lights}{renderRawSortIcon('lights')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('water')}>{itemNames.water}{renderRawSortIcon('water')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('recycle')}>{itemNames.recycle}{renderRawSortIcon('recycle')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('focus')}>{itemNames.focus}{renderRawSortIcon('focus')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('totalScore')}>총점{renderRawSortIcon('totalScore')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('status')}>상태{renderRawSortIcon('status')}</th>
                    <th className="py-3 px-4 font-semibold min-w-[200px]">특이사항</th>
                    <th className="py-3 px-4 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={13}>
                        <Empty message="선택된 기간에 입력된 점검 데이터가 없습니다." />
                      </td>
                    </tr>
                  ) : (
                    pagedRecords.map(record => {
                      return (
                        <tr key={record.id} className={`hover:bg-surface-50 group ${selectedIds.has(record.id) ? "bg-primary-50" : ""}`}>
                          <td className="py-2 px-4 w-10">
                            <Checkbox
                              aria-label={`${record.departmentName} 선택`}
                              checked={selectedIds.has(record.id)}
                              onChange={(e) => {
                                setSelectedIds(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(record.id);
                                  else next.delete(record.id);
                                  return next;
                                });
                              }}
                            />
                          </td>
                          <td className="py-2 px-4 text-surface-600">{record.date.split("T")[0]}</td>
                          <td className="py-2 px-4 text-surface-900">{getBuildingName(record.buildingId)}</td>
                          <td className="py-2 px-4 text-surface-900 font-medium">{record.departmentName}</td>
                          <td className="py-2 px-4">{record.inspector}</td>
                          <td className="py-2 px-4 text-center">{record.scores?.lights || 0}</td>
                          <td className="py-2 px-4 text-center">{record.scores?.water || 0}</td>
                          <td className="py-2 px-4 text-center">{record.scores?.recycle || 0}</td>
                          <td className="py-2 px-4 text-center">{record.scores?.focus || 0}</td>
                          <td className="py-2 px-4 text-center font-bold text-surface-900">{record.totalScore}</td>
                          <td className="py-2 px-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                              record.status === '정상' ? 'bg-success-100 text-success-700' :
                              record.status === '주의' ? 'bg-warning-100 text-warning-700' :
                              'bg-danger-100 text-danger-700'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {record.notes ? (
                              <Tooltip content={record.notes}>
                                <span className="truncate max-w-[200px] block">{record.notes}</span>
                              </Tooltip>
                            ) : (
                              <span className="truncate max-w-[200px] block"></span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingRecord(record)} className="px-2 py-1 text-primary-600 bg-primary-50 rounded text-xs hover:bg-primary-100">수정</button>
                              <button onClick={() => deleteRecord(record.id)} className="px-2 py-1 text-danger-600 bg-danger-50 rounded text-xs hover:bg-danger-100">삭제</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
          </TableCard>

          {totalPages > 1 && (
            <div className="px-4 py-3 bg-white rounded-xl border border-surface-200">
              <Pagination
                current={page}
                total={totalPages}
                totalItems={filteredRecords.length}
                pageSize={PAGE_SIZE}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      ) : activeTab === "report" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
            {periodFilter}
            <button
              onClick={exportReportCSV}
              disabled={reportData.summary.count === 0 && coverage.missingCount === 0}
              className="flex items-center gap-2 shrink-0 whitespace-nowrap px-4 py-2.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 text-sm font-medium rounded-lg transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "입력 건수", value: reportData.summary.count, unit: "건", color: "text-surface-900" },
              { label: "평균 점수", value: avgOf(reportData.summary) ?? "-", unit: "점", color: "text-surface-900" },
              { label: "정상", value: reportData.summary.normal, unit: "건", color: "text-success-600" },
              { label: "주의", value: reportData.summary.warning, unit: "건", color: "text-warning-600" },
              { label: "긴급", value: reportData.summary.urgent, unit: "건", color: "text-danger-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-surface-200 shadow-gh-sm px-4 py-3">
                <div className="text-xs font-medium text-surface-500">{s.label}</div>
                <div className={`mt-1 text-2xl font-bold ${s.color}`}>
                  {s.value}
                  {s.value !== "-" && <span className="ml-0.5 text-sm font-medium text-surface-400">{s.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* 입력 누락 확인 */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-gh-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-50 px-4 sm:px-6 py-4 border-b border-surface-200">
              <h3 className="font-semibold text-surface-900">입력 누락 확인</h3>
              <div className="text-sm text-surface-600">
                전체 <span className="font-semibold text-surface-900">{coverage.total}</span>개 부서 중{" "}
                <span className="font-semibold text-surface-900">{coverage.done}</span>개 입력
                {coverage.total > 0 && ` (${Math.round((coverage.done / coverage.total) * 100)}%)`}
                {" · "}
                <span className={`font-semibold ${coverage.missingCount > 0 ? "text-danger-600" : "text-success-600"}`}>
                  누락 {coverage.missingCount}개
                </span>
              </div>
            </div>
            {coverage.rows.length === 0 ? (
              <Empty message="조회할 부서가 없습니다." />
            ) : (
              <ul className="divide-y divide-surface-100">
                {coverage.rows.map((row) => (
                  <li key={row.id} className="px-4 sm:px-6 py-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium text-surface-900 w-12">{row.name}</span>
                      <span className="text-sm text-surface-600">
                        {row.done} / {row.total}개 부서 입력
                      </span>
                      <div className="flex-1 min-w-[80px] h-1.5 rounded-full bg-surface-100 overflow-hidden" aria-hidden="true">
                        <div
                          className={`h-full rounded-full ${row.missing.length === 0 ? "bg-success-500" : "bg-primary-500"}`}
                          style={{ width: `${(row.done / row.total) * 100}%` }}
                        />
                      </div>
                      {row.missing.length === 0 && (
                        <span className="text-xs font-semibold text-success-600">누락 없음</span>
                      )}
                    </div>
                    {row.missing.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {row.missing.map((d) => (
                          <span
                            key={d.id}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-danger-50 text-danger-700 border border-danger-100"
                          >
                            {d.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {filterInspector && (
              <p className="px-4 sm:px-6 py-2 text-xs text-surface-500 bg-surface-50 border-t border-surface-100">
                누락 여부는 점검자와 관계없이, 해당 기간에 입력이 하나도 없는 부서를 기준으로 합니다.
              </p>
            )}
          </div>

          {reportData.summary.count === 0 ? (
            <Empty message="조건에 맞는 점검 데이터가 없습니다." className="bg-white rounded-xl border border-surface-200" />
          ) : (
            <>
              <TableCard header={<h3 className="font-semibold text-surface-900">건물별 요약</h3>}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">건물</th>
                      <th className="py-3 px-4 font-semibold text-right">입력 건수</th>
                      <th className="py-3 px-4 font-semibold text-right">점검 부서 수</th>
                      <th className="py-3 px-4 font-semibold text-right">평균 점수</th>
                      <th className="py-3 px-4 font-semibold text-right">정상</th>
                      <th className="py-3 px-4 font-semibold text-right">주의</th>
                      <th className="py-3 px-4 font-semibold text-right">긴급</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {reportData.buildingRows.map(({ id, name, agg }) => (
                      <tr key={id} className="hover:bg-surface-50">
                        <td className="py-2 px-4 font-medium text-surface-900">{name}</td>
                        <td className="py-2 px-4 text-right font-mono">{agg.count}</td>
                        <td className="py-2 px-4 text-right font-mono">{agg.depts.size}</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold">{avgOf(agg)}</td>
                        <td className="py-2 px-4 text-right font-mono text-success-600">{agg.normal}</td>
                        <td className="py-2 px-4 text-right font-mono text-warning-600">{agg.warning}</td>
                        <td className="py-2 px-4 text-right font-mono text-danger-600">{agg.urgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>

              <TableCard header={<h3 className="font-semibold text-surface-900">건물 · 입력자별 현황</h3>}>
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">건물</th>
                      <th className="py-3 px-4 font-semibold">입력자</th>
                      <th className="py-3 px-4 font-semibold text-right">입력 건수</th>
                      <th className="py-3 px-4 font-semibold text-right">점검 부서 수</th>
                      <th className="py-3 px-4 font-semibold text-right">평균 점수</th>
                      <th className="py-3 px-4 font-semibold text-right">정상</th>
                      <th className="py-3 px-4 font-semibold text-right">주의</th>
                      <th className="py-3 px-4 font-semibold text-right">긴급</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {reportData.inspectorRows.map(({ buildingId, buildingName, inspector, agg }) => (
                      <tr key={`${buildingId}|${inspector}`} className="hover:bg-surface-50">
                        <td className="py-2 px-4 text-surface-700">{buildingName}</td>
                        <td className="py-2 px-4 font-medium text-surface-900">{inspector}</td>
                        <td className="py-2 px-4 text-right font-mono">{agg.count}</td>
                        <td className="py-2 px-4 text-right font-mono">{agg.depts.size}</td>
                        <td className="py-2 px-4 text-right font-mono font-semibold">{avgOf(agg)}</td>
                        <td className="py-2 px-4 text-right font-mono text-success-600">{agg.normal}</td>
                        <td className="py-2 px-4 text-right font-mono text-warning-600">{agg.warning}</td>
                        <td className="py-2 px-4 text-right font-mono text-danger-600">{agg.urgent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-semibold text-surface-700">조회 연도</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-white border border-surface-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold min-h-[44px]"
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = (new Date().getFullYear() - 2 + i).toString();
                  return <option key={y} value={y}>{y}년</option>;
                })}
              </select>
              {orgFilter}
            </div>
            <button
              onClick={exportAggregateCSV}
              className="flex items-center gap-2 shrink-0 whitespace-nowrap px-4 py-2.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 text-sm font-medium rounded-lg transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>

          {/* 모바일: 카드 뷰 */}
          <div className="sm:hidden space-y-3">
            {aggregateData.length === 0 ? (
              <Empty message={`${filterYear}년에 등록된 점검 데이터가 없습니다.`} className="bg-white rounded-xl border border-surface-200" />
            ) : (
              aggregateData.map(row => (
                <div key={row.departmentId} className="bg-white rounded-xl border border-surface-200 p-4 shadow-gh-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-surface-900">{row.departmentName}</div>
                    <div className="text-sm font-bold text-surface-800 bg-surface-50 rounded-md px-2 py-1 font-mono">
                      연간 {row.yearlyAvg !== null ? row.yearlyAvg : "-"}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                      const val = row[`m${m}`];
                      const numVal = val !== null ? Number(val) : null;
                      return (
                        <div key={m} className="bg-surface-50 rounded-md py-1.5">
                          <div className="text-[10px] text-surface-500">{m}월</div>
                          <div className={`text-sm font-mono font-medium ${
                            numVal === null ? "text-surface-300" :
                            numVal >= 18 ? "text-success-600" :
                            numVal < 15 ? "text-danger-500" : "text-surface-700"
                          }`}>
                            {numVal !== null ? numVal : "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 데스크탑: 테이블 뷰 */}
          <TableCard className="hidden sm:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold sticky left-0 bg-surface-50 z-10 w-48 shadow-[1px_0_0_0_var(--color-surface-200)] cursor-pointer hover:bg-surface-100 select-none" onClick={() => handleAggSort('departmentName')}>
                      부서명{renderAggSortIcon('departmentName')}
                    </th>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <th key={m} className="py-3 px-4 font-semibold text-center border-l border-surface-100 cursor-pointer hover:bg-surface-100 select-none" onClick={() => handleAggSort(`m${m}` as AggSortKey)}>
                        {m}월{renderAggSortIcon(`m${m}` as AggSortKey)}
                      </th>
                    ))}
                    <th className="py-3 px-4 font-semibold text-center bg-surface-100 border-l border-surface-200 cursor-pointer hover:bg-surface-200 select-none" onClick={() => handleAggSort('yearlyAvg')}>
                      연간 평균{renderAggSortIcon('yearlyAvg')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {aggregateData.length === 0 ? (
                    <tr>
                      <td colSpan={14}>
                        <Empty message={`${filterYear}년에 등록된 점검 데이터가 없습니다.`} />
                      </td>
                    </tr>
                  ) : (
                    aggregateData.map(row => (
                      <tr key={row.departmentId} className="hover:bg-surface-50">
                        <td className="py-2 px-4 font-medium text-surface-900 sticky left-0 bg-white shadow-[1px_0_0_0_var(--color-surface-200)]">
                          {row.departmentName}
                        </td>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
                          const val = row[`m${m}`];
                          const numVal = val !== null ? Number(val) : null;
                          return (
                            <td key={m} className="py-2 px-4 text-center border-l border-surface-50 font-mono">
                              {numVal !== null ? (
                                <span className={numVal >= 18 ? "text-success-600 font-medium" : numVal < 15 ? "text-danger-500 font-medium" : "text-surface-700"}>
                                  {numVal}
                                </span>
                              ) : (
                                <span className="text-surface-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-4 text-center font-bold text-surface-800 bg-surface-50/50 border-l border-surface-100 shadow-inner block h-full min-h-12 flex items-center justify-center font-mono">
                          {row.yearlyAvg !== null ? row.yearlyAvg : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
          </TableCard>
        </div>
      )}
      <RecordEditDialog
        record={editingRecord}
        buildingName={editingRecord ? getBuildingName(editingRecord.buildingId) : ""}
        members={members}
        onClose={() => setEditingRecord(null)}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

