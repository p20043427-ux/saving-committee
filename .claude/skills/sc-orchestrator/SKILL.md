---
name: sc-orchestrator
description: "절약위원회 앱 개발 오케스트레이터. 기능 추가·버그 수정·DB 변경·배포 등 복합 작업을 전문가 팀에 분배하고 조율한다. '기능 구현해줘', '배포해줘', 'DB 변경하고 기능 만들어줘', '처음부터 끝까지 해줘' 요청에 발동. 재실행/이전 작업 이어서/수정 보완 요청 시에도 발동."
---

# 절약위원회 오케스트레이터

## 프로젝트 컨텍스트
- **앱**: 병원 에너지 절약 위원회 점검 관리 대시보드
- **스택**: React 19 + Vite + TypeScript + Tailwind CSS 4 + Supabase + Vercel
- **Supabase 프로젝트**: qwogqeigyjwcpguiezgk (sc_ 접두사)
- **GitHub**: p20043427-ux/saving-committee
- **배포**: saving-committee.vercel.app

## 실행 모드: 전문가 풀 (Expert Pool)

요청 유형에 따라 필요한 에이전트만 선택적으로 호출한다.

---

## Phase 0: 요청 분류

요청을 읽고 작업 유형을 판단한다:

| 유형 | 해당 요청 | 호출 에이전트 |
|------|---------|-------------|
| **A. 순수 기능 구현** | 페이지/컴포넌트 추가, UI 수정 | feature-dev → qa → deploy |
| **B. DB + 기능** | 새 테이블 필요한 기능 | db-migration → feature-dev → qa → deploy |
| **C. 배포만** | 빌드·배포·환경변수 확인 | qa → deploy |
| **D. DB만** | 스키마 변경, 마이그레이션 적용 | db-migration |
| **E. 버그 수정** | 오류 수정, 타입 오류 | feature-dev → qa |

---

## Phase 1: 컨텍스트 파악

작업 시작 전 필요한 파일을 읽는다:

```
항상 읽기:
- src/lib/db.ts          (liveQuery 패턴, 타입 정의, computeStatus)
- src/App.tsx            (현재 라우팅 구조)

기능 구현 시:
- 참고할 유사 페이지 (예: Monitoring.tsx → 점검 관련 기능)

DB 변경 시:
- Supabase list_tables로 현재 스키마 확인
```

---

## Phase 2: 에이전트 호출

### 유형 A — 순수 기능 구현

```
1. feature-dev 호출
   - 구현할 기능 명세 전달
   - 참고 파일: [유사 페이지 경로]
   - 완료 후 변경 파일 목록 받기

2. qa 호출 (feature-dev 완료 후)
   - 변경 파일 목록 전달
   - npx tsc --noEmit + npm run build 검증 요청
   - 실패 시 → feature-dev에게 오류 전달 후 재작업

3. deploy 호출 (qa 통과 후)
   - 프로덕션 배포 요청
   - 배포 URL 확인
```

### 유형 B — DB + 기능 구현

```
1. db-migration 호출 (먼저)
   - 테이블/컬럼 명세 전달
   - RLS + Realtime 등록 포함
   - 완료 후 타입 정보 받기

2. feature-dev 호출 (db-migration 완료 후)
   - 기능 명세 + 새 스키마 정보 전달

3. qa → deploy 순서로 진행 (유형 A 3단계와 동일)
```

### 유형 C — 배포만

```
1. qa 호출
   - 전체 빌드 검증

2. deploy 호출
   - 배포 실행 및 상태 확인
```

---

## Phase 3: 결과 보고

작업 완료 후 사용자에게 보고:

```
완료된 작업:
- [에이전트명]: [수행 내용]
- [에이전트명]: [수행 내용]

결과:
- 변경 파일: [목록]
- 배포 URL: [URL] (해당 시)
- DB 변경: [테이블/컬럼] (해당 시)
```

---

## 코드 규칙 (모든 에이전트 공통)

1. **liveQuery 패턴**: `src/lib/db.ts`의 `liveQuery()` 함수 사용 — raw supabase 쿼리 직접 작성 금지
2. **sc_ 접두사**: 모든 Supabase 테이블명은 `sc_` 시작
3. **상태 판정**: `computeStatus()` 함수 재사용 — 직접 조건 작성 금지
4. **Tailwind만**: CSS 파일 수정 금지, Tailwind 4 클래스만 사용
5. **타입 any 금지**: 모든 변수/함수에 명시적 타입
6. **OrganizationProvider**: 조직 컨텍스트는 `useOrganization()` 훅 사용

---

## DB 진단 패턴 (자주 발생)

"테이블 없다", "데이터 없다", "DB 이상하다" 류 문의 시:

```
1. Supabase 프로젝트 확인
   - 대시보드가 qwogqeigyjwcpguiezgk 인지 확인
   - woauhjykbnpbzldpalxs (NURSE_SC) 와 혼동 금지

2. 테이블 목록 확인 (db-migration 에이전트 → list_tables)
   - sc_ 접두사 6개 테이블 존재 여부
   - 같은 프로젝트에 kc_, stair_ 등 타 앱 테이블 공존 정상

3. 데이터 카운트 확인
   - sc_records: 39건+ (Firebase 원본 38건 + 신규)
   - sc_departments: 53건
   - sc_buildings: 3건 (본관/신관/별관)
   - sc_events, sc_schedules: 0건 정상 (입력된 적 없음)
```

---

## 파생 프로젝트 복제 (친절위원회 패턴)

새 파생 프로젝트 생성 시:
1. GitHub 레포 fork/clone → 새 레포명으로
2. Supabase 새 프로젝트 생성 (새 접두사: kc_, sc_, stair_ 등)
3. 테이블 접두사 전체 교체 (`sc_` → `새접두사_`)
4. Vercel 새 프로젝트로 배포
5. 환경변수 업데이트
