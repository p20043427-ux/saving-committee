import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/Card";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";

interface RecordData {
  id: string;
  departmentId: string;
  totalScore: number;
  date: string;
  scores: {
    lights: number;
    water: number;
    recycle: number;
    focus: number;
  }
}

export function YearlyReport() {
  const { user } = useAuth();
  const { buildings, departments, isLoading: orgLoading } = useOrganization();
  const [selectedDept, setSelectedDept] = useState<string>(""); 
  const [records, setRecords] = useState<RecordData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterType, setFilterType] = useState<"month" | "range">("month");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0].id);
    }
  }, [departments]);

  useEffect(() => {
    let isMounted = true;
    const fetchRecords = async () => {
      setIsLoading(true);
      try {
        let startOfDay = "";
        let endOfDay = "";

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

        const { data, error } = await supabase
          .from("sc_records")
          .select("*")
          .gte("date", startOfDay)
          .lt("date", endOfDay);
        if (error) throw error;

        const fetched: RecordData[] = (data || []).map((d: any) => ({
          id: d.id,
          departmentId: d.department_id,
          totalScore: d.total_score,
          date: d.date,
          scores: {
            lights: d.lights || 0,
            water: d.water || 0,
            recycle: d.recycle || 0,
            focus: d.focus || 0,
          },
        }));
        if (isMounted) setRecords(fetched);
      } catch (error) {
        console.error("YearlyReport fetch error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchRecords();
    return () => { isMounted = false; };
  }, [filterType, filterMonth, startDate, endDate]);

  const filteredRecords = records;

  // 전체 부서 일별 가공 & 단일 부서 일별 가공 (해당 기간 내)
  const periodData = useMemo(() => {
    const dayStatsAll: Record<string, { total: number; count: number }> = {};
    const dayStatsDept: Record<string, { total: number; count: number; lights: number; water: number; recycle: number; focus: number }> = {};
    
    filteredRecords.forEach(record => {
      const dayKey = record.date.slice(0, 10); // yyyy-mm-dd
      
      // 전체 부서 통계
      if (!dayStatsAll[dayKey]) dayStatsAll[dayKey] = { total: 0, count: 0 };
      dayStatsAll[dayKey].total += record.totalScore;
      dayStatsAll[dayKey].count += 1;

      // 선택된 부서 통계
      if (record.departmentId === selectedDept) {
        if (!dayStatsDept[dayKey]) dayStatsDept[dayKey] = { total: 0, count: 0, lights: 0, water: 0, recycle: 0, focus: 0 };
        dayStatsDept[dayKey].total += record.totalScore;
        dayStatsDept[dayKey].lights += record.scores?.lights || 0;
        dayStatsDept[dayKey].water += record.scores?.water || 0;
        dayStatsDept[dayKey].recycle += record.scores?.recycle || 0;
        dayStatsDept[dayKey].focus += record.scores?.focus || 0;
        dayStatsDept[dayKey].count += 1;
      }
    });

    const result = Object.keys(dayStatsAll).map(dayKey => {
      const allAvg = dayStatsAll[dayKey].count > 0 
        ? Math.round((dayStatsAll[dayKey].total / dayStatsAll[dayKey].count) * 10) / 10 
        : null;
      
      const deptData = dayStatsDept[dayKey];
      const deptAvg = deptData && deptData.count > 0 
        ? Math.round((deptData.total / deptData.count) * 10) / 10 
        : null;
      
      return {
        date: dayKey,
        shortDate: dayKey.substring(5), // mm-dd
        allAverage: allAvg,
        deptAverage: deptAvg,
        lights: deptData ? Math.round((deptData.lights / deptData.count) * 10) / 10 : 0,
        water: deptData ? Math.round((deptData.water / deptData.count) * 10) / 10 : 0,
        recycle: deptData ? Math.round((deptData.recycle / deptData.count) * 10) / 10 : 0,
        focus: deptData ? Math.round((deptData.focus / deptData.count) * 10) / 10 : 0,
      };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords, selectedDept]);

  // 기준(filteredRecords)에 대해 점수가 가장 높은 / 낮은 부서 산출
  const extremumStats = useMemo(() => {
    const deptScores: Record<string, { total: number; count: number }> = {};
    
    filteredRecords.forEach(r => {
      if (!deptScores[r.departmentId]) deptScores[r.departmentId] = { total: 0, count: 0 };
      deptScores[r.departmentId].total += r.totalScore;
      deptScores[r.departmentId].count += 1;
    });

    let highestDept = null;
    let lowestDept = null;
    let highestScore = -1;
    let lowestScore = 999;

    departments.forEach(dept => {
      const s = deptScores[dept.id];
      if (s && s.count > 0) {
        const avg = s.total / s.count;
        if (avg > highestScore) {
          highestScore = avg;
          highestDept = dept;
        }
        if (avg < lowestScore) {
          lowestScore = avg;
          lowestDept = dept;
        }
      }
    });

    return {
      highestDept,
      highestScore: highestScore > -1 ? Math.round(highestScore * 10)/10 : null,
      lowestDept,
      lowestScore: lowestScore < 999 ? Math.round(lowestScore * 10)/10 : null
    };
  }, [filteredRecords, departments]);

  if (isLoading || orgLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-surface-500">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p>리포트를 생성하기 위해 점검 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const selectedDeptInfo = departments.find(d => d.id === selectedDept);
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-surface-200 pb-4">
        <PageHeader
          title="부서별 기간 리포트"
          subtitle="지정된 기간 내의 점검 데이터와 병원 전체 평균을 비교합니다."
          action={
            <div className="flex flex-wrap items-center gap-2 bg-surface-50 p-2 rounded-lg border border-surface-200">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "month" | "range")}
                className="bg-white border border-surface-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="month">월별 조회</option>
                <option value="range">기간 조회</option>
              </select>

              {filterType === "month" ? (
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-white border border-surface-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-surface-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-32"
                  />
                  <span className="text-surface-400">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-surface-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-32"
                  />
                </div>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-success-50 border border-success-100 rounded-xl p-5 flex flex-col justify-center shadow-gh-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <span className="text-2xl">🏆</span>
               <h3 className="font-bold text-success-800 text-lg">해당 기간 최우수 부서</h3>
             </div>
          </div>
          {extremumStats.highestDept ? (
            <div>
              <div className="text-xl font-bold text-success-700">{extremumStats.highestDept.name}</div>
              <div className="text-sm text-success-600 font-medium">평균 {extremumStats.highestScore}점</div>
            </div>
          ) : (
            <div className="text-sm text-success-600/70">데이터가 없습니다.</div>
          )}
        </div>

        <div className="bg-danger-50 border border-danger-100 rounded-xl p-5 flex flex-col justify-center shadow-gh-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <span className="text-2xl">📉</span>
               <h3 className="font-bold text-danger-800 text-lg">해당 기간 개선 필요 부서</h3>
             </div>
          </div>
          {extremumStats.lowestDept ? (
            <div>
              <div className="text-xl font-bold text-danger-700">{extremumStats.lowestDept.name}</div>
              <div className="text-sm text-danger-600 font-medium">평균 {extremumStats.lowestScore}점</div>
            </div>
          ) : (
            <div className="text-sm text-danger-600/70">데이터가 없습니다.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2 shadow-gh-sm border-surface-200">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <CardTitle>기간 내 점검일별 총점 추이</CardTitle>
            <select 
              className="rounded-lg border border-surface-300 px-4 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white font-medium"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">비교할 부서 선택</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="h-[350px]">
            {periodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={periodData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e9f0" />
                  <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    cursor={{stroke: '#e3e9f0', strokeWidth: 2}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e3e9f0', boxShadow: '0 12px 32px rgba(15,48,83,.12), 0 2px 6px rgba(15,48,83,.06)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Line type="monotone" name="해당일 전체 평균" dataKey="allAverage" stroke="#a7b3c2" strokeDasharray="5 5" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                  <Line type="monotone" name={`${selectedDeptInfo?.name || "-"} 점수`} dataKey="deptAverage" stroke="#0f5daa" strokeWidth={3} activeDot={{ r: 8, strokeWidth: 0, fill: '#0f5daa' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-surface-500">해당 기간에 점검 데이터가 없습니다.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-gh-sm border-surface-200">
          <CardHeader>
            <CardTitle>{selectedDeptInfo?.name || "선택된 부서"} 세부 항목별 득점 추이</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {periodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e9f0" />
                  <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    cursor={{fill: '#f6f8fb'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(15,48,83,.08), 0 1px 3px rgba(15,48,83,.05)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="lights" name="소등" fill="#f78b1e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="water" name="수압" fill="#2270b4" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="recycle" name="분리수거" fill="#1e9e5a" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="focus" name="중점점검" fill="#de4a47" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-surface-500">데이터가 없습니다.</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


