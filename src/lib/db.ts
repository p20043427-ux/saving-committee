import { supabase } from './supabase';

/**
 * Firestore onSnapshot 을 대체하는 경량 실시간 구독 헬퍼.
 * 1) build() 로 만든 쿼리를 즉시 1회 실행해 초기 데이터를 전달하고
 * 2) 해당 테이블의 변경 이벤트가 오면 build() 를 다시 실행해 최신 데이터를 전달한다.
 * 반환값은 구독 해제 함수(onSnapshot 의 unsubscribe 와 동일한 역할).
 */
let channelSeq = 0;

export function liveQuery<T = any>(
  table: string,
  build: () => PromiseLike<{ data: T[] | null; error: any }>,
  onData: (rows: T[]) => void,
  onError?: (error: any) => void
): () => void {
  let active = true;

  const run = async () => {
    const { data, error } = await build();
    if (!active) return;
    if (error) {
      onError?.(error);
      return;
    }
    onData(data || []);
  };

  run();

  const channel = supabase
    .channel(`live_${table}_${++channelSeq}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      run();
    })
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

/* ------------------------------------------------------------------ *
 * 매퍼: DB 행(snake_case) <-> 앱 도메인 객체(기존 Firestore 형태 유지)
 * ------------------------------------------------------------------ */

export interface RecordRow {
  id: string;
  building_id: string;
  department_id: string;
  department_name: string;
  inspector: string;
  date: string;
  lights: number;
  water: number;
  recycle: number;
  focus: number;
  total_score: number;
  notes: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface AppRecord {
  id: string;
  buildingId: string;
  departmentId: string;
  departmentName: string;
  inspector: string;
  date: string;
  scores: { lights: number; water: number; recycle: number; focus: number };
  totalScore: number;
  notes: string;
  status: string;
  userId: string;
  createdAt: string;
}

export function rowToRecord(r: RecordRow): AppRecord {
  return {
    id: r.id,
    buildingId: r.building_id,
    departmentId: r.department_id,
    departmentName: r.department_name || '',
    inspector: r.inspector || '',
    date: r.date || '',
    scores: {
      lights: r.lights || 0,
      water: r.water || 0,
      recycle: r.recycle || 0,
      focus: r.focus || 0,
    },
    totalScore: r.total_score || 0,
    notes: r.notes || '',
    status: r.status || '정상',
    userId: r.user_id || '',
    createdAt: r.created_at || '',
  };
}

/** 점검 점수 → 상태 판정 (기존 3곳에 흩어져 있던 로직을 한 곳으로 통합) */
export function computeStatus(
  scores: { lights: number; water: number; recycle: number; focus: number },
  notes: string
): '정상' | '주의' | '긴급' {
  const total = (scores.lights || 0) + (scores.water || 0) + (scores.recycle || 0) + (scores.focus || 0);
  if (total < 12 || scores.lights <= 2 || scores.water <= 2) return '긴급';
  if (total < 15 || (notes && notes.trim().length > 1)) return '주의';
  return '정상';
}
