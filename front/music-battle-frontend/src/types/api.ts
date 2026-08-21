// 이 파일의 타입들은 백엔드 web/dto 패키지의 record들과 필드 하나하나 대응된다.
// 백엔드 DTO가 바뀌면 여기도 같이 바꿔야 한다 (지금은 수동 동기화 - 나중에
// OpenAPI 스펙에서 자동 생성하는 방식으로 바꿀 수도 있음, 지금 규모엔 과함).

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'KAKAO'

// ── 회원 ──────────────────────────────────────────────
export interface MemberRegisterRequest {
  provider: AuthProvider
  providerId: string
  // 백엔드가 LOCAL 가입 시 8~16자 비밀번호를 요구한다.
  password: string
  nickname: string
  // 이메일 인증을 거친 주소. 백엔드가 인증 완료 상태(Redis)를 확인하고,
  // 미인증이면 409 { error: "이메일 인증을 하지 않았습니다!" }를 낸다.
  email: string
}

export interface MemberRegisterResult {
  id: number
}

// ── 이메일 인증 ────────────────────────────────────────
// 가입 전 이메일 소유를 확인하는 2단계 플로우.
// 1) code-send 로 6자리 코드를 발송하고, 2) code-confirm 으로 검증한다.
export interface EmailCodeSendRequest {
  email: string
}

export interface EmailCodeConfirmRequest {
  email: string
  code: string
}

// ── 로그인 ────────────────────────────────────────────
export interface LoginRequest {
  providerId: string
  password: string
}

export interface LoginResponse {
  token: string
  // rotation 방식 리프레시 토큰. 로그인 시 함께 저장한다.
  refreshToken: string
  memberId: number
}

// POST /api/auth/refresh 응답. 재발급 시 accessToken/refreshToken 모두 새 값으로 교체된다.
export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

// ── 소셜(OAuth) 로그인 ───────────────────────────────────
// GET /api/auth/{provider}/callback?code=... 의 응답.
// - 기존 회원: isNewMember=false, loginResponse에 토큰이 채워진다.
// - 신규 회원: isNewMember=true, tempToken을 받아 닉네임 확정(POST /api/auth/oauth-register)으로 넘어간다.
export interface OauthResponse {
  isNewMember: boolean
  loginResponse: LoginResponse | null
  tempToken: string | null
}

// POST /api/auth/oauth-register 요청. (백엔드 실제 경로는 oauth-register, 필드는 name/tempToken)
export interface OauthRegisterRequest {
  tempToken: string
  name: string
}

// 회원탈퇴 요청. LOCAL 계정은 비밀번호 확인이 필요하다.
export interface DeleteAccountRequest {
  password: string
}

// ── 듣기평가 생성 / 참가 ──────────────────────────────────
// hostMemberId 는 보내지 않는다 — 백엔드가 JWT(@AuthenticationPrincipal)로 판별한다.
export interface CreateBattleRequest {
  title: string
  videoId: string
  songTitle: string
  channelTitle?: string
  thumbnailUrl?: string
  durationSec: number
  // 도전자가 참가한 뒤 투표가 열려 있는 시간(초). 백엔드가 필수로 요구한다(@NotNull).
  voteDurationSec: number
}

export interface BattleCreateResult {
  battleId: number
  title: string
}

// challengerId 도 보내지 않는다 — 백엔드가 JWT로 판별한다.
export interface ChallengeRequest {
  videoId: string
  songTitle: string
  channelTitle?: string
  thumbnailUrl?: string
  durationSec: number
}

// match.getStatus() 가 리턴하는 값 (Match 엔티티의 상태머신:
// RECRUITING → VOTING → CALCULATING → FINISHED)
export type MatchStatus = 'RECRUITING' | 'VOTING' | 'CALCULATING' | 'FINISHED'
export interface BattleDetailResponse {
  title: string
  // 투표 API(POST /api/matches/{matchId}/votes) URL 구성에 필요하다.
  matchId: number
  matchStatus: MatchStatus
  hostVideoId: string
  hostSongTitle: string
  challengerVideoId: string | null
  challengerSongTitle: string | null
  hostScore: number
  challengerScore: number
  winner: 'host' | 'challenger' | 'equal' | 'none'
  hostEntryId: number
  challengerEntryId: number | null
  // 순전히 UX용 — "내가 호스트/도전자인지" 판별해 삭제·항복 버튼 노출을 결정한다.
  // 실제 권한 검사는 서버가 JWT(@AuthenticationPrincipal)로 하므로 이 값은 신뢰 경계가 아니다.
  hostMemberId: number
  challengerMemberId: number | null
  // 화면 라벨을 "호스트/도전자" 대신 실제 참가자 닉네임으로 표시하기 위한 값.
  hostNickname: string
  challengerNickname: string | null
  // 투표 종료 시각(ISO 8601, LocalDateTime 직렬화 예: "2026-08-21T15:00:00").
  // null 이면 아직 투표 시작 전(도전자 대기 중). 상세 응답의 필드명은 voteEndsAt 이다.
  voteEndsAt: string | null
  // 배틀 생성 시각(선택). 백엔드 DTO에 아직 없으면 undefined → 표시 생략.
  createdAt?: string | null
}

// ── 듣기평가 목록 ─────────────────────────────────────────
export interface BattleSummaryResponse {
  battleId: number
  title: string
  hostSongTitle: string
  challengerSongTitle: string | null
  hostScore: number
  challengerScore: number
  matchStatus: MatchStatus
  // 목록/마이페이지에서 "호스트/도전자" 대신 닉네임을 표시하기 위한 값.
  hostNickname: string
  challengerNickname: string | null
  // 투표 종료 시각(ISO 8601). null 이면 도전자 대기 중.
  // ※ 목록 응답의 실제 JSON 키는 voteEndsTime 으로, 상세(voteEndsAt)와 이름이 다르다.
  voteEndsTime: string | null
  // 배틀 생성 시각(선택). 백엔드 DTO에 아직 없으면 undefined → 표시 생략.
  createdAt?: string | null
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

// ── 마이페이지 ────────────────────────────────────────
// 진행 중 듣기평가는 개수가 적어 전체 리스트로, 종료 듣기평가는 페이지네이션으로 내려준다.
// 필드명은 백엔드 MemberPageResponse record와 그대로 대응한다.
export interface MemberPageResponse {
  currentBattleSummaryResponse: BattleSummaryResponse[]
  finishedBattleSummaryResponse: PageResponse<BattleSummaryResponse>
  nickname: string
  pointBalance: number
}

// ── 투표 ──────────────────────────────────────────────
// voterMemberId 는 보내지 않는다 — 백엔드가 JWT로 판별하고, 없으면 익명 투표 처리한다.
export interface VoteRequest {
  matchEntryId: number
  useExtraVote: boolean
}

export interface VoteResult {
  matchId: number
  matchEntryId: number
  voterMemberId: number | null
  score: number
}

// ── 공통 에러 응답 (GlobalExceptionHandler 형식) ──────
export interface ApiErrorBody {
  error: string
}
