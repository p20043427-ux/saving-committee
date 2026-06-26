# 절약위원회 — Claude Code 설정

## 프로젝트 개요
병원 에너지 절약 위원회 점검 관리 대시보드.
React 19 + Vite + TypeScript + Tailwind CSS 4 + Supabase + Vercel.

- **Supabase 프로젝트 ID**: `qwogqeigyjwcpguiezgk` ← sc_ 테이블 있는 프로젝트 (ap-southeast-1)
- **⚠️ 주의**: `woauhjykbnpbzldpalxs` (NURSE_SC) 프로젝트도 존재 — sc_ 테이블 없음, 혼동 주의
- **테이블 접두사**: `sc_` (같은 프로젝트에 `kc_`, `stair_` 등 타 앱 테이블도 공존)
- **GitHub**: p20043427-ux/saving-committee
- **배포**: saving-committee.vercel.app
- **로컬 실행**: `npm run dev` → http://localhost:3000

## 하네스 (Agent Team Orchestration)

### 트리거 규칙
| 요청 유형 | 실행 스킬/에이전트 |
|---------|----------------|
| "하네스 구성/설계/수정" | `/harness` 스킬 |
| "기능 구현/추가", "페이지 만들어줘", "처음부터 끝까지" | `sc-orchestrator` 스킬 |
| "DB 변경", "테이블 추가", "마이그레이션" | `db-migration` 에이전트 직접 |
| "배포해줘", "Vercel 확인" | `deploy` 에이전트 직접 |
| "빌드 오류", "타입 오류", "빌드 확인" | `qa` 에이전트 직접 |
| "컴포넌트/UI 수정" | `feature-dev` 에이전트 직접 |

### 에이전트 팀
- **feature-dev** — React/TS 기능 구현 (CRUD, 컴포넌트, 차트)
- **db-migration** — Supabase 스키마/마이그레이션
- **deploy** — Vercel 배포·환경변수 관리
- **qa** — TypeScript 타입 검증·빌드 확인
- **sc-orchestrator** — 전체 조율 (복합 작업)

## 코드 규칙
1. `src/lib/db.ts`의 `liveQuery()` 패턴 사용 필수
2. 모든 테이블명 `sc_` 접두사
3. `computeStatus()` 재사용 — 조건 직접 작성 금지
4. Tailwind 4 클래스만, CSS 파일 수정 금지
5. TypeScript any 금지

## 변경 이력
| 날짜 | 변경 내용 | 영향 범위 |
|------|---------|---------|
| 2026-06-26 | 초기 하네스 구축 (feature-dev, db-migration, deploy, qa, sc-orchestrator) | 전체 |
| 2026-06-26 | Supabase 2개 프로젝트 구분 명시, db-migration·orchestrator 업데이트 | CLAUDE.md, agents, skills |
