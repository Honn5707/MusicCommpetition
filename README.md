# 듣기평가 (MusicBattle) — 음악 큐레이션 배틀 플랫폼

두 곡(또는 두 참가자)을 겨루게 하고, 방문자와 회원의 투표로 승자를 가리는 1vs1 음악 배틀 플랫폼.
백엔드는 Spring Boot(Java 21) + MySQL + Redis, 프론트엔드는 React + TypeScript + Tailwind로 구성된
1인 개발 풀스택 프로젝트입니다. UI 문구는 "듣기평가"로 통일되어 있으나, 코드/API/리포지토리 상의
식별자는 도메인명인 `battle`을 그대로 사용합니다.

## 기술 스택

**Backend**
- Java 21, Spring Boot 4.1 (Web MVC, Data JPA, Validation, Security)
- MySQL (영속 계층), Redis (분산 락 / 어뷰징 방지)
- JWT (jjwt) 기반 access/refresh 토큰 인증
- Gradle

**Frontend**
- React 18 + TypeScript, Vite
- React Router
- Tailwind CSS
- YouTube IFrame Player API / YouTube Data API v3 (선택적 검색 기능)

## 핵심 기능

- **회원가입 / 로그인**: JWT access + refresh 토큰, IP 해시 기반 처리
- **배틀 생성 · 목록 · 상세 · 참가(도전) · 삭제 · 항복**: `BattleController` 기준 REST API 전체
- **1vs1 매치 상태머신**: `RECRUITING → VOTING → CALCULATING → FINISHED`, 상태 전이 로직을 엔티티 안에 캡슐화하고 잘못된 전이는 즉시 예외 처리
- **투표 & 어뷰징 방어**: 비로그인(+1) / 로그인(+3) 가중 투표, 방당 추가 투표권 2회 캡, 본인 참여 배틀 투표 락. 실시간 중복 투표 차단은 Redis `SET NX`(IP 해시 + 핑거프린트, TTL 24h)가 담당하고 MySQL `vote` 테이블은 감사 기록 역할
- **포인트 원장**: 모든 포인트 가감을 `PointTransaction`에 기록하는 원장(ledger) 패턴, `Member.pointBalance`는 캐시일 뿐
- **매치 라이프사이클 스케줄러**: 5초 폴링으로 투표창 마감/집계를 자동 처리, 매치 1건 실패가 나머지 매치를 막지 않도록 예외 격리
- **동시성 제어**: 주요 엔티티(`Member`/`Battle`/`Match`/`MatchEntry`/`ExtraVoteUsage`)에 `@Version` 낙관적 락. 스케줄러의 매치 집계만 비관적 락(`findByIdForUpdate`) — 동일 매치 중복 집계를 막는 목적이라 낙관적 락보다 적합
- **YouTube 검색 연동(선택 기능)**: `VITE_YOUTUBE_API_KEY`가 설정되어 있으면 곡 등록 시 검색 탭이 활성화되고, 없으면 링크 붙여넣기로 자동 폴백

## 아키텍처 메모

```
backend/src/main/java/com/musicbattle/
  domain/       엔티티 + 상태 전이 로직 (전이 메서드를 엔티티 안에 캡슐화, Anemic Domain 지양)
  domain/enums/ 상태·유형 enum
  repository/   Spring Data JPA 인터페이스
  service/      트랜잭션 경계 + 비즈니스 로직
  scheduler/    @Scheduled 매치 라이프사이클 폴링
  web/          컨트롤러 + DTO + 전역 예외 처리
  config/       Redis, 도메인 규칙 ConfigurationProperties, JWT, Security

front/music-battle-frontend/src/
  types/api.ts   백엔드 DTO(record)와 1:1 대응하는 TypeScript 타입 (현재는 수동 동기화)
  api/           BattleController / MemberController / VoteController / AuthController 대응 클라이언트
  auth/          JWT 보관 + AuthContext (프론트 권한 UI는 UX 편의 목적일 뿐, 실제 인가는 서버 @AuthenticationPrincipal이 담당)
  components/    BattleCard, YoutubeSearchBox 등 공용 컴포넌트
  pages/         BattleList / BattleDetail / CreateBattle / Login / MyPage
```

**설계상 눈여겨볼 지점**
- `open-in-view: false` — OSIV를 꺼서 트랜잭션 경계를 서비스 레이어로 강제, 컨트롤러/뷰단 지연로딩 예외를 원천 차단
- `ddl-auto: validate` — 로컬 개발이라도 스키마는 자동 변경하지 않고 명시적으로 관리하는 습관
- Redis(락/실시간 차단)와 MySQL(영속 기록)의 책임을 명확히 분리 — 캐시 계층과 영속 계층의 책임이 섞이면 장애 원인 추적이 어려워짐
- 도메인 규칙(투표 가중치, 투표창 길이, 연승 배수 등)은 `application.yml`의 `battle.*`로 외부화, 코드에 매직넘버로 박지 않음
- 프론트는 Vite 프록시로 백엔드(8080)를 같은 출처처럼 호출해 개발 중 CORS 문제를 피함
- 배포 환경에서는 Nginx가 정적 프론트 빌드를 서빙하면서 `/api/`만 백엔드 컨테이너로 리버스 프록시 — 개발(Vite 프록시)과 배포(Nginx 프록시) 모두 프론트가 항상 같은 출처로만 요청하도록 통일

