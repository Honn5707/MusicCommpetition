# 음악 큐레이션 배틀 플랫폼 — 1vs1 코어

## 확정된 결정사항 (기획서 대비 조정)

| 항목 | 값 | 이유 |
|---|---|---|
| 비로그인 투표 가중치 | +1 | |
| 로그인 투표 가중치 | +3 (기획 원안 +5~10에서 조정) | 격차가 너무 크면 공격자가 시크릿모드 우회 대신 계정 양산으로 이동 |
| 추가 투표권 캡 | 방당 2회, 본인 참여 배틀 락 | |
| 렐리 라운드 투표창 | 기본 30분 (설정값) | 1vs1(12~24h)과 다른 템포 필요 |
| 1vs1 투표창 | 12시간 (설정값) | |
| 동점 처리 | side A(방장/챔피언) 우세 | 디펜더 어드밴티지, 렐리 긴장감 유지 |
| 연승 배수 | `min(1 + streak*0.2, 3.0)` | 무한 인플레 방지 (아직 렐리 서비스는 미구현, 다음 단계) |

모든 값은 `application.yml` 의 `battle.*` 아래 있음. 코드에 매직넘버로 박지 않음.

## 패키지 구조 (실무 레이어드 아키텍처)

```
domain/       엔티티 + 상태 전이 로직 (Anemic하지 않게, 전이 메서드를 엔티티 안에 캡슐화)
domain/enums/ 상태·유형 enum
repository/   Spring Data JPA 인터페이스
service/      트랜잭션 경계 + 비즈니스 로직
scheduler/    @Scheduled 폴링
web/          컨트롤러 + DTO + 전역 예외 처리
config/       Redis, 도메인 규칙 ConfigurationProperties
```

## 이번 단계에서 구현한 것 (1vs1 코어)

- **Match 상태머신**: `RECRUITING → VOTING → CALCULATING → FINISHED`, 전이 로직은 `Match` 엔티티 안에 캡슐화, 잘못된 전이는 즉시 `IllegalStateException`.
- **투표 어뷰징 방어**: Redis `SET NX` (IP해시+핑거프린트 조합, TTL 24h)가 실시간 차단의 주인, MySQL `vote` 테이블은 감사 기록.
- **가중 투표 + 추가 투표권**: 로그인/비로그인 차등, 방당 캡, 본인 배틀 락.
- **포인트 원장 패턴**: `PointTransaction` 이 모든 가감을 기록, `Member.pointBalance` 는 캐시일 뿐.
- **동시성 제어**: `Member`/`Battle`/`Match`/`MatchEntry`/`ExtraVoteUsage` 전부 `@Version` 낙관적 락. 스케줄러의 매치 집계만 비관적 락(`findByIdForUpdate`) — 동일 매치 중복 집계 방지가 목적이라 낙관적 락보다 비관적 락이 적합한 케이스.
- **스케줄러**: 5초 폴링, 매치 1건 실패가 나머지를 막지 않도록 예외 격리.

## 아직 없는 것 (다음 단계)

1. **회원가입/로그인** (소셜 로그인 전용 권장 — 계정 생성 비용을 올려 매크로 억제)
2. **Song 등록 + YouTube 임베드 검증 API**
3. **Battle/Match 생성 API** (지금은 서비스 레이어만 있고 "배틀 만들기" 컨트롤러 없음)
4. **렐리 큐 (Redis List) + RallyState**
5. **토너먼트 대진표 생성/진출 로직** (`Match.nextMatchId` 자리는 이미 파둠)
6. **투표 보상 포인트** (지금은 승리 보상만 지급, 투표 참여 보상 `VOTE_REWARD` 타입은 만들어뒀지만 미연결)
7. **React 프론트 + YouTube IFrame Player**

## 실행 방법 (로컬)

```bash
# MySQL, Redis 로컬에 떠 있어야 함
./gradlew bootRun
```

`application.yml` 의 datasource 계정정보를 본인 환경에 맞게 수정할 것.

## 실무 관점에서 눈여겨볼 지점

- `open-in-view: false` — OSIV를 꺼서 트랜잭션 경계를 서비스 레이어로 강제. 컨트롤러/뷰에서 지연로딩 터지는 걸 여기서 막음.
- `ddl-auto: validate` — 로컬 개발이라도 auto-update 습관 들이면 운영에서 사고남. 스키마 변경은 Flyway/Liquibase 마이그레이션으로.
- Redis와 MySQL의 역할 분리(락 vs 기록)를 명확히 지킨 것 — 실무에서 캐시/락 계층과 영속 계층의 책임을 섞으면 장애 시 원인 추적이 어려워짐.
