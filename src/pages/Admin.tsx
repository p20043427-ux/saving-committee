import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Switch } from "@/src/components/ui/Switch";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { supabase } from "@/src/lib/supabase";
import { toast } from "../components/ui/Toast";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { usePermission } from "../hooks/usePermission";
import { useAuditLog } from "../hooks/useAuditLog";
import { useUndoDelete } from "../hooks/useUndoDelete";
import { liveQuery } from "../lib/db";
import type { AuditEntry } from "../hooks/useAuditLog";
import { Shield, Download, Upload, RotateCcw, FileText, Clock, User } from "lucide-react";

interface InspectionItem {
  id: string;
  category: string;
  name: string;
  sortOrder: number;
}

const CATEGORIES = ["중점점검", "절약점검표"] as const;

const SC_TABLES = [
  "sc_records",
  "sc_departments",
  "sc_buildings",
  "sc_events",
  "sc_schedules",
  "sc_inspection_items",
  "sc_committee",
] as const;

const ACTION_LABEL: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  EXPORT: "내보내기",
  IMPORT: "가져오기",
  LOGIN: "로그인",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "text-success-600 bg-success-50",
  UPDATE: "text-info-600 bg-info-50",
  DELETE: "text-danger-600 bg-danger-50",
  EXPORT: "text-surface-600 bg-surface-100",
  IMPORT: "text-warning-600 bg-warning-50",
  LOGIN: "text-primary-600 bg-primary-50",
};

