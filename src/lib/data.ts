export const MOCK_BUILDINGS = [
  { id: "B01", name: "본관" },
  { id: "B02", name: "신관" },
  { id: "B03", name: "별관" },
];

// Based on the provided csv data
export const MOCK_DEPARTMENTS = [
  { id: "D01", name: "진단검사의학팀", buildingId: "B01" },
  { id: "D02", name: "인공신장실", buildingId: "B01" },
  { id: "D03", name: "난임연구실", buildingId: "B01" },
  { id: "D04", name: "난임센터", buildingId: "B01" },
  { id: "D05", name: "전산운영팀", buildingId: "B01" },
  { id: "D06", name: "간호부", buildingId: "B01" },
  { id: "D07", name: "재봉실/세탁실", buildingId: "B01" },
  { id: "D08", name: "신생아실", buildingId: "B01" },
  { id: "D09", name: "자연출산센터", buildingId: "B01" },
  { id: "D10", name: "분만실", buildingId: "B01" },
  { id: "D11", name: "외과A", buildingId: "B01" },
  { id: "D12", name: "외과B", buildingId: "B01" },
  { id: "D13", name: "외래채혈실", buildingId: "B01" },
  { id: "D14", name: "영상의학과", buildingId: "B01" },
  { id: "D15", name: "소아과", buildingId: "B01" },
  { id: "D16", name: "원무팀", buildingId: "B01" },
  { id: "D17", name: "의료정보팀", buildingId: "B01" },
  { id: "D18", name: "QPS", buildingId: "B03" },
  { id: "D19", name: "성형외과", buildingId: "B03" },
  { id: "D20", name: "피부과", buildingId: "B03" },
  { id: "D21", name: "재활치료팀", buildingId: "B03" },
  { id: "D22", name: "척추센터", buildingId: "B03" },
  { id: "D23", name: "정형외과", buildingId: "B03" },
  { id: "D24", name: "기획홍보팀", buildingId: "B02" },
  { id: "D25", name: "인사총무팀", buildingId: "B02" },
  { id: "D26", name: "재무팀", buildingId: "B02" },
  { id: "D27", name: "심사팀", buildingId: "B02" },
  { id: "D28", name: "영양팀", buildingId: "B02" },
  { id: "D29", name: "13병동", buildingId: "B02" },
  { id: "D30", name: "12병동", buildingId: "B02" },
  { id: "D31", name: "11병동", buildingId: "B02" },
  { id: "D32", name: "10병동", buildingId: "B02" },
  { id: "D33", name: "09병동", buildingId: "B02" },
  { id: "D34", name: "08병동", buildingId: "B02" },
  { id: "D35", name: "종합검진센터", buildingId: "B02" },
  { id: "D36", name: "국가검진센터", buildingId: "B02" },
  { id: "D37", name: "내시경센터", buildingId: "B02" },
  { id: "D38", name: "NICU", buildingId: "B02" },
  { id: "D39", name: "병리과", buildingId: "B02" },
  { id: "D40", name: "약제팀", buildingId: "B02" },
  { id: "D41", name: "ICU", buildingId: "B02" },
  { id: "D42", name: "중앙수술실", buildingId: "B02" },
  { id: "D43", name: "내과외래", buildingId: "B02" },
  { id: "D44", name: "외과C", buildingId: "B02" },
  { id: "D45", name: "산부인과", buildingId: "B02" },
  { id: "D46", name: "응급실", buildingId: "B02" },
  { id: "D47", name: "주사실", buildingId: "B02" },
  { id: "D48", name: "구매관리팀", buildingId: "B02" },
  { id: "D49", name: "영상의학팀", buildingId: "B02" },
  { id: "D50", name: "중앙공급실", buildingId: "B02" },
  { id: "D51", name: "시설관리팀", buildingId: "B02" },
  { id: "D52", name: "별관원무팀", buildingId: "B03" },
  { id: "D53", name: "별관영상의학과", buildingId: "B03" }
];

export const MOCK_INSPECTION_ITEMS = [
  { id: "I01", category: "절약점검표", name: "소등관리", type: "score", max: 5 },
  { id: "I02", category: "절약점검표", name: "수압관리", type: "score", max: 5 },
  { id: "I03", category: "절약점검표", name: "분리수거", type: "score", max: 5 },
  { id: "I04", category: "중점점검", name: "중점점검", type: "score", max: 5 },
];

export interface InspectionRecord {
  id: string;
  buildingId: string;
  departmentId: string;
  departmentName: string; // Keep denormalized for easier rendering and parsing
  inspector: string;
  date: string;
  scores: {
    lights: number;     // 소등관리
    water: number;      // 수압관리
    recycle: number;    // 분리수거
    focus: number;      // 중점점검
  };
  totalScore: number;
  notes: string;
  status: "정상" | "주의" | "긴급";
}

