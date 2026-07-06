import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/src/lib/supabase";
import { liveQuery, rowToRecord, computeStatus, RecordRow } from "@/src/lib/db";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { Download, CalendarDays, BarChart2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "../components/ui/Toast";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

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

export function DataManagement() {
  const { user } = useAuth();
  const { buildings, departments, isLoading: orgLoading } = useOrganization();
  const [allRecords, setAllRecords] = useState<RecordDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"raw" | "aggregate">("raw");

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

  // Pagination State (Raw)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecordDoc>>({});
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
  }, [page, filterType, filterMonth, startDate, endDate]);

  // 필터 변경 시 page 리셋
  useEffect(() => {
    setPage(1);
  }, [filterType, filterMonth, startDate, endDate, rawSortConfig]);

  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || id;

  // Computed: Display Records (Raw)
  const filteredRecords = useMemo(() => {
    let filtered = allRecords.filter(r => {
      const d = r.date.split("T")[0];
      if (filterType === "month") {
        return d.startsWith(filterMonth);
      } else {
        return d >= startDate && d <= endDate;
      }
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
  }, [allRecords, filterType, filterMonth, startDate, endDate, rawSortConfig, buildings]);

  const pagedRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);

  // Computed: Aggregate Data
  const aggregateData = useMemo(() => {
    const deptStats: Record<string, { id: string, name: string, months: Record<number, {total: number, count: number}> }> = {};
    
    departments.forEach(d => {
      deptStats[d.id] = { id: d.id, name: d.name, months: {} };
    });
    
    allRecords.forEach(r => {
      if (!r.date.startsWith(filterYear)) return;
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
  }, [allRecords, filterYear, departments, aggSortConfig]);

  // Export handlers
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

  const renderRawSortIcon = (key: RawSortKey) => {
    if (rawSortConfig?.key !== key) return <span className="w-3 inline-block" />;
    return rawSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary-500"/> : <ArrowDown className="w-3 h-3 inline ml-1 text-primary-500"/>;
  };

  const renderAggSortIcon = (key: AggSortKey) => {
    if (aggSortConfig?.key !== key) return <span className="w-3 inline-block" />;
    return aggSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1 text-primary-500"/> : <ArrowDown className="w-3 h-3 inline ml-1 text-primary-500"/>;
  };

  // Editing logic
  const startEdit = (record: RecordDoc) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleScoreChange = (type: keyof RecordDoc['scores'], value: string) => {
    const num = parseInt(value) || 0;
    const clamped = Math.min(Math.max(num, 0), 5);

    setEditForm(prev => {
      const newScores = { ...prev.scores, [type]: clamped } as RecordDoc['scores'];
      const totalScore = (newScores.lights || 0) + (newScores.water || 0) + (newScores.recycle || 0) + (newScores.focus || 0);
      const status = computeStatus(newScores, prev.notes || "");
      return { ...prev, scores: newScores, totalScore, status };
    });
  };

  const handleNotesChange = (value: string) => {
    setEditForm(prev => {
      const scores = prev.scores || { lights: 0, water: 0, recycle: 0, focus: 0 };
      const status = computeStatus(scores, value);
      return { ...prev, notes: value, status };
    });
  };

  const saveEdit = async (id: string) => {
    if (!editForm || !id) return;
    try {
      const s = editForm.scores || { lights: 0, water: 0, recycle: 0, focus: 0 };
      const { error } = await supabase
        .from("sc_records")
        .update({
          inspector: editForm.inspector,
          lights: s.lights,
          water: s.water,
          recycle: s.recycle,
          focus: s.focus,
          total_score: editForm.totalScore,
          notes: editForm.notes,
          status: editForm.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
    } catch (error) {
      console.error("저장 오류:", error);
      toast.error("문서 업데이트 중 오류가 발생했습니다.");
    }
  };

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 border-l-4 border-primary-500 pl-3">점검 데이터 관리</h1>
          <p className="text-surface-500 text-sm mt-1">상세 점검 내역을 관리하고 연간/월별 점수표를 확인하세요.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-surface-200">
        <button
          onClick={() => setActiveTab("raw")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === "raw" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">상세 점검 내역</span>
          <span className="sm:hidden">상세</span>
        </button>
        <button
          onClick={() => setActiveTab("aggregate")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === "aggregate" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span className="hidden sm:inline">부서별 월간/연간 점수표</span>
          <span className="sm:hidden">집계</span>
        </button>
      </div>

      {activeTab === "raw" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
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
            </div>
            <button
              onClick={exportRawCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 text-sm font-medium rounded-lg transition-colors min-h-[44px]"
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

          <div className="bg-white rounded-xl shadow-gh-sm border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface-50 text-surface-600 border-b border-surface-200">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
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
                        className="rounded border-surface-300"
                      />
                    </th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('date')}>점검일{renderRawSortIcon('date')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('buildingName')}>소속 건물{renderRawSortIcon('buildingName')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('departmentName')}>부서명{renderRawSortIcon('departmentName')}</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('inspector')}>점검자{renderRawSortIcon('inspector')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('lights')}>조명/전열{renderRawSortIcon('lights')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('water')}>수돗물{renderRawSortIcon('water')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('recycle')}>재활용{renderRawSortIcon('recycle')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('focus')}>관심도{renderRawSortIcon('focus')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('totalScore')}>총점{renderRawSortIcon('totalScore')}</th>
                    <th className="py-3 px-4 font-semibold text-center cursor-pointer hover:bg-surface-100 select-none whitespace-nowrap" onClick={() => handleRawSort('status')}>상태{renderRawSortIcon('status')}</th>
                    <th className="py-3 px-4 font-semibold min-w-[200px]">특이사항</th>
                    <th className="py-3 px-4 font-semibold text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-surface-500">
                        선택된 기간에 입력된 점검 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    pagedRecords.map(record => {
                      const isEditing = editingId === record.id;
                      return (
                        <tr key={record.id} className={`hover:bg-surface-50 group ${selectedIds.has(record.id) ? "bg-primary-50" : ""}`}>
                          <td className="py-2 px-4 w-10">
                            <input
                              type="checkbox"
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
                              className="rounded border-surface-300"
                            />
                          </td>
                          <td className="py-2 px-4 text-surface-600">{record.date.split("T")[0]}</td>
                          <td className="py-2 px-4 text-surface-900">{getBuildingName(record.buildingId)}</td>
                          <td className="py-2 px-4 text-surface-900 font-medium">{record.departmentName}</td>
                          <td className="py-2 px-4">
                            {isEditing ? (
                              <input 
                                type="text" 
                                className="w-20 px-2 py-1 text-sm border border-surface-300 rounded" 
                                value={editForm.inspector || ""} 
                                onChange={(e) => setEditForm({ ...editForm, inspector: e.target.value })}
                              />
                            ) : record.inspector}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="5" className="w-12 px-1 py-1 text-center text-sm border border-surface-300 rounded" 
                                value={editForm.scores?.lights} onChange={(e) => handleScoreChange('lights', e.target.value)} />
                            ) : record.scores?.lights || 0}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="5" className="w-12 px-1 py-1 text-center text-sm border border-surface-300 rounded" 
                                value={editForm.scores?.water} onChange={(e) => handleScoreChange('water', e.target.value)} />
                            ) : record.scores?.water || 0}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="5" className="w-12 px-1 py-1 text-center text-sm border border-surface-300 rounded" 
                                value={editForm.scores?.recycle} onChange={(e) => handleScoreChange('recycle', e.target.value)} />
                            ) : record.scores?.recycle || 0}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isEditing ? (
                              <input type="number" min="0" max="5" className="w-12 px-1 py-1 text-center text-sm border border-surface-300 rounded" 
                                value={editForm.scores?.focus} onChange={(e) => handleScoreChange('focus', e.target.value)} />
                            ) : record.scores?.focus || 0}
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-surface-900">
                            {isEditing ? editForm.totalScore : record.totalScore}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {isEditing ? (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                                editForm.status === '정상' ? 'bg-success-100 text-success-700' :
                                editForm.status === '주의' ? 'bg-warning-100 text-warning-700' :
                                'bg-danger-100 text-danger-700'
                              }`}>
                                {editForm.status}
                              </span>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                                record.status === '정상' ? 'bg-success-100 text-success-700' :
                                record.status === '주의' ? 'bg-warning-100 text-warning-700' :
                                'bg-danger-100 text-danger-700'
                              }`}>
                                {record.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {isEditing ? (
                              <input 
                                type="text" 
                                className="w-full min-w-[200px] px-2 py-1 text-sm border border-surface-300 rounded" 
                                value={editForm.notes || ""} 
                                onChange={(e) => handleNotesChange(e.target.value)}
                              />
                            ) : (
                              <span className="truncate max-w-[200px] block" title={record.notes}>
                                {record.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => saveEdit(record.id)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">저장</button>
                                <button onClick={cancelEdit} className="px-2 py-1 bg-surface-200 text-surface-700 rounded text-xs hover:bg-surface-300">취소</button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => startEdit(record)} className="px-2 py-1 text-primary-600 bg-primary-50 rounded text-xs hover:bg-primary-100">수정</button>
                                <button onClick={() => deleteRecord(record.id)} className="px-2 py-1 text-danger-600 bg-danger-50 rounded text-xs hover:bg-danger-100">삭제</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
                <span className="text-xs text-surface-500">
                  전체 {filteredRecords.length}건 중 {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filteredRecords.length)}건
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p-1))}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm border border-surface-300 rounded-md disabled:opacity-40 hover:bg-surface-50 min-h-[44px]"
                  >이전</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`px-3 py-2 text-sm rounded-md border min-h-[44px] ${n === page ? 'bg-primary-700 text-white border-primary-700' : 'border-surface-300 hover:bg-surface-50'}`}
                    >{n}</button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p+1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm border border-surface-300 rounded-md disabled:opacity-40 hover:bg-surface-50 min-h-[44px]"
                  >다음</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-50 p-4 rounded-xl border border-surface-200">
            <div className="flex items-center gap-3">
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
            </div>
            <button
              onClick={exportAggregateCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 text-sm font-medium rounded-lg transition-colors min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-gh-sm border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
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
                      <td colSpan={14} className="py-8 text-center text-surface-500">
                        {filterYear}년에 등록된 점검 데이터가 없습니다.
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
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

