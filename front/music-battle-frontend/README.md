# 음악 배틀 프론트엔드

Vite + React + TypeScript + Tailwind CSS.

## 실행 방법

```bash
npm install
npm run dev
```

`http://localhost:5173` 로 뜸. **백엔드(Spring Boot)도 8080 포트로 같이 떠 있어야** API 호출이 동작함.

## 구조

```
src/
  types/api.ts       백엔드 DTO(record)와 1:1 대응하는 TypeScript 타입
  api/
    client.ts        공통 fetch 래퍼 (에러 응답 형식 파싱)
    battles.ts        BattleController 대응 함수들
    members.ts         MemberController 대응 함수
    votes.ts            VoteController 대응 함수
  pages/               화면 단위 컴포넌트 (지금은 스텁)
  App.tsx              라우팅
```

## CORS는 어떻게 처리했나

`vite.config.ts`에 프록시 설정을 넣어서, 프론트가 `/api/...`로 요청하면 Vite 개발 서버가 대신 백엔드(8080)로 전달해줌. 브라우저 입장에선 항상 같은 출처(5173)로만 요청하니 CORS가 아예 발생하지 않음. **백엔드 코드는 하나도 안 건드림.**

(운영 배포 시엔 이 방식이 안 통하니, 그때는 백엔드에 `CorsConfigurationSource` Bean 등록 또는 Nginx 리버스 프록시로 같은 출처 만들기 — 나중 과제.)

## 타입은 왜 수동으로 맞춰뒀나

`types/api.ts`가 백엔드 DTO 필드를 손으로 옮겨 적은 거라, **백엔드 DTO가 바뀌면 여기도 같이 고쳐야 함**. 지금 규모(1인 개발)에선 이 정도 동기화 비용이 감당할 만해서 수동으로 감. 나중에 팀 규모가 커지면 OpenAPI(Swagger) 스펙에서 TypeScript 타입을 자동 생성하는 도구(`openapi-typescript` 등)를 쓰는 게 일반적.

## ⚠️ 화면을 실제로 만들기 전에 백엔드에서 먼저 보강해야 할 것

프론트 화면 코드를 짜다 보면 바로 막힐 구멍들을 미리 발견해서 적어둠:

1. **`BattleDetailResponse`에 `matchEntryId`가 없음** — 투표하려면 `VoteRequest.matchEntryId`가 필수인데, 지금 상세 조회 응답 어디에도 이 값이 없어서 프론트가 알 방법이 없음. `hostEntryId`, `challengerEntryId` 같은 필드 추가 필요.

2. **`BattleDetailResponse.status`가 `Battle`의 상태(`SCHEDULED/LIVE/ENDED/CANCELLED`)인데, 정작 화면에서 필요한 건 `Match`의 상태(`RECRUITING/VOTING/CALCULATING/FINISHED`)일 가능성이 높음** — "도전자 참가 버튼을 보여줄지, 투표 UI를 보여줄지, 결과를 보여줄지"는 Match 상태로 판단해야 하는데 지금 응답엔 그게 없음. 게다가 `Battle.status`가 실제로 `goLive()`/`end()` 호출을 통해 갱신되고 있는지도 확인 필요(코드 상 안 보임 — SCHEDULED에 계속 머물러 있을 수도 있음).

3. **배틀 목록 조회 API가 아예 없음** — 지금 `GET /api/battles/{id}` 상세 조회만 있고, 여러 배틀을 나열하는 `GET /api/battles` 같은 엔드포인트가 없음. `BattleListPage`를 실제로 만들려면 이것부터 추가해야 함.

이 세 가지는 프론트 화면 티켓 들어가기 전에 백엔드 티켓으로 먼저 처리하는 걸 추천.
