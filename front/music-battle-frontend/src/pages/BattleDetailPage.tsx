import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteBattle, getBattleDetail, joinAsChallenger, surrenderBattle } from '../api/battles.ts'
import { vote } from '../api/votes.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import BattleVideoPlayer from '../components/BattleVideoPlayer.tsx'
import { VotePartition } from '../components/BattleCard.tsx'
import BattleComments from '../components/BattleComments.tsx'
import FriendAddButton from '../components/FriendAddButton.tsx'
import { formatDateTime } from '../lib/datetime.ts'
import YoutubeDurationPreview from '../components/YoutubeDurationPreview.tsx'
import YoutubeSearchBox from '../components/YoutubeSearchBox.tsx'
import { parseYoutubeVideoId, youtubeThumbnailUrl } from '../lib/youtube.ts'
import { hasYoutubeSearch, type YoutubeSearchResult } from '../lib/youtubeSearch.ts'
import type { BattleDetailResponse, MatchStatus } from '../types/api.ts'

const STATUS_LABEL: Record<MatchStatus, string> = {
  RECRUITING: '모집중',
  VOTING: '투표중',
  CALCULATING: '집계중',
  FINISHED: '종료',
}

function StatusBadge({ status }: { status: MatchStatus }) {
  const isLive = status === 'RECRUITING' || status === 'VOTING'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium tracking-wide ${
        isLive
          ? 'border border-gray-300 bg-gray-100 text-gray-700'
          : status === 'CALCULATING'
            ? 'border border-gray-300 text-gray-600'
            : 'border border-gray-200 text-gray-400'
      }`}
    >
      {status === 'VOTING' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}

// 한쪽(호스트/도전자) 곡 카드. 진영색(호스트=초록/도전자=파랑)으로 구분하고
// 득표수·점유율·리드/승자·YouTube 링크 등 정보를 담는다.
// VOTING 상태에서는 onVote가 주어져 "투표하기" 버튼을 렌더한다.
function EntryCard({
  label,
  profileMemberId,
  songTitle,
  videoId,
  side,
  score,
  totalScore,
  isWinner,
  leading,
  dimmed,
  onVote,
  voting,
}: {
  label: string
  // 참가자 프로필로 이동하기 위한 memberId(있으면 닉네임이 링크가 된다).
  profileMemberId?: number | null
  songTitle: string
  videoId: string
  side: 'host' | 'challenger'
  score: number
  totalScore: number
  isWinner: boolean
  leading: boolean
  dimmed: boolean
  onVote?: () => void
  voting?: boolean
}) {
  const accent = side === 'host' ? 'text-brand-700' : 'text-blue-600'
  const dotColor = side === 'host' ? 'bg-brand-500' : 'bg-blue-500'
  const leadBorder = side === 'host' ? 'border-brand-300 text-brand-700' : 'border-blue-300 text-blue-600'
  const share = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0

  return (
    <div
      className={`glass flex flex-col gap-5 p-6 transition-all ${
        isWinner ? 'border-gray-400 ring-1 ring-gray-300' : ''
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
          {profileMemberId != null ? (
            <Link
              to={`/members/${profileMemberId}`}
              state={{ nickname: label }}
              className="truncate text-xl font-bold tracking-wide text-gray-800 underline-offset-4 transition-colors hover:text-gray-900 hover:underline sm:text-2xl"
            >
              {label}
            </Link>
          ) : (
            <span className="truncate text-xl font-bold tracking-wide text-gray-800 sm:text-2xl">{label}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isWinner && (
            <span className="rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white">
              WINNER 🏆
            </span>
          )}
          {profileMemberId != null && <FriendAddButton targetId={profileMemberId} />}
        </div>
      </div>

      <BattleVideoPlayer videoId={videoId} title={songTitle} />

      <div>
        <p className="truncate text-lg font-semibold text-gray-900 sm:text-xl" title={songTitle}>
          {songTitle}
        </p>
        <a
          href={`https://youtu.be/${videoId}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          YouTube에서 보기 ↗
        </a>
      </div>

      {/* 득표수 · 점유율 · 리드 */}
      <div className="flex items-end justify-between border-t border-gray-100 pt-4">
        <div>
          <p className={`text-4xl font-extrabold tabular-nums sm:text-5xl ${accent}`}>
            {score}
            <span className="ml-1 text-lg font-medium text-gray-400">표</span>
          </p>
          <p className="mt-0.5 text-sm text-gray-400">점유율 {share}%</p>
        </div>
        {leading && !isWinner && (
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${leadBorder}`}>
            리드 중 ▲
          </span>
        )}
      </div>

      {onVote && (
        <button onClick={onVote} disabled={voting} className="btn-primary mt-1 w-full text-lg">
          {voting ? '투표 중…' : '투표하기'}
        </button>
      )}
    </div>
  )
}

