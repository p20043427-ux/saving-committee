import { useMemo, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { computeStatus, type AppRecord } from "@/src/lib/db";
import { Dialog } from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import { Select, Textarea } from "@/src/components/ui/Input";
import { Alert } from "@/src/components/ui/Alert";
import { toast } from "@/src/components/ui/Toast";
import { useAuditLog } from "@/src/hooks/useAuditLog";
import { SCORE_KEYS, useInspectionItemNames, type ScoreKey } from "@/src/hooks/useInspectionItemNames";
import { ScorePicker } from "./ScorePicker";

const STATUS_STYLE: Record<string, string> = {
  정상: "bg-success-100 text-success-700",
  주의: "bg-warning-100 text-warning-700",
  긴급: "bg-danger-100 text-danger-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${STATUS_STYLE[status] ?? STATUS_STYLE.긴급}`}>
      {status}
    </span>
  );
}

interface RecordEditDialogProps {
  record: AppRecord | null;
  buildingName: string;
  members: { id: string; name: string }[];
  onClose: () => void;
}

/** 이미 저장된 점검 기록을 팝업에서 수정한다. 총점·상태는 현재 판정 기준으로 즉시 다시 계산해 보여준다. */
export function RecordEditDialog({ record, buildingName, members, onClose }: RecordEditDialogProps) {
  if (!record) return null;
  return <RecordEditForm key={record.id} record={record} buildingName={buildingName} members={members} onClose={onClose} />;
}

function RecordEditForm({
  record,
  buildingName,
  members,
  onClose,
}: Omit<RecordEditDialogProps, "record"> & { record: AppRecord }) {
  const itemNames = useInspectionItemNames();
  const { log } = useAuditLog();
  const [inspector, setInspector] = useState(record.inspector);
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    lights: record.scores.lights || 3,
    water: record.scores.water || 3,
    recycle: record.scores.recycle || 3,
    focus: record.scores.focus || 3,
  });
  const [notes, setNotes] = useState(record.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = SCORE_KEYS.reduce((sum, k) => sum + scores[k], 0);
  const status = computeStatus(scores, notes);
  const changed = useMemo(
    () =>
      inspector !== record.inspector ||
      notes !== record.notes ||
      SCORE_KEYS.some((k) => scores[k] !== record.scores[k]),
    [inspector, notes, scores, record]
  );

  // 현재 점검자가 위원 명단에 없어도 선택지에 남겨둔다 (퇴임한 위원 등)
  const inspectorOptions = useMemo(() => {
    const names = members.map((m) => m.name);
    return record.inspector && !names.includes(record.inspector) ? [record.inspector, ...names] : names;
  }, [members, record.inspector]);

  const handleSave = async () => {
    if (!inspector.trim()) {
      setError("점검자를 선택해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("sc_records")
        .update({
          inspector,
          lights: scores.lights,
          water: scores.water,
          recycle: scores.recycle,
          focus: scores.focus,
          total_score: total,
          notes: notes.trim(),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);
      if (updateError) throw updateError;

      const statusChange = status !== record.status ? `, 상태 ${record.status}→${status}` : "";
      await log(
        "UPDATE",
        "sc_records",
        record.id,
        `${record.departmentName} 점검 수정 (${record.date.split("T")[0]}, 총점 ${record.totalScore}→${total}${statusChange})`
      );
      toast.success("점검 기록을 수정했습니다.");
      onClose();
    } catch (e) {
      console.error("점검 기록 수정 오류:", e);
      setError("저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      title="점검 기록 수정"
      onClose={onClose}
      width={460}
      footer={
        <div className="w-full space-y-3">
          <div
            className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 flex items-center justify-between gap-3"
            aria-live="polite"
          >
            <div className="text-sm text-surface-600">
              총점 <span className="font-bold text-surface-900">{total}</span>
              <span className="text-surface-400"> / 20점</span>
              {total !== record.totalScore && (
                <span className="ml-1.5 text-xs text-surface-500">(기존 {record.totalScore})</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {status !== record.status && (
                <>
                  <StatusBadge status={record.status} />
                  <span className="text-surface-400" aria-hidden="true">→</span>
                </>
              )}
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
              취소
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !changed}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg bg-surface-50 border border-surface-200 px-3 py-2.5 text-sm">
          <p className="font-semibold text-surface-900">{record.departmentName}</p>
          <p className="text-xs text-surface-500 mt-0.5">
            {record.date.split("T")[0]} · {buildingName}
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="space-y-1.5">
          <label htmlFor="edit-inspector" className="text-sm font-medium text-surface-700">
            점검자
          </label>
          <Select id="edit-inspector" value={inspector} onChange={(e) => setInspector(e.target.value)}>
            <option value="">점검자를 선택하세요</option>
            {inspectorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-4">
          {SCORE_KEYS.map((key) => (
            <ScorePicker
              key={key}
              name={`edit-${record.id}-${key}`}
              label={itemNames[key]}
              value={scores[key]}
              onChange={(score) => setScores((prev) => ({ ...prev, [key]: score }))}
            />
          ))}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-notes" className="text-sm font-medium text-surface-700">
            특이사항
          </label>
          <Textarea
            id="edit-notes"
            rows={2}
            placeholder="특이사항 기재"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