export function Admin() {
  const {
    buildings,
    departments,
    addBuilding,
    updateBuilding,
    deleteBuilding,
  } = useOrganization();
  const { canAdmin } = usePermission();
  const { log } = useAuditLog();
  const { deleteWithUndo } = useUndoDelete();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const { confirm, dialogProps } = useConfirm();

  // 건물 관리
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState("");
  const [addingBuilding, setAddingBuilding] = useState(false);
  const [newBuildingId, setNewBuildingId] = useState("");
  const [newBuildingName, setNewBuildingName] = useState("");

  const startEditBuilding = (id: string, name: string) => {
    setEditingBuildingId(id);
    setEditingBuildingName(name);
    setAddingBuilding(false);
  };

  const saveEditBuilding = async (id: string) => {
    if (!editingBuildingName.trim()) return;
    await updateBuilding(id, editingBuildingName.trim());
    await log("UPDATE", "sc_buildings", id, `건물명 변경: ${editingBuildingName.trim()}`);
    setEditingBuildingId(null);
  };

  const handleDeleteBuilding = async (id: string, name: string) => {
    const ok = await confirm("건물 삭제", `건물 ${name}을 삭제하시겠습니까? 관련 부서 데이터에 영향이 있을 수 있습니다.`);
    if (!ok) return;
    await deleteWithUndo(name, async () => {
      await deleteBuilding(id);
      await log("DELETE", "sc_buildings", id, `건물 삭제: ${name}`);
    });
  };

  const saveNewBuilding = async () => {
    if (!newBuildingId.trim() || !newBuildingName.trim()) return;
    await addBuilding({ id: newBuildingId.trim().toUpperCase(), name: newBuildingName.trim() });
    await log("CREATE", "sc_buildings", newBuildingId.trim().toUpperCase(), `건물 추가: ${newBuildingName.trim()}`);
    setAddingBuilding(false);
    setNewBuildingId("");
    setNewBuildingName("");
  };

  // 점검 항목
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("sc_inspection_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setItems(
        (data as Array<{ id: string; category: string; name: string; sort_order?: number }>).map((r) => ({
          id: r.id,
          category: r.category,
          name: r.name,
          sortOrder: r.sort_order ?? 0,
        }))
      );
    }
    setItemsLoading(false);
  };

  const startEditItem = (item: InspectionItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setAddingCategory(null);
  };

  const saveEditItem = async (id: string, oldName: string) => {
    if (!editingItemName.trim()) return;
    await supabase.from("sc_inspection_items").update({ name: editingItemName.trim() }).eq("id", id);
    await log("UPDATE", "sc_inspection_items", id, `항목 수정: ${oldName} → ${editingItemName.trim()}`);
    setEditingItemId(null);
    fetchItems();
  };

  const deleteItem = async (id: string, name: string) => {
    const ok = await confirm("항목 삭제", `"${name}" 항목을 삭제하시겠습니까?`);
    if (!ok) return;
    await deleteWithUndo(name, async () => {
      await supabase.from("sc_inspection_items").delete().eq("id", id);
      await log("DELETE", "sc_inspection_items", id, `항목 삭제: ${name}`);
      fetchItems();
    });
  };

  const startAddItem = (category: string) => {
    setAddingCategory(category);
    setNewItemName("");
    setEditingItemId(null);
  };

  const saveNewItem = async (category: string) => {
    if (!newItemName.trim()) return;
    const catItems = items.filter((i) => i.category === category);
    const maxOrder = catItems.length > 0 ? Math.max(...catItems.map((i) => i.sortOrder)) + 1 : 1;
    const newId = `I${Date.now()}`;
    await supabase.from("sc_inspection_items").insert({
      id: newId,
      category,
      name: newItemName.trim(),
      sort_order: maxOrder,
    });
    await log("CREATE", "sc_inspection_items", newId, `항목 추가: ${newItemName.trim()} (${category})`);
    setAddingCategory(null);
    setNewItemName("");
    fetchItems();
  };

  // 감사 로그
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    const unsub = liveQuery<AuditEntry>(
      "sc_audit_log",
      () =>
        supabase
          .from("sc_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      (rows) => {
        setAuditLogs(rows);
        setAuditLoading(false);
      },
      () => setAuditLoading(false)
    );
    return unsub;
  }, []);

  // JSON 전체 백업 (모든 sc_* 테이블)
  const exportAllJSON = async () => {
    setIsExporting(true);
    try {
      const backup: Record<string, unknown[]> = {};
      for (const table of SC_TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (!error) backup[table] = data ?? [];
      }
      backup._meta = [{
        exported_at: new Date().toISOString(),
        tables: SC_TABLES,
        total_rows: Object.values(backup).flat().length,
      }];

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `saving_committee_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await log("EXPORT", "all", "json_backup", `전체 백업: ${SC_TABLES.length}개 테이블`);
      toast.success("전체 데이터 백업 완료");
    } catch (e) {
      toast.error(`백업 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // JSON 복구
  const importFromJSON = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as Record<string, unknown[]>;
      let totalRestored = 0;

      for (const table of SC_TABLES) {
        const rows = backup[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const { error } = await supabase.from(table).upsert(rows as Record<string, unknown>[], { onConflict: "id" });
        if (error) throw new Error(`${table}: ${error.message}`);
        totalRestored += rows.length;
      }

      await log("IMPORT", "all", "json_restore", `JSON 복구: ${totalRestored}건`);
      setImportResult({ ok: true, msg: `${totalRestored}건 복구 완료` });
      toast.success(`${totalRestored}건 복구 완료`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setImportResult({ ok: false, msg: `복구 실패: ${msg}` });
      toast.error(`복구 실패: ${msg}`);
    } finally {
      setIsImporting(false);
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = "";
    }
  };

  // CSV 내보내기 (기존 호환)
  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const { data: records, error } = await supabase.from("sc_records").select("*");
      if (error) throw error;

      const headers = [
        "id", "building_id", "department_id", "department_name", "inspector",
        "date", "lights", "water", "recycle", "focus", "total_score", "notes", "status",
      ];
      const escapeCSV = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;
      const csvRows = [headers.join(",")];
      (records as Record<string, unknown>[] || []).forEach((data) => {
        csvRows.push(headers.map(h => escapeCSV((data[h] ?? "") as string | number)).join(","));
      });

      const blob = new Blob(["﻿" + csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sc_records_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      await log("EXPORT", "sc_records", "csv", `CSV 내보내기: ${records?.length ?? 0}건`);
      toast.success("CSV 내보내기 완료");
    } catch (e) {
      toast.error(`내보내기 실패: ${e instanceof Error ? e.message : "오류"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // CSV 복구 (기존)
  const importFromCSV = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.replace(/^﻿/, "").split("\n").filter((l) => l.trim());
      if (lines.length < 2) throw new Error("데이터 행이 없습니다.");
      const delimiter = lines[0].includes("\t") ? "\t" : ",";
      const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows = lines
        .slice(1)
        .map((line) => {
          const vals = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
          return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""])) as Record<string, string>;
        })
        .filter((r) => r.id);

      const records = rows.map((r) => ({
        id: r.id,
        building_id: r.building_id,
        department_id: r.department_id,
        department_name: r.department_name,
        inspector: r.inspector,
        date: r.date,
        lights: Number(r.lights),
        water: Number(r.water),
        recycle: Number(r.recycle),
        focus: Number(r.focus),
        total_score: Number(r.total_score),
        notes: r.notes,
        status: r.status,
      }));

      const { error } = await supabase.from("sc_records").upsert(records, { onConflict: "id" });
      if (error) throw error;
      await log("IMPORT", "sc_records", "csv", `CSV 복구: ${records.length}건`);
      setImportResult({ ok: true, msg: `${records.length}건 복구 완료` });
    } catch (err) {
      setImportResult({ ok: false, msg: `복구 실패: ${err instanceof Error ? err.message : "오류"}` });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="시스템 설정"
        subtitle="마스터 데이터 관리 및 시스템 구성을 변경합니다."
        action={
          !canAdmin ? (
            <div className="flex items-center gap-1.5 text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-1.5">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span>관리자 전용 페이지</span>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 건물 마스터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏢</span> <span>건물 마스터 관리</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {buildings.map((b) => (
                <div key={b.id} className="flex items-center gap-2 p-3 border border-surface-200 rounded-lg bg-surface-50">
                  {editingBuildingId === b.id ? (
                    <>
                      <span className="text-xs font-mono text-surface-400 w-12 shrink-0">{b.id}</span>
                      <input
                        autoFocus
                        value={editingBuildingName}
                        onChange={(e) => setEditingBuildingName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditBuilding(b.id); if (e.key === "Escape") setEditingBuildingId(null); }}
                        className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <Button variant="primary" onClick={() => saveEditBuilding(b.id)}>저장</Button>
                      <Button variant="secondary" onClick={() => setEditingBuildingId(null)}>취소</Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{b.name} <span className="text-surface-400 font-normal">({b.id})</span></p>
                        <p className="text-xs text-surface-500 mt-0.5">{departments.filter(d => d.buildingId === b.id).length}개 부서</p>
                      </div>
                      {canAdmin && (
                        <>
                          <button onClick={() => startEditBuilding(b.id, b.name)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">수정</button>
                          <Button variant="danger" onClick={() => handleDeleteBuilding(b.id, b.name)}>삭제</Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}

              {canAdmin && (addingBuilding ? (
                <div className="flex items-center gap-2 p-3 border border-primary-200 rounded-lg bg-primary-50">
                  <input
                    autoFocus
                    value={newBuildingId}
                    onChange={(e) => setNewBuildingId(e.target.value)}
                    placeholder="코드 (예: B04)"
                    className="w-24 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  />
                  <input
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveNewBuilding(); if (e.key === "Escape") setAddingBuilding(false); }}
                    placeholder="건물명 (예: 암센터)"
                    className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  />
                  <Button variant="primary" onClick={saveNewBuilding}>추가</Button>
                  <Button variant="secondary" onClick={() => setAddingBuilding(false)}>취소</Button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingBuilding(true); setEditingBuildingId(null); }}
                  className="w-full py-2 border-2 border-dashed border-surface-300 text-surface-500 rounded-lg text-sm font-medium hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  + 신규 건물 등록
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 점검 항목 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span> <span>점검 항목 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <p className="text-sm text-surface-400 text-center py-4">불러오는 중...</p>
            ) : (
              <div className="space-y-5">
                {CATEGORIES.map((category) => {
                  const catItems = items.filter((i) => i.category === category);
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-surface-700">
                          {category} ({catItems.length}개)
                        </span>
                        {canAdmin && (
                          <button
                            onClick={() => startAddItem(category)}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                          >
                            + 항목 추가
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        {catItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 bg-surface-50 rounded-lg border border-surface-100">
                            {editingItemId === item.id ? (
                              <>
                                <input
                                  autoFocus
                                  value={editingItemName}
                                  onChange={(e) => setEditingItemName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") saveEditItem(item.id, item.name); if (e.key === "Escape") setEditingItemId(null); }}
                                  className="flex-1 px-2 py-0.5 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <Button variant="primary" onClick={() => saveEditItem(item.id, item.name)}>저장</Button>
                                <Button variant="secondary" onClick={() => setEditingItemId(null)}>취소</Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-surface-800">{item.name}</span>
                                {canAdmin && (
                                  <>
                                    <button onClick={() => startEditItem(item)} className="text-xs text-primary-600 hover:text-primary-800">수정</button>
                                    <Button variant="danger" onClick={() => deleteItem(item.id, item.name)}>삭제</Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {catItems.length === 0 && addingCategory !== category && (
                          <p className="text-xs text-surface-400 text-center py-2">등록된 항목이 없습니다.</p>
                        )}

                        {addingCategory === category && (
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-primary-50 rounded-lg border border-primary-200">
                            <input
                              autoFocus
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveNewItem(category); if (e.key === "Escape") setAddingCategory(null); }}
                              placeholder="항목명 입력"
                              className="flex-1 px-2 py-0.5 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                            />
                            <Button variant="primary" onClick={() => saveNewItem(category)}>추가</Button>
                            <Button variant="secondary" onClick={() => setAddingCategory(null)}>취소</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 백업 / 복구 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>데이터 백업 / 복구</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-surface-100">
            {/* JSON 전체 백업 */}
            <div className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-surface-900">전체 백업 (JSON)</p>
                  <p className="text-xs text-surface-500 mt-1">
                    모든 sc_* 테이블({SC_TABLES.length}개)을 하나의 JSON 파일로 내보냅니다. 완전 복구 가능.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={exportAllJSON}
                    disabled={isExporting || isImporting}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {isExporting ? "백업 중..." : "JSON 백업"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => jsonFileInputRef.current?.click()}
                    disabled={isExporting || isImporting}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    {isImporting ? "복구 중..." : "JSON 복구"}
                  </Button>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={importFromJSON}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* CSV 점검기록 */}
            <div className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-surface-900">점검기록 백업 (CSV)</p>
                  <p className="text-xs text-surface-500 mt-1">sc_records만 Excel 호환 CSV로 내보냅니다.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={exportCSV}
                    disabled={isExporting || isImporting}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    CSV 내보내기
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExporting || isImporting}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    CSV 복구
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importFromCSV}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {importResult && (
              <div
                role="status"
                className={`mx-0 mt-3 p-2.5 text-sm rounded-md border ${
                  importResult.ok
                    ? "text-success-700 bg-success-50 border-success-200"
                    : "text-danger-600 bg-danger-50 border-danger-200"
                }`}
              >
                {importResult.ok ? "✓ " : "⚠ "}
                {importResult.msg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 감사 로그 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>감사 로그 (Audit Log)</span>
              <span className="ml-auto text-xs font-normal text-surface-400">최근 100건</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <p className="text-sm text-surface-400 text-center py-6">불러오는 중...</p>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-surface-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-surface-400">기록된 감사 로그가 없습니다.</p>
                <p className="text-xs text-surface-400 mt-1">
                  sc_audit_log 테이블이 없으면 아래 SQL을 실행해주세요.
                </p>
                <pre className="mt-3 text-left text-xs bg-surface-50 border border-surface-200 rounded-lg p-3 max-w-xl mx-auto overflow-x-auto">
{`CREATE TABLE sc_audit_log (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  user_name text,
  action text NOT NULL,
  target_table text,
  target_id text,
  detail text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sc_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON sc_audit_log
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth insert" ON sc_audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');`}
                </pre>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-surface-200 text-surface-500 text-left">
                      <th className="pb-2 pr-4 font-medium">시각</th>
                      <th className="pb-2 pr-4 font-medium">사용자</th>
                      <th className="pb-2 pr-4 font-medium">작업</th>
                      <th className="pb-2 pr-4 font-medium">대상</th>
                      <th className="pb-2 font-medium">내용</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {auditLogs.map((entry) => (
                      <tr key={entry.id} className="hover:bg-surface-50">
                        <td className="py-2 pr-4 font-mono text-surface-500 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString("ko-KR", {
                            month: "2-digit", day: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-surface-400" aria-hidden="true" />
                            <span className="text-surface-700">{entry.user_name || entry.user_id.slice(0, 8)}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold ${ACTION_COLOR[entry.action] ?? "text-surface-600 bg-surface-100"}`}>
                            {ACTION_LABEL[entry.action] ?? entry.action}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-mono text-surface-500">{entry.target_table}</td>
                        <td className="py-2 text-surface-600">{entry.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 고급 설정 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger-600">
              <span>⚠️</span> <span>고급 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-4 border-b border-surface-100">
              <div>
                <p className="font-medium text-sm text-surface-900">알림 설정</p>
                <p className="text-xs text-surface-500 mt-1">'긴급' 상태 발생 시 원무팀(내선 1000)으로 자동 SMS를 발송합니다.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-sm text-danger-600">시스템 초기화</p>
                <p className="text-xs text-surface-500 mt-1">모든 설정과 데이터를 초기 상태로 되돌립니다. (복구 불가)</p>
              </div>
              <Button variant="danger" size="md" disabled={!canAdmin}>
                초기화 진행
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
