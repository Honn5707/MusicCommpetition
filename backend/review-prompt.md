아래는 "Song 엔티티 제거 → 곡 정보를 MatchEntry에 직접 인라인화" 티켓을 처리한 내용이야. 코드 리뷰해줘 — 특히 내가 임의로 판단한 부분들이 맞는 설계인지 짚어줬으면 해.

## 배경
같은 영상이 여러 배틀에서 재사용될 확률이 낮다고 판단해서 `Song` 테이블로 분리 관리하던 걸 없애고, 곡 정보를 `MatchEntry`에 바로 저장하는 구조로 단순화했어.
- 잃는 것: 같은 영상 곡의 통산 전적 집계 불가능
- 얻는 것: 테이블/리포지토리/서비스/컨트롤러/스케줄러 하나씩 줄어듦

## 시작 시점 상태
작업 시작 전에 `BattleService`가 이미 손대다 만 상태였어 — `createOneVsOneBattle(BattleCreateResult)`처럼 타입만 있고 파라미터명이 없는 시그니처, 정의되지 않은 변수(`hostMemberId`, `title`, `songID`, `request`) 참조 등으로 컴파일 자체가 안 되는 상태였음. `MatchEntry` 엔티티는 이미 `songId` 필드가 곡 정보 필드들(`videoId`, `songTitle`, `channelTitle`, `thumbnailUrl`, `durationSec`, `embeddable`)로 교체되어 있었고.

## 삭제한 파일
- `domain/Song.java`
- `repository/SongRepository.java`
- `service/SongService.java`
- `web/SongController.java`
- `web/dto/SongSubmitRequest.java`, `web/dto/SongSubmitResult.java`

## 수정한 파일과 판단 근거

### `MatchEntry.java`
- `songTitle` 컬럼을 `nullable = false`로 지정. 근거: 예전 `Song.title`도 `nullable = false` + DTO에서 `@NotBlank`였으니 동일 수준으로 유지.
- `channelTitle`/`thumbnailUrl`은 계속 선택값(`nullable` 미지정)으로 둠. 예전 `Song`에서도 선택값이었음.
- `videoId`, `durationSec`, `embeddable`은 기존 그대로 `nullable = false` 유지.
- 발견한 기존 버그도 같이 고침: `@Column(name = "thumbnailUrl")` → `@Column(name = "thumbnail_url")` (스네이크케이스 통일 안 된 오타).
- `embeddable` 필드는 없애지 않고 남겨둠. 실제 검증 로직 없이 항상 `true`로 저장하는 스텁 — 예전 `SongService`가 하던 방식 그대로 유지. (필드를 없앨지 남길지가 티켓에서 열린 질문이었는데, "나중에 실제 YouTube 임베드 가능 여부 검증(oEmbed/Data API)"을 붙일 자리를 남겨두는 쪽을 선택함)

### `CreateBattleRequest`, `ChallengeRequest` (DTO)
- `songId` 자리를 곡 정보 필드(`videoId`, `songTitle`, `channelTitle`, `thumbnailUrl`, `durationSec`)로 교체.
- 예전 `SongSubmitRequest`와 동일한 수준의 검증 추가: `videoId`/`songTitle`은 `@NotBlank`, `durationSec`은 `@NotNull`, `channelTitle`/`thumbnailUrl`은 검증 없음(선택값).
- `ChallengeRequest`에서 기존에 있던 `title`, `hostMemberId` 필드는 삭제함. 도전 요청은 이미 존재하는 배틀에 참가하는 것이라 배틀 제목이나 호스트 ID를 클라이언트가 다시 보낼 이유가 없다고 판단(어차피 아무 데서도 안 쓰이고 있었음).

### `BattleCreateResult`
- `songID` 필드 삭제. `battleId`, `title`만 남김.

### `BattleDetailResponse`
- 기존 `hostSongId`, `challengerSongId` 필드를 `hostVideoId`, `hostSongTitle`, `challengerVideoId`, `challengerSongTitle` 4개로 교체.
- 판단 근거: songId로 재조회할 대상이 아예 없어졌으니, 클라이언트가 화면에 곡 제목을 보여주고(songTitle) YouTube 임베드 재생도 해야 한다면(videoId) 둘 다 필요하다고 봄. "순수 ID만 줄지 재생에 필요한 정보까지 줄지"의 트레이드오프에서 이번엔 아예 ID 개념이 없어졌으니 videoId를 직접 넣는 쪽이 자연스럽다고 판단.

### `BattleService`
- `songRepository` 필드/import 전부 제거.
- `createOneVsOneBattle`, `joinAsChallenger` 안에 있던 `songRepository.findById(...).orElseThrow(...)` 존재 검증 로직 삭제 — 더 이상 참조할 대상이 없으니 클라이언트가 보낸 곡 정보를 그대로 믿고 저장.
- 메서드 시그니처를 개별 파라미터 나열 대신 요청 DTO(`CreateBattleRequest`, `ChallengeRequest`) 자체를 받는 형태로 정리 (원래 코드가 깨져 있어서 이 참에 정리함).
- `MatchEntry.builder()`에 `embeddable(true)` 고정값으로 채움.
- `getBattleDetail`에서 `hostPlayer.getSongId()` 대신 `getVideoId()`/`getSongTitle()`로 응답 조립.

### `BattleController`
- 서비스 메서드 시그니처 변경에 맞춰 호출부 수정, `@Valid` 추가.

### 테스트용 `.http` 파일들
- `full-flow-test.http`: 곡 등록(`/api/songs/submit`) 스텝 2개 삭제, 배틀 생성/도전 참가 요청 body에 곡 정보 인라인으로 넣음, 스텝 번호 재정렬.
- `test.http`: 같은 방식으로 body 수정.

## 검증
- `./gradlew compileJava` 통과 확인.
- 코드베이스 전체에서 `Song`, `songId`, `SongId`, `songID` 문자열 검색 결과 남은 참조 없음 확인.
- DB 마이그레이션은 별도로 안 건드림 — `ddl-auto: update`라 기존 `song` 테이블이 자동으로 안 지워지니, 필요하면 수동으로 `DROP TABLE song;` 해야 함.

---

리뷰 포인트로 특히 봐줬으면 하는 것:
1. `MatchEntry`의 nullable 제약 범위가 적절한지 (songTitle을 필수로 둔 게 맞는지)
2. `embeddable`을 스텁으로 남긴 게 맞는지, 아니면 아예 필드 자체를 제거하는 게 나았을지
3. `BattleDetailResponse`에 songTitle+videoId를 둘 다 넣은 게 과한 정보 노출은 아닌지
4. `ChallengeRequest`에서 `title`/`hostMemberId` 필드를 제거한 판단이 맞는지
5. 놓친 참조나 컴파일은 되지만 로직이 깨진 부분이 있는지
