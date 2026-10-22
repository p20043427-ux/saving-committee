import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { liveQuery } from "@/src/lib/db";

/** 점수 컬럼(lights/water/recycle/focus) ↔ sc_inspection_items 항목 ID 매핑 */
export const SCORE_ITEM_IDS = {
  lights: "I01",
  water: "I02",
  recycle: "I03",
  focus: "I04",
} as const;

export type ScoreKey = keyof typeof SCORE_ITEM_IDS;

export const SCORE_KEYS: ScoreKey[] = ["lights", "water", "recycle", "focus"];

export const DEFAULT_ITEM_NAMES: Record<ScoreKey, string> = {
  lights: "소등관리",
  water: "수압관리",
  recycle: "분리수거",
  focus: "중점점검",
};

/**
 * 시스템 설정(sc_inspection_items)에서 관리하는 점검 항목명을 점수 컬럼별로 돌려준다.
 * 테이블을 읽지 못하거나 항목이 없으면 기본 이름을 쓴다.
 * 점수는 4개 고정 컬럼에 저장되므로 I01~I04 항목의 이름만 반영된다.
 */
export function useInspectionItemNames(): Record<ScoreKey, string> {
  const [names, setNames] = useState<Record<ScoreKey, string>>(DEFAULT_ITEM_NAMES);

  useEffect(() => {
    return liveQuery<{ id: string; name: string }>(
      "sc_inspection_items",
      () => supabase.from("sc_inspection_items").select("id,name"),
      (rows) => {
        const next = { ...DEFAULT_ITEM_NAMES };
        for (const key of SCORE_KEYS) {
          const hit = rows.find((r) => r.id === SCORE_ITEM_IDS[key]);
          if (hit?.name?.trim()) next[key] = hit.name.trim();
        }
        setNames(next);
      },
      () => setNames(DEFAULT_ITEM_NAMES)
    );
  }, []);

  return names;
}