## 개발 히스토리 (주요 변경점)

| 단계 | 내용 |
|---|---|
| 1. 도메인 설계 | `Match` 상태머신, `Battle`/`MatchEntry`/`Vote`/`PointTransaction` 등 핵심 엔티티와 낙관적 락 동시성 모델 설계 |
| 2. 투표 어뷰징 방어 | Redis `SET NX` 기반 실시간 중복 투표 차단, 가중 투표(비로그인 +1 / 로그인 +3)와 추가 투표권 캡 설계·조정 (기획 원안의 +5~10 가중치는 계정 양산 공격을 유발할 수 있어 +3으로 하향 조정) |
| 3. 매치 라이프사이클 자동화 | `MatchScheduler` 폴링 기반 투표창 마감/집계, 매치별 예외 격리, 집계 시점만 비관적 락으로 전환 |
| 4. 인증/인가 | 회원가입, JWT access/refresh 로그인, `JwtAuthenticationFilter`, IP 해시(`IpUtilities`) 도입 |
| 5. 배틀 REST API | 배틀 생성/목록(페이지네이션)/상세/참가(도전)/삭제/항복 엔드포인트 구현, `BattleSummaryAssembler`로 응답 조립 로직 분리 |
| 6. 프론트엔드 초기 구축 | Vite + React + TypeScript + Tailwind 세팅, 백엔드 DTO와 1:1 대응하는 타입 체계, Vite 프록시로 CORS 회피 |
| 7. 프론트-백엔드 계약 보강 | 프론트 개발 중 발견된 API 공백(상세 응답에 `matchEntryId` 부재, 배틀 목록 API 부재, 응답 status가 Match가 아닌 Battle 기준인 문제 등)을 백엔드에 역으로 반영 |
| 8. YouTube 검색 연동 | `VITE_YOUTUBE_API_KEY` 유무에 따라 검색/링크 붙여넣기를 자동 전환하는 선택적 기능 추가 |
| 9. 디자인 시스템 정리 | 초기 글래스모피즘 + 멀티 그라데이션 + 네온 글로우 스타일에서, 과하다는 피드백을 반영해 깔끔한 다크 + 인디고/로즈 절제 팔레트로 재정리 (`index.css` 공통 클래스로 통합) |
| 10. 프론트 권한 UX 정리 | 삭제/항복 등 버튼 노출을 프론트에서 조건부로 숨기되, 이는 UX 편의일 뿐 실제 인가는 항상 서버 `@AuthenticationPrincipal`이 최종 판단하도록 경계를 명확히 함 |
| 11. 브랜딩 정리 | 사용자 화면 문구를 "음악 배틀"에서 "듣기평가"로 통일 (코드/API 식별자는 `battle` 유지) |
| 12. Git 저장소 초기화 | 시크릿(DB 비밀번호, JWT 시크릿) 하드코딩을 환경변수 + gitignore 처리된 로컬 오버라이드로 분리하고 버전 관리 시작 |
| 13. Docker 배포 설정 | `docker-compose.yml`(MySQL/Redis/backend/nginx 4개 컨테이너), 백엔드 멀티스테이지 `Dockerfile`, Nginx 리버스 프록시(`nginx.conf`) 추가. 시크릿은 루트 `.env`(gitignore)로 주입 |

## 로드맵 (아직 구현되지 않은 것)

- 렐리(Rally) 모드 큐(Redis List)와 상태 관리 — `BattleMode.RALLY`는 정의되어 있으나 서비스 로직 미구현
- 토너먼트 대진표 생성/진출 로직 — `Match.nextMatchId` 자리만 마련되어 있고 브라켓 진행 로직은 없음
- 투표 참여 보상 포인트 지급 — `PointTransactionType.VOTE_REWARD` 타입은 정의되어 있으나 지급 로직 미연결 (현재는 승리 보상만 지급)

## 로컬 실행

**백엔드** (MySQL, Redis가 로컬에 떠 있어야 함)
```bash
cd backend
cp src/main/resources/application-local.yml.example src/main/resources/application-local.yml
# application-local.yml 에 본인 MySQL 비밀번호와 JWT 시크릿을 채운 뒤
./gradlew bootRun
```

**프론트엔드**
```bash
cd front/music-battle-frontend
cp .env.example .env.local   # YouTube 검색을 쓰려면 API 키 입력, 없으면 비워둬도 됨
npm install
npm run dev
```
`http://localhost:5173`에서 뜨며, 백엔드(8080)가 함께 떠 있어야 API 호출이 동작합니다.

**Docker Compose (전체 스택 한 번에)**
```bash
cp .env.example .env
# .env 에 MYSQL_ROOT_PASSWORD, JWT_SECRET 채운 뒤
cd front/music-battle-frontend && npm run build && cd ../..   # nginx가 서빙할 정적 빌드 생성
docker compose up --build
```
MySQL / Redis / Spring Boot 백엔드 / Nginx(정적 프론트 서빙 + `/api/` 리버스 프록시) 4개 컨테이너가 함께 뜨며, `http://localhost`로 접속합니다.