// 도전자가 아직 없을 때(RECRUITING) 참가 폼을 보여주는 슬롯. 참가는 로그인 필요.
function ChallengerJoinCard({ battleId, onJoined }: { battleId: number; onJoined: () => void }) {
  const { isAuthenticated } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  // 아티스트: 직접 입력값(channelTitle)과 곡 선택 시 자동 제안값(artistSuggestion)을 분리.
  // 제안값은 placeholder로만 보여주고, 비워두면 제출 시 이 값을 사용한다.
  const [channelTitle, setChannelTitle] = useState('')
  const [artistSuggestion, setArtistSuggestion] = useState('')
  const [durationSec, setDurationSec] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchEnabled = hasYoutubeSearch()
  const [source, setSource] = useState<'search' | 'link'>(searchEnabled ? 'search' : 'link')

  const videoId = parseYoutubeVideoId(videoUrl)

  useEffect(() => {
    setDurationSec(0)
    setChannelTitle('')
  }, [videoId])

  // 검색 결과 선택 시: 곡 제목은 채우고, 아티스트는 placeholder 제안값으로만 넣는다.
  function handlePickFromSearch(r: YoutubeSearchResult) {
    setVideoUrl(`https://youtu.be/${r.videoId}`)
    setSongTitle(r.title)
    setArtistSuggestion(r.channelTitle)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()

    if (!videoId) {
      setError('올바른 YouTube 링크를 입력해주세요.')
      return
    }
    if (!songTitle.trim()) {
      setError('곡 제목을 입력해주세요.')
      return
    }
    if (durationSec <= 0) {
      setError('영상 재생 시간을 아직 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      // challengerId는 보내지 않는다 — 백엔드가 JWT로 판별한다.
      await joinAsChallenger(battleId, {
        videoId,
        songTitle: songTitle.trim(),
        channelTitle: channelTitle.trim() || artistSuggestion.trim() || undefined,
        thumbnailUrl: youtubeThumbnailUrl(videoId),
        durationSec,
      })
      onJoined()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '참가에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">참가자</span>
        <span className="rounded-full border border-gray-200 px-3 py-0.5 text-sm text-gray-400">
          모집중
        </span>
      </div>
      <p className="text-base text-gray-500">내 곡으로 참가해서 노래대결을 시작하세요.</p>

      {isAuthenticated ? (
        <form onSubmit={handleJoin} className="space-y-3">
          {searchEnabled && (
            <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setSource('search')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'search' ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => setSource('link')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'link' ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                링크
              </button>
            </div>
          )}
          {searchEnabled && source === 'search' ? (
            <YoutubeSearchBox onSelect={handlePickFromSearch} />
          ) : (
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="YouTube 링크"
              className="glass-input py-2.5"
            />
          )}
          {videoId && (
            <YoutubeDurationPreview
              key={videoId}
              videoId={videoId}
              onDuration={setDurationSec}
              onMeta={(m) => {
                setSongTitle(m.title)
                setArtistSuggestion(m.author)
              }}
            />
          )}
          {(songTitle || videoId) && (
            <div className="space-y-2">
              <input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="곡 제목"
                className="glass-input py-2.5"
              />
              <input
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                placeholder={artistSuggestion || '아티스트 (선택)'}
                className="glass-input py-2.5"
              />
            </div>
          )}

          {error && <p className="text-base text-gray-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full text-lg">
            {submitting ? '참가 중…' : '참가하기'}
          </button>
        </form>
      ) : (
        <Link
          to="/login"
          state={{ from: `/battles/${battleId}` }}
          className="btn-primary block w-full text-center text-lg"
        >
          로그인하고 참가하기
        </Link>
      )}
    </div>
  )
}

export default function BattleDetailPage() {
  const { battleId } = useParams()
  const navigate = useNavigate()
  const { memberId } = useAuth()
  const id = Number(battleId)

  const [data, setData] = useState<BattleDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [votingSide, setVotingSide] = useState<'host' | 'challenger' | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  // 삭제/항복 요청의 진행 상태와 에러. 두 액션은 동시에 일어나지 않으므로 상태를 공유한다.
  const [action, setAction] = useState<'delete' | 'surrender' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!Number.isFinite(id)) {
      setError('잘못된 노래대결 주소입니다.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getBattleDetail(id)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : '노래대결 정보를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // 투표: voterMemberId는 백엔드가 JWT로 판별하므로 안 보낸다. 익명/로그인 무관하게 동작.
  async function handleVote(side: 'host' | 'challenger') {
    if (!data) return
    const matchEntryId = side === 'host' ? data.hostEntryId : data.challengerEntryId
    if (matchEntryId == null) return

    setVotingSide(side)
    setVoteError(null)
    try {
      await vote(data.matchId, {
        matchEntryId,
        useExtraVote: false,
      })
      load() // 점수 갱신
    } catch (err) {
      setVoteError(err instanceof ApiError ? err.message : '투표에 실패했습니다.')
    } finally {
      setVotingSide(null)
    }
  }

  // 노래대결 삭제: 호스트 본인 + 도전자 없음 + 모집중일 때만 백엔드가 허용한다.
  // 성공 시 상세 화면이 사라지므로 목록으로 이동한다.
  async function handleDelete() {
    if (!data) return
    if (!window.confirm('이 노래대결을 삭제할까요? 되돌릴 수 없습니다.')) return

    setAction('delete')
    setActionError(null)
    try {
      await deleteBattle(id)
      navigate('/')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : '노래대결 삭제에 실패했습니다.')
      setAction(null)
    }
  }

  // 항복: 참가자 본인 + 투표중일 때만 가능. 성공하면 상대 승리로 상태가 바뀌므로 다시 불러온다.
  async function handleSurrender() {
    if (!data) return
    if (!window.confirm('정말 항복할까요? 상대에게 승리가 부여됩니다.')) return

    setAction('surrender')
    setActionError(null)
    try {
      await surrenderBattle(id)
      load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : '항복 처리에 실패했습니다.')
    } finally {
      setAction(null)
    }
  }

  const isVoting = data?.matchStatus === 'VOTING'
  const isSettled = data?.matchStatus === 'CALCULATING' || data?.matchStatus === 'FINISHED'
  // 아래 노출 조건은 순전히 UX다 — 실제 삭제/항복 허용 여부는 서버가 JWT로 최종 결정한다.
  // 내가 호스트고, 모집중 + 도전자가 아직 없을 때만 삭제 버튼을 보여준다(백엔드 조건과 일치).
  const isHost = memberId != null && data?.hostMemberId === memberId
  const isParticipant =
    isHost || (memberId != null && data?.challengerMemberId === memberId)
  const canDelete = isHost && data?.matchStatus === 'RECRUITING' && !data?.challengerVideoId
  // 항복은 투표중 + 참가자(호스트 또는 도전자)에게만 노출한다.
  const canSurrender = isParticipant && isVoting && !!data?.challengerVideoId

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/" className="text-base text-gray-400 transition-colors hover:text-gray-900">
        ← 목록으로
      </Link>

      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
          <div className="h-96 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
        </div>
      )}

      {!loading && error && (
        <div className="glass mt-6 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={load} className="btn-ghost mt-4">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mb-6 mt-4 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">{data.title}</h1>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={data.matchStatus} />
              {data.createdAt && (
                <span className="text-xs text-gray-400">{formatDateTime(data.createdAt)} 생성</span>
              )}
            </div>
          </div>

          {isSettled && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 px-6 py-5 text-center backdrop-blur-xl">
              <p className="text-xl font-semibold text-gray-900 sm:text-2xl">
                {data.matchStatus === 'CALCULATING'
                  ? '집계 중입니다…'
                  : data.winner === 'host'
                    ? `${data.hostNickname} 승리 🏆`
                    : data.winner === 'challenger'
                      ? `${data.challengerNickname ?? '참가자'} 승리 🏆`
                      : data.winner === 'equal'
                        ? '무승부'
                        : '결과 없음'}
              </p>
            </div>
          )}

          {voteError && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-center text-base text-gray-600">
              {voteError}
            </div>
          )}

          {/* 좌: 곡 + 액션 / 우: 실시간 댓글 — 큰 화면에서 한눈에 보이도록 나란히 배치 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="min-w-0">
              {/* 투표수 전용 파티션 — 도전자가 있을 때만(모집중엔 득표 의미 없음) */}
              {data.challengerVideoId && (
                <div className="mb-5">
                  <VotePartition
                    hostScore={data.hostScore}
                    challengerScore={data.challengerScore}
                    status={data.matchStatus}
                    voteEndsAt={data.voteEndsAt}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
                <EntryCard
                  label={data.hostNickname}
                  profileMemberId={data.hostMemberId}
                  songTitle={data.hostSongTitle}
                  videoId={data.hostVideoId}
                  side="host"
                  score={data.hostScore}
                  totalScore={data.hostScore + data.challengerScore}
                  leading={data.hostScore > data.challengerScore}
                  isWinner={data.matchStatus === 'FINISHED' && data.winner === 'host'}
                  dimmed={data.matchStatus === 'FINISHED' && data.winner === 'challenger'}
                  onVote={isVoting ? () => handleVote('host') : undefined}
                  voting={votingSide === 'host'}
                />

                {data.challengerVideoId && data.challengerSongTitle ? (
                  <EntryCard
                    label={data.challengerNickname ?? '참가자'}
                    profileMemberId={data.challengerMemberId}
                    songTitle={data.challengerSongTitle}
                videoId={data.challengerVideoId}
                side="challenger"
                score={data.challengerScore}
                totalScore={data.hostScore + data.challengerScore}
                leading={data.challengerScore > data.hostScore}
                isWinner={data.matchStatus === 'FINISHED' && data.winner === 'challenger'}
                dimmed={data.matchStatus === 'FINISHED' && data.winner === 'host'}
                onVote={isVoting ? () => handleVote('challenger') : undefined}
                voting={votingSide === 'challenger'}
              />
            ) : data.matchStatus === 'RECRUITING' ? (
              // 내 노래대결에는 참가할 수 없으니, 호스트에게는 폼 대신 대기 안내를 보여준다.
              isHost ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center backdrop-blur-xl">
                  <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                    참가자
                  </span>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
                  <p className="text-base text-gray-400">플레이어를 기다리는 중…</p>
                </div>
              ) : (
                <ChallengerJoinCard battleId={id} onJoined={load} />
              )
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-base text-gray-400 backdrop-blur-xl">
                참가자가 없습니다.
              </div>
            )}
          </div>

          {(canDelete || canSurrender) && (
            <div className="mt-6 flex flex-col items-end gap-2">
              {actionError && (
                <p className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-center text-base text-gray-600">
                  {actionError}
                </p>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={action !== null}
                  className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:opacity-40"
                >
                  {action === 'delete' ? '삭제 중…' : '노래대결 삭제'}
                </button>
              )}
              {canSurrender && (
                <button
                  onClick={handleSurrender}
                  disabled={action !== null}
                  className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-2 text-base font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900 disabled:opacity-40"
                >
                  {action === 'surrender' ? '항복 처리 중…' : '항복하기'}
                </button>
              )}
            </div>
          )}
            </div>

            <div className="lg:sticky lg:top-20">
              <BattleComments battleId={id} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
