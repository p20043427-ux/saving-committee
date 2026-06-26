import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { supabase } from "@/src/lib/supabase";

interface InspectionItem {
  id: string;
  category: string;
  name: string;
  sortOrder: number;
}

const CATEGORIES = ["중점점검", "절약점검표"] as const;

export function Admin() {
  const {
    buildings,
    departments,
    addBuilding,
    updateBuilding,
    deleteBuilding,
  } = useOrganization();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setEditingBuildingId(null);
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm(`건물 ${id}를 삭제하시겠습니까? 관련 부서 데이터에 영향이 있을 수 있습니다.`)) return;
    await deleteBuilding(id);
  };

  const saveNewBuilding = async () => {
    if (!newBuildingId.trim() || !newBuildingName.trim()) return;
    await addBuilding({ id: newBuildingId.trim().toUpperCase(), name: newBuildingName.trim() });
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
        data.map((r: any) => ({
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

  const saveEditItem = async (id: string) => {
    if (!editingItemName.trim()) return;
    await supabase.from("sc_inspection_items").update({ name: editingItemName.trim() }).eq("id", id);
    setEditingItemId(null);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    await supabase.from("sc_inspection_items").delete().eq("id", id);
    fetchItems();
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
    await supabase.from("sc_inspection_items").insert({
      id: `I${Date.now()}`,
      category,
      name: newItemName.trim(),
      sort_order: maxOrder,
    });
    setAddingCategory(null);
    setNewItemName("");
    fetchItems();
  };

  const exportAllData = async () => {
    setIsExporting(true);
    try {
      const { data: records, error } = await supabase.from("sc_records").select("*");
      if (error) throw error;

      const headers = [
        "id", "building_id", "department_id", "department_name", "inspector",
        "date", "lights", "water", "recycle", "focus", "total_score", "notes", "status",
      ];
      const csvRows = [headers.join(",")];

      const escapeCSV = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;

      (records || []).forEach((data: any) => {
        const row = [
          escapeCSV(data.id || ""),
          escapeCSV(data.building_id || ""),
          escapeCSV(data.department_id || ""),
          escapeCSV(data.department_name || ""),
          escapeCSV(data.inspector || ""),
          escapeCSV(data.date || ""),
          escapeCSV(data.lights ?? 0),
          escapeCSV(data.water ?? 0),
          escapeCSV(data.recycle ?? 0),
          escapeCSV(data.focus ?? 0),
          escapeCSV(data.total_score ?? 0),
          escapeCSV(data.notes || ""),
          escapeCSV(data.status || ""),
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["﻿" + csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sc_records_backup_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      setImportResult({ ok: false, msg: `백업 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}` });
    } finally {
      setIsExporting(false);
    }
  };

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
      setImportResult({ ok: true, msg: `${records.length}건 복구 완료` });
    } catch (err: unknown) {
      setImportResult({ ok: false, msg: `복구 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}` });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">시스템 설정</h1>
        <p className="text-surface-500 mt-1">마스터 데이터 관리 및 시스템 구성을 변경합니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 건물 마스터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
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
                        <p className="text-xs text-surface-500 mt-0.5">사용중</p>
                      </div>
                      <button onClick={() => startEditBuilding(b.id, b.name)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">수정</button>
                      <Button variant="danger" onClick={() => handleDeleteBuilding(b.id)}>삭제</Button>
                    </>
                  )}
                </div>
              ))}

              {addingBuilding ? (
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* 점검 항목 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
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
                        <button
                          onClick={() => startAddItem(category)}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          + 항목 추가
                        </button>
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
                                  onKeyDown={(e) => { if (e.key === "Enter") saveEditItem(item.id); if (e.key === "Escape") setEditingItemId(null); }}
                                  className="flex-1 px-2 py-0.5 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <Button variant="primary" onClick={() => saveEditItem(item.id)}>저장</Button>
                                <Button variant="secondary" onClick={() => setEditingItemId(null)}>취소</Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-surface-800">{item.name}</span>
                                <button onClick={() => startEditItem(item)} className="text-xs text-primary-600 hover:text-primary-800">수정</button>
                                <Button variant="danger" onClick={() => deleteItem(item.id)}>삭제</Button>
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

        {/* 보안 및 고급 설정 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <span>⚠️</span> <span>보안 및 고급 설정</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-4 border-b border-surface-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-surface-900">데이터 백업</p>
                  <p className="text-xs text-surface-500 mt-1">전체 점검 기록을 복구 가능한 CSV로 내보냅니다.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={exportAllData}
                    disabled={isExporting || isImporting}
                  >
                    {isExporting ? "추출 중..." : "내보내기"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExporting || isImporting}
                  >
                    {isImporting ? "복구 중..." : "복구 파일 선택..."}
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
              {importResult && (
                <div
                  className={`mt-3 p-2.5 text-sm rounded-md border ${
                    importResult.ok
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-red-600 bg-red-50 border-red-200"
                  }`}
                >
                  {importResult.ok ? "✓ " : "⚠ "}
                  {importResult.msg}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between py-4 border-b border-surface-100">
              <div>
                <p className="font-medium text-sm text-surface-900">알림 설정</p>
                <p className="text-xs text-surface-500 mt-1">'긴급' 상태 발생 시 원무팀(내선 1000)으로 자동 SMS를 발송합니다.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-sm text-red-600">시스템 초기화</p>
                <p className="text-xs text-surface-500 mt-1">모든 설정과 데이터를 초기 상태로 되돌립니다. (복구 불가)</p>
              </div>
              <Button variant="danger" size="md">
                초기화 진행
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
