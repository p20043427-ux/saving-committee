import React, { useState, useMemo, useEffect } from "react";
import { MOCK_INSPECTION_ITEMS } from "@/src/lib/data";
import { supabase } from "@/src/lib/supabase";
import { computeStatus } from "@/src/lib/db";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { Button } from "@/src/components/ui/Button";
import { Select, Textarea } from "@/src/components/ui/Input";

interface InlineInputFormProps {
  buildingId: string;
  departmentId: string;
  inspectionDate: string;
  defaultInspector?: string;
  members?: {id: string, name: string}[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function InlineInputForm({ buildingId, departmentId, inspectionDate, defaultInspector = "", members = [], onSuccess, onCancel }: InlineInputFormProps) {
  const { user } = useAuth();
  const { buildings, departments } = useOrganization();
  const [inspector, setInspector] = useState(defaultInspector);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 상위에서 기본 점검자 이름이 변경되면 로컬 상태도 업데이트 (입력된 값이 없을 때만)
  useEffect(() => {
    if (defaultInspector && !inspector) {
      setInspector(defaultInspector);
    }
  }, [defaultInspector]);

  const initialScores = useMemo(() => {
    return MOCK_INSPECTION_ITEMS.reduce((acc, item) => {
      acc[item.id] = 3;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const [scores, setScores] = useState<Record<string, number>>(initialScores);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!inspector) {
      setErrorMessage("점검자 성명을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const bName = buildings.find(b => b.id === buildingId)?.name || "";
      const deptName = departments.find(d => d.id === departmentId)?.name || "";
      
      const scoreObj = {
        lights: scores["I01"] || 0,
        water: scores["I02"] || 0,
        recycle: scores["I03"] || 0,
        focus: scores["I04"] || 0,
      };
      const totalScore = scoreObj.lights + scoreObj.water + scoreObj.recycle + scoreObj.focus;
      const status = computeStatus(scoreObj, notes);

      const recordId = "REC-" + Date.now().toString(36).toUpperCase();
      const nowIso = new Date().toISOString();

      const { error } = await supabase.from("sc_records").insert({
        id: recordId,
        building_id: buildingId,
        department_id: departmentId,
        department_name: deptName,
        inspector,
        date: inspectionDate + "T09:00:00Z",
        lights: scoreObj.lights,
        water: scoreObj.water,
        recycle: scoreObj.recycle,
        focus: scoreObj.focus,
        total_score: totalScore,
        notes: notes.trim(),
        status,
        created_at: nowIso,
        updated_at: nowIso,
        user_id: user?.uid || "anonymous",
      });
      if (error) throw error;

      setSuccessMsg(`${inspector}님 점검 결과 저장 완료`);
      setTimeout(() => { onSuccess(); }, 1500);
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMessage("서버 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-surface-50 border border-surface-200 rounded-xl space-y-4">
      <div className="text-sm font-bold text-surface-900 border-b border-surface-200 pb-2">점검표 입력 ({inspectionDate})</div>
      
      {errorMessage && (
        <div role="alert" className="p-3 my-2 text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-md">
          {errorMessage}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <label className="font-medium text-surface-700">점검자 성명</label>
        <Select value={inspector} onChange={(e) => setInspector(e.target.value)}>
          <option value="">점검자를 선택하세요</option>
          {members.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-4">
        {MOCK_INSPECTION_ITEMS.map(item => (
          <div key={item.id} className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-surface-700">{item.name}</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((score) => (
                <label key={score} className="flex flex-col items-center cursor-pointer group flex-1 py-1">
                  <input 
                    type="radio" 
                    name={`inline-${item.id}`} 
                    value={score} 
                    checked={scores[item.id] === score}
                    onChange={() => setScores(prev => ({ ...prev, [item.id]: score }))}
                    className="sr-only" 
                  />
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold transition-all outline outline-1 group-hover:bg-primary-50 touch-manipulation
                    ${scores[item.id] === score ? 'bg-primary-600 text-white outline-primary-600 shadow-sm' : 'text-surface-700 outline-surface-300'}`}>
                    {score}
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm">
        <label className="font-medium text-surface-700">특이사항</label>
        <Textarea
          rows={2}
          placeholder="특이사항 기재"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {successMsg && (
        <div role="status" className="p-3 text-sm text-success-700 bg-success-50 border border-success-200 rounded-md flex items-center gap-2">
          <span aria-hidden="true">✓</span> {successMsg}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          취소
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "전송 중..." : "등록 🚀"}
        </Button>
      </div>
    </form>
  );
}
