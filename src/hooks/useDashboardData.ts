import { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";
import { liveQuery, uniqueBy } from "@/src/lib/db";

interface ScheduleRow { id: string; date: string; turn: number; inspectors: string[]; month: string; }
interface EventRow { id: string; date: string; title: string; attendees: string[]; month: string; }
interface RecordSummary { department_id: string; status: string; total_score: number; created_at?: string; }
interface MonthlyRecord { department_id: string; status: string; total_score: number; date: string; }

export function useDashboardData() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [todayRecords, setTodayRecords] = useState<RecordSummary[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(liveQuery<ScheduleRow>(
      "sc_schedules",
      () => supabase.from("sc_schedules").select("*").eq("month", currentMonth).order("date", { ascending: true }),
      (rows) => setSchedules(rows.map((s) => ({ ...s, inspectors: s.inspectors ?? [] })))
    ));

    unsubs.push(liveQuery<EventRow>(
      "sc_events",
      () => supabase.from("sc_events").select("*").eq("month", currentMonth).order("date", { ascending: true }),
      (rows) => setEvents(rows.map((e) => ({ ...e, attendees: e.attendees ?? [] })))
    ));

    const startOfDay = today + "T00:00:00";
    const endOfDay = today + "T23:59:59.999Z";

    unsubs.push(liveQuery<RecordSummary>(
      "sc_records",
      () => supabase.from("sc_records").select("department_id, status, total_score, created_at").gte("date", startOfDay).lte("date", endOfDay).order("created_at", { ascending: false }),
      // 같은 날 같은 부서를 여러 번 입력했으면 최신 1건만 현황에 반영
      (rows) => { setTodayRecords(uniqueBy(rows, (r) => r.department_id)); setIsLoading(false); },
      () => setIsLoading(false)
    ));

    unsubs.push(liveQuery<MonthlyRecord>(
      "sc_records_monthly",
      () => supabase.from("sc_records").select("department_id, status, total_score, date").gte("date", currentMonth + "-01T00:00:00").lte("date", currentMonth + "-31T23:59:59"),
      (rows) => setMonthlyRecords(rows)
    ));

    return () => unsubs.forEach((u) => u());
  }, [today, currentMonth]);

  return { schedules, events, todayRecords, monthlyRecords, isLoading, today, currentMonth };
}
