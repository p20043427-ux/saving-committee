# 좋은문화병원 절약위원회 점검 관리 시스템

병원 건물/부서 단위의 **에너지 절약 점검(소등·수압·분리수거·중점점검)** 을 기록·모니터링하고,
점검 스케줄·위원회 명단·월별 행사를 관리하는 대시보드입니다.

- **Frontend**: React 19 · Vite 6 · Tailwind CSS 4 · React Router 7 · Recharts
- **Backend**: Supabase (PostgreSQL + Realtime + RLS)

## 주요 기능

| 메뉴 | 설명 |
|------|------|
| 대시보드 | 이번 달 행사/점검 스케줄 요약 |
| 일자별 점검 현황 | 부서별 점검 상태 조회 및 인라인 점검표 입력 |
| 점검 데이터 관리 | 상세 내역 + 부서별 월간/연간 점수표, CSV 내보내기 |
| 부서별 기간 리포트 | 점검일별 추이·세부 항목 차트, 최우수/개선필요 부서 |
| 위원회 명단 / 점검 스케줄 / 월별 행사 | 위원·일정·행사 관리 |
| 코드 관리 / 시스템 설정 | 건물·부서 마스터, 전체 백업 |

## 로컬 실행

**사전 준비:** Node.js 18+

```bash
npm install
cp .env.example .env.local   # Supabase URL/KEY 입력 (기본값 내장)
npm run dev                  # http://localhost:3000
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | publishable/anon 키 (클라이언트 공개용, 접근은 RLS로 제어) |

## 데이터베이스 (Supabase)

`public` 스키마에 `sc_` 접두사로 6개 테이블을 사용합니다.

- `sc_buildings` — 건물 마스터
- `sc_departments` — 부서 마스터 (→ sc_buildings)
- `sc_committee` — 위원회 명단
- `sc_records` — 부서별 점검 기록 (핵심)
- `sc_schedules` — 점검 스케줄
- `sc_events` — 월별 행사

모든 테이블은 RLS가 활성화되어 있고, 내부 도구 특성상 anon/authenticated 전체 접근을 허용합니다.
실시간 반영을 위해 `supabase_realtime` publication 에 등록되어 있습니다.

## 배포 (Vercel)

- 빌드 명령: `npm run build` · 출력 디렉터리: `dist`
- SPA 라우팅은 `vercel.json` 의 rewrite 로 처리됩니다.
- Vercel 프로젝트 환경 변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 설정하세요.
