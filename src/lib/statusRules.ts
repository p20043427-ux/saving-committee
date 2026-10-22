import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";

/** 점검 상태(정상/주의/긴급) 판정 기준. 0은 해당 조건을 사용하지 않음을 뜻한다. */
export interface StatusRules {
  /** 총점이 이 값 미만이면 긴급 */
  urgentTotalBelow: number;
  /** 조명/전열 점수가 이 값 이하이면 긴급 (0 = 사용 안 함) */
  urgentLightsAtMost: number;
  /** 수돗물 점수가 이 값 이하이면 긴급 (0 = 사용 안 함) */
  urgentWaterAtMost: number;
  /** 총점이 이 값 미만이면 주의 */
  warningTotalBelow: number;
  /** 특이사항이 입력되면 주의 */
  warningOnNotes: boolean;
}

export const DEFAULT_STATUS_RULES: StatusRules = {
  urgentTotalBelow: 12,
  urgentLightsAtMost: 2,
  urgentWaterAtMost: 2,
  warningTotalBelow: 15,
  warningOnNotes: true,
};

export const STATUS_RULES_KEY = "status_rules";
export const MAX_TOTAL_SCORE = 20;
export const MAX_ITEM_SCORE = 5;

export const SETTINGS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS sc_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sc_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_settings read" ON sc_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sc_settings insert" ON sc_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sc_settings update" ON sc_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE sc_settings;`;

interface StatusRulesState {
  rules: StatusRules;
  /** DB에서 한 번이라도 읽어왔는지 */
  loaded: boolean;
  /** 설정 테이블을 읽지 못함 (테이블 미생성 등) → 기본값으로 동작 중 */
  loadError: boolean;
}

let state: StatusRulesState = { rules: DEFAULT_STATUS_RULES, loaded: false, loadError: false };
const listeners = new Set<() => void>();

function setState(next: StatusRulesState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** computeStatus 등 React 밖에서 현재 기준을 읽을 때 사용 */
export function getStatusRules(): StatusRules {
  return state.rules;
}

export function useStatusRulesState(): StatusRulesState {
  return useSyncExternalStore(subscribe, () => state);
}

/** DB에서 읽은 값을 검증해 기준으로 반영 */
export function applyStatusRulesFromDb(raw: unknown) {
  setState({ rules: normalizeStatusRules(raw), loaded: true, loadError: false });
}

export function markStatusRulesLoadError() {
  setState({ ...state, loaded: true, loadError: true });
}

export function normalizeStatusRules(raw: unknown): StatusRules {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fallback;
  return {
    urgentTotalBelow: num(o.urgentTotalBelow, DEFAULT_STATUS_RULES.urgentTotalBelow),
    urgentLightsAtMost: num(o.urgentLightsAtMost, DEFAULT_STATUS_RULES.urgentLightsAtMost),
    urgentWaterAtMost: num(o.urgentWaterAtMost, DEFAULT_STATUS_RULES.urgentWaterAtMost),
    warningTotalBelow: num(o.warningTotalBelow, DEFAULT_STATUS_RULES.warningTotalBelow),
    warningOnNotes:
      typeof o.warningOnNotes === "boolean" ? o.warningOnNotes : DEFAULT_STATUS_RULES.warningOnNotes,
  };
}

/** 저장 전 검증. 문제가 있으면 사용자에게 보여줄 메시지를, 없으면 null을 반환 */
export function validateStatusRules(r: StatusRules): string | null {
  const inRange = (v: number, max: number) => Number.isInteger(v) && v >= 0 && v <= max;
  if (!inRange(r.urgentTotalBelow, MAX_TOTAL_SCORE) || !inRange(r.warningTotalBelow, MAX_TOTAL_SCORE)) {
    return `총점 기준은 0~${MAX_TOTAL_SCORE}점 사이의 정수여야 합니다.`;
  }
  if (!inRange(r.urgentLightsAtMost, MAX_ITEM_SCORE) || !inRange(r.urgentWaterAtMost, MAX_ITEM_SCORE)) {
    return `항목 점수 기준은 0~${MAX_ITEM_SCORE}점 사이의 정수여야 합니다.`;
  }
  if (r.warningTotalBelow < r.urgentTotalBelow) {
    return "주의 총점 기준은 긴급 총점 기준보다 작을 수 없습니다.";
  }
  return null;
}

/** 현재 기준을 사람이 읽을 수 있는 문장으로 설명 */
export function describeStatusRules(r: StatusRules): { urgent: string[]; warning: string[] } {
  const urgent: string[] = [];
  if (r.urgentTotalBelow > 0) urgent.push(`총점 ${r.urgentTotalBelow}점 미만`);
  if (r.urgentLightsAtMost > 0) urgent.push(`조명/전열 ${r.urgentLightsAtMost}점 이하`);
  if (r.urgentWaterAtMost > 0) urgent.push(`수돗물 ${r.urgentWaterAtMost}점 이하`);
  const warning: string[] = [];
  if (r.warningTotalBelow > 0) warning.push(`총점 ${r.warningTotalBelow}점 미만`);
  if (r.warningOnNotes) warning.push("특이사항 입력");
  return { urgent, warning };
}

/** 기준을 DB에 저장하고 앱 전체에 즉시 반영 */
export async function saveStatusRules(rules: StatusRules): Promise<void> {
  const { error } = await supabase
    .from("sc_settings")
    .upsert({ key: STATUS_RULES_KEY, value: rules, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
  setState({ rules, loaded: true, loadError: false });
}
