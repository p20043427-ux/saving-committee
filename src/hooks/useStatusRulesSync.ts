import { useEffect } from "react";
import { supabase } from "@/src/lib/supabase";
import { liveQuery } from "@/src/lib/db";
import {
  STATUS_RULES_KEY,
  applyStatusRulesFromDb,
  markStatusRulesLoadError,
} from "@/src/lib/statusRules";

interface SettingRow {
  key: string;
  value: unknown;
}

/** sc_settings의 상태 판정 기준을 구독해 computeStatus에 반영한다. 앱 레이아웃에서 한 번만 호출. */
export function useStatusRulesSync() {
  useEffect(() => {
    return liveQuery<SettingRow>(
      "sc_settings",
      () => supabase.from("sc_settings").select("key,value").eq("key", STATUS_RULES_KEY),
      (rows) => applyStatusRulesFromDb(rows[0]?.value),
      () => markStatusRulesLoadError()
    );
  }, []);
}