// We will parse the massive CSV string to actual array using standard string operations
// To simulate realtime integration and save space in the source code
export const RAW_CSV_DATA = `ID	점검월	건물	부서	소등관리	수압관리	분리수거	중점검검	총점	메모
c81ea151	2025-05-08	본관	진단검사의학팀	3	4	4	4	15	
744566ec	2025-05-08	본관	인공신장실	4	3	4	4	15	
c81ea152	2025-05-08	본관	난임연구실	3	3	4	4	14	
c81ea160	2025-05-08	별관	QPS	4	4	4	4	16	
c81ea163	2025-05-08	신관	기획홍보팀	3	3	4	4	14	
c81ea203	2025-06-26	본관	진단검사의학팀	5	5	5	3	18	
744566ec	2025-06-26	본관	인공신장실	5	5	5	4	19	
6cf38cc8	2025-08-14	별관	척추센터	1	3	3	1	8	이면지 통 없음
4f838bbd	2025-08-14	별관	성형외과	4	1	1	0	6	휴진 에어컨
984cea9e	2025-08-14	신관	08병동	4	5	4	4	17	소등관리 제일 잘함
b670c0d2	2025-10-23	본관	인공신장실	4	5	3	3	15	안쓰는창고 불켜져있었습니다
9df87b41	2025-10-23	본관	간호부	5	5	5	5	20	텀블러, 소등, 이면지사용
6ee7d509	2025-10-23	본관	외과A	2	4	3	3	12	탈의실 소등X, 빈방소등X
aaab3fd7	2025-10-23	별관	정형외과	3	4	2	3	12	분리수거x
fb039bdc	2025-10-23	별관	척추센터	2	4	3	3	12	일회용품사용!
5d3c76a2	2025-07-24	신관	주사실	2	3	3	4	12	소아예방접종실 환자없을때 소등필요
0c28cf45	2026-02-12	신관	08병동	5	3	2	4	14	분리수거
f87b7c98	2026-02-12	신관	09병동	2	3	4	4	13	
7ca79d0e	2026-02-12	신관	10병동	2	3	2	4	11	
2b6eabc5	2026-02-12	신관	11병동	2	4	5	3	14	
3ec51f1b	2026-02-12	신관	12병동	2	3	5	4	14	
0a8ca8b4	2026-02-12	신관	13병동	3	4	5	4	16	병동 소등기준 : 공용화장실 소등
0dbfaa0d	2026-02-12	신관	인사총무팀	5	5	5	5	20	안쓰는 전구 뺌(강조)
23fd6f90	2026-02-12	신관	시설관리팀	5	5	4	5	19	이면지사용, 난방X
675ff2f5	2026-02-26	신관	13병동	2	3	3	3	11	휴게실 소등 안되어 있음
e177c016	2026-04-13	본관	외래채혈실	5	5	5	3	18	
4e8344cb	2026-04-13	본관	영상의학과	5	5	5	5	20	
9adf6b08	2026-04-13	본관	소아과	5	5	3	3	16	
5aa20aa0	2026-04-13	본관	원무팀	5	5	5	3	18	
63fe8052	2026-04-13	본관	의료정보팀	5	5	5	5	20	
54113551	2026-04-13	별관	QPS	5	5	5	3	18	
28984ddf	2026-04-13	별관	성형외과	4	4	4	3	15	
87100836	2026-04-13	별관	피부과	5	4	3	3	15	
27b62309	2026-04-13	별관	재활치료팀	4	4	4	3	15	
ddfe44ff	2026-04-13	별관	척추센터	4	4	3	3	14	
422b3b82	2026-04-13	별관	정형외과	3	3	3	3	12	
7a6e891e	2026-04-13	별관	별관원무팀	3	3	3	3	12	
e41a0aa1	2026-04-13	별관	별관영상의학과	4	4	4	4	16	`;

export const MOCK_RECORDS: InspectionRecord[] = RAW_CSV_DATA.split('\n').slice(1).map(line => {
  const [id, date, buildingName, deptName, lights, water, recycle, focus, total, notes] = line.split('\t');
  if (!id) return null;
  
  const bId = buildingName === "본관" ? "B01" : buildingName === "신관" ? "B02" : "B03";
  const dId = MOCK_DEPARTMENTS.find(d => d.name === deptName)?.id || "D_UNKNOWN";
  
  const totalScoreVal = parseInt(total || "0", 10);
  
  // Custom logic to determine status
  let status: "정상" | "주의" | "긴급" = "정상";
  if (totalScoreVal < 12 || parseInt(lights) <= 2 || parseInt(water) <= 2) {
    status = "긴급";
  } else if (totalScoreVal < 15 || notes?.length > 1) {
    status = "주의";
  }
  
  return {
    id,
    buildingId: bId,
    departmentId: dId,
    departmentName: deptName,
    inspector: "system", // default
    date: date + "T09:00:00Z", // parse just date to iso format
    scores: {
      lights: parseInt(lights || "0", 10),
      water: parseInt(water || "0", 10),
      recycle: parseInt(recycle || "0", 10),
      focus: parseInt(focus || "0", 10),
    },
    totalScore: totalScoreVal,
    notes: notes?.trim() || "",
    status
  };
}).filter(Boolean) as InspectionRecord[];
