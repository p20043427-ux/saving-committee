import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
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

      const headers = ["점검일시", "건물명", "부서명", "점검자", "상태", "총점", "조명/전열", "수돗물", "재활용", "관심도", "특이사항"];
      const csvRows = [headers.join(",")];

      (records || []).forEach((data: any) => {
        const bName = buildings.find((b) => b.id === data.building_id)?.name || data.building_id || "";
        const dName = data.department_name || departments.find((d) => d.id === data.department_id)?.name || "";
        const dDate = data.created_at ? new Date(data.created_at).toLocaleString("ko-KR") : "";
        const escapeCSV = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
        const row = [
          escapeCSV(dDate), escapeCSV(bName), escapeCSV(dName),
          escapeCSV(data.inspector || ""), escapeCSV(data.status || ""),
          escapeCSV(data.total_score || 0), escapeCSV(data.lights || 0),
          escapeCSV(data.water || 0), escapeCSV(data.recycle || 0),
          escapeCSV(data.focus || 0), escapeCSV(data.notes || ""),
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["﻿" + csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `시스템전체백업_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("백업 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
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
                      <button onClick={() => saveEditBuilding(b.id)} className="text-xs text-white bg-primary-600 px-2 py-1 rounded hover:bg-primary-700">저장</button>
                      <button onClick={() => setEditingBuildingId(null)} className="text-xs text-surface-500 hover:text-surface-700">취소</button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{b.name} <span className="text-surface-400 font-normal">({b.id})</span></p>
                        <p className="text-xs text-surface-500 mt-0.5">사용중</p>
                      </div>
                      <button onClick={() => startEditBuilding(b.id, b.name)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">수정</button>
                      <button onClick={() => handleDeleteBuilding(b.id)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
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
                  <button onClick={saveNewBuilding} className="text-xs text-white bg-primary-600 px-2 py-1 rounded hover:bg-primary-700">추가</button>
                  <button onClick={() => setAddingBuilding(false)} className="text-xs text-surface-500 hover:text-surface-700">취소</button>
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
                                <button onClick={() => saveEditItem(item.id)} className="text-xs text-white bg-primary-600 px-2 py-0.5 rounded hover:bg-primary-700">저장</button>
                                <button onClick={() => setEditingItemId(null)} className="text-xs text-surface-500 hover:text-surface-700">취소</button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm text-surface-800">{item.name}</span>
                                <button onClick={() => startEditItem(item)} className="text-xs text-primary-600 hover:text-primary-800">수정</button>
                                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
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
                            <button onClick={() => saveNewItem(category)} className="text-xs text-white bg-primary-600 px-2 py-0.5 rounded hover:bg-primary-700">추가</button>
                            <button onClick={() => setAddingCategory(null)} className="text-xs text-surface-500 hover:text-surface-700">취소</button>
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
            <div className="flex items-center justify-between py-4 border-b border-surface-100">
              <div>
                <p className="font-medium text-sm text-surface-900">데이터 백업</p>
                <p className="text-xs text-surface-500 mt-1">모든 점검 기록 및 마스터 데이터를 CSV 파일로 내보냅니다.</p>
              </div>
              <button
                onClick={exportAllData}
                disabled={isExporting}
                className="px-4 py-2 bg-surface-100 text-surface-700 text-sm font-medium rounded-lg hover:bg-surface-200 disabled:opacity-50"
              >
                {isExporting ? "추출 중..." : "내보내기"}
              </button>
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
              <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
                초기화 진행
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
