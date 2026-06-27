import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";
import { Button } from "@/src/components/ui/Button";
import { Input, Select } from "@/src/components/ui/Input";
import { toast } from "../components/ui/Toast";
import { useConfirm } from "../hooks/useConfirm";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

export function Management() {
  const { buildings, departments, addBuilding, updateBuilding, deleteBuilding, addDepartment, updateDepartment, deleteDepartment } = useOrganization();
  const [activeTab, setActiveTab] = useState<"buildings" | "departments">("buildings");
  const { confirm, dialogProps } = useConfirm();

  // Building State
  const [editBuildingId, setEditBuildingId] = useState<string | null>(null);
  const [editBuildingName, setEditBuildingName] = useState("");
  const [newBuildingId, setNewBuildingId] = useState("");
  const [newBuildingName, setNewBuildingName] = useState("");

  // Department State
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptBld, setEditDeptBld] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptBld, setNewDeptBld] = useState("");

  const handleAddBuilding = async () => {
    if (!newBuildingId.trim() || !newBuildingName.trim()) return;
    await addBuilding({ id: newBuildingId, name: newBuildingName });
    setNewBuildingId("");
    setNewBuildingName("");
  };

  const handleSaveBuilding = async (id: string) => {
    if (!editBuildingName.trim()) return;
    await updateBuilding(id, editBuildingName);
    setEditBuildingId(null);
  };

  const handleDeleteBuilding = async (id: string) => {
    const ok = await confirm("건물 삭제", "정말로 이 건물을 삭제하시겠습니까? 관련된 부서 코드가 있다면 오류가 발생할 수 있습니다.");
    if (!ok) return;
    await deleteBuilding(id);
  };

  const handleAddDept = async () => {
    if (!newDeptId.trim() || !newDeptName.trim() || !newDeptBld.trim()) return;
    await addDepartment({ id: newDeptId, name: newDeptName, buildingId: newDeptBld });
    setNewDeptId("");
    setNewDeptName("");
  };

  const handleSaveDept = async (id: string) => {
    if (!editDeptName.trim() || !editDeptBld.trim()) return;
    await updateDepartment(id, editDeptName, editDeptBld);
    setEditDeptId(null);
  };

  const handleDeleteDept = async (id: string) => {
    const ok = await confirm("부서 삭제", "정말로 이 부서를 삭제하시겠습니까?");
    if (!ok) return;
    await deleteDepartment(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 tracking-tight">건물 / 부서 코드 관리</h1>
        <p className="text-surface-500 mt-1">시스템에서 사용되는 건물과 부서 기초 코드를 관리합니다.</p>
      </div>

      <div className="flex space-x-2 border-b border-surface-200">
        <button
          onClick={() => setActiveTab("buildings")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === "buildings" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700"
          }`}
        >
          건물 관리
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
            activeTab === "departments" ? "border-primary-500 text-primary-600" : "border-transparent text-surface-500 hover:text-surface-700"
          }`}
        >
          부서 관리
        </button>
      </div>

      {activeTab === "buildings" && (
        <Card>
          <CardHeader>
            <CardTitle>건물 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end">
              <div className="flex flex-col space-y-1 w-full sm:w-auto">
                <label className="text-xs font-semibold text-surface-500 uppercase">건물 코드 (ID)</label>
                <Input
                  value={newBuildingId} onChange={(e) => setNewBuildingId(e.target.value)}
                  placeholder="예: B04" className="sm:w-32"
                />
              </div>
              <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1">
                <label className="text-xs font-semibold text-surface-500 uppercase">건물명</label>
                <Input
                  value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)}
                  placeholder="예: 암센터"
                />
              </div>
              <Button variant="primary" size="md" onClick={handleAddBuilding} className="w-full sm:w-auto">
                + 추가
              </Button>
            </div>

            <div className="border border-surface-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-surface-50 text-surface-500 border-b border-surface-200 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 w-32">건물 코드</th>
                    <th className="px-4 py-3">건물명</th>
                    <th className="px-4 py-3 w-32 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {buildings.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-mono text-surface-600">{b.id}</td>
                      <td className="px-4 py-3">
                        {editBuildingId === b.id ? (
                          <input 
                            value={editBuildingName}
                            onChange={(e) => setEditBuildingName(e.target.value)}
                            className="w-full px-2 py-1 border border-surface-300 rounded text-sm outline-none focus:border-primary-500"
                          />
                        ) : (
                          <span className="font-medium text-surface-900">{b.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editBuildingId === b.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleSaveBuilding(b.id)}>저장</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditBuildingId(null)}>취소</Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setEditBuildingId(b.id); setEditBuildingName(b.name); }}>수정</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteBuilding(b.id)}>삭제</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {buildings.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-surface-500">등록된 건물이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "departments" && (
        <Card>
          <CardHeader>
            <CardTitle>부서 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end">
              <div className="flex flex-col space-y-1 w-full sm:w-auto">
                <label className="text-xs font-semibold text-surface-500 uppercase">부서 코드 (ID)</label>
                <Input
                  value={newDeptId} onChange={(e) => setNewDeptId(e.target.value)}
                  placeholder="예: D99" className="sm:w-28"
                />
              </div>
              <div className="flex flex-col space-y-1 w-full sm:w-auto">
                <label className="text-xs font-semibold text-surface-500 uppercase">소속 건물</label>
                <Select value={newDeptBld} onChange={(e) => setNewDeptBld(e.target.value)} className="sm:w-32">
                  <option value="">선택</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1">
                <label className="text-xs font-semibold text-surface-500 uppercase">부서명</label>
                <Input
                  value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="예: 새로운 부서"
                />
              </div>
              <Button variant="primary" size="md" onClick={handleAddDept} className="w-full sm:w-auto">
                + 추가
              </Button>
            </div>

            <div className="border border-surface-200 rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap relative">
                <thead className="bg-surface-50 text-surface-500 border-b border-surface-200 uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 w-28">부서 코드</th>
                    <th className="px-4 py-3 w-32">소속 건물</th>
                    <th className="px-4 py-3">부서명</th>
                    <th className="px-4 py-3 w-32 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-50">
                      <td className="px-4 py-3 font-mono text-surface-600">{d.id}</td>
                      <td className="px-4 py-3">
                        {editDeptId === d.id ? (
                          <select 
                            value={editDeptBld} onChange={(e) => setEditDeptBld(e.target.value)}
                            className="w-full px-2 py-1 border border-surface-300 rounded text-sm"
                          >
                            <option value="">선택</option>
                            {buildings.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-surface-700">{buildings.find(b => b.id === d.buildingId)?.name || d.buildingId}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editDeptId === d.id ? (
                          <input 
                            value={editDeptName}
                            onChange={(e) => setEditDeptName(e.target.value)}
                            className="w-full px-2 py-1 border border-surface-300 rounded text-sm outline-none focus:border-primary-500"
                          />
                        ) : (
                          <span className="font-medium text-surface-900">{d.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editDeptId === d.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleSaveDept(d.id)}>저장</Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditDeptId(null)}>취소</Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setEditDeptId(d.id); setEditDeptName(d.name); setEditDeptBld(d.buildingId); }}>수정</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDeleteDept(d.id)}>삭제</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-surface-500">등록된 부서가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
