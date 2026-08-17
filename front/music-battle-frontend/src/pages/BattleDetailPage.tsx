import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteBattle, getBattleDetail, joinAsChallenger, surrenderBattle } from '../api/battles.ts'
import { vote } from '../api/votes.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import YoutubeDurationPreview from '../components/YoutubeDurationPreview.tsx'
import YoutubeSearchBox from '../components/YoutubeSearchBox.tsx'
import { getFingerprintId } from '../lib/fingerprint.ts'
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
          ? 'border border-indigo-400/40 bg-indigo-500/15 text-indigo-100'
          : status === 'CALCULATING'
            ? 'border border-white/20 text-white/70'
            : 'border border-white/10 text-white/40'
      }`}
    >
      {status === 'VOTING' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />
      )}
      {STATUS_LABEL[status]}
    </span>
  )
}

function YoutubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/40">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

// 한쪽(호스트/도전자) 곡 카드. isWinner면 그라데이션 테두리로 강조한다.
// VOTING 상태에서는 onVote가 주어져 "투표하기" 버튼을 렌더한다.
function EntryCard({
  label,
  songTitle,
  videoId,
  score,
  isWinner,
  dimmed,
  onVote,
  voting,
}: {
  label: string
  songTitle: string
  videoId: string
  score: number
  isWinner: boolean
  dimmed: boolean
  onVote?: () => void
  voting?: boolean
}) {
  return (
    <div
      className={`glass flex flex-col gap-4 p-5 transition-all ${
        isWinner ? 'border-indigo-400/70' : ''
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold tracking-wide text-white/80 sm:text-2xl">{label}</span>
        {isWinner && (
          <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm font-semibold text-white">
            WINNER
          </span>
        )}
      </div>
      <YoutubeEmbed videoId={videoId} title={songTitle} />
      <div>
        <p className="text-2xl font-semibold text-white sm:text-3xl">{songTitle}</p>
        <p className="mt-1 text-5xl font-bold tracking-tight text-white sm:text-6xl">
          {score}
          <span className="ml-1.5 text-xl font-medium text-white/40">표</span>
        </p>
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
  const [durationSec, setDurationSec] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchEnabled = hasYoutubeSearch()
  const [source, setSource] = useState<'search' | 'link'>(searchEnabled ? 'search' : 'link')

  const videoId = parseYoutubeVideoId(videoUrl)

  useEffect(() => {
    setDurationSec(0)
  }, [videoId])

  // 검색 결과 선택 시: videoId를 URL로 넣어 기존 파싱/재생시간 로직을 태우고 곡 제목을 채운다.
  function handlePickFromSearch(r: YoutubeSearchResult) {
    setVideoUrl(`https://youtu.be/${r.videoId}`)
    setSongTitle(r.title)
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
    <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-widest text-white/40">참가자</span>
        <span className="rounded-full border border-white/10 px-3 py-0.5 text-sm text-white/40">
          모집중
        </span>
      </div>
      <p className="text-base text-white/50">내 곡으로 참가해서 듣기평가를 시작하세요.</p>

      {isAuthenticated ? (
        <form onSubmit={handleJoin} className="space-y-3">
          {searchEnabled && (
            <div className="flex gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => setSource('search')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'search' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                검색
              </button>
              <button
                type="button"
                onClick={() => setSource('link')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'link' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
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
            <YoutubeDurationPreview key={videoId} videoId={videoId} onDuration={setDurationSec} />
          )}
          <input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="곡 제목"
            className="glass-input py-2.5"
          />

          {error && <p className="text-base text-rose-300">{error}</p>}

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
      setError('잘못된 듣기평가 주소입니다.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getBattleDetail(id)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : '듣기평가 정보를 불러오지 못했습니다.')
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
        fingerprintId: getFingerprintId(),
        useExtraVote: false,
      })
      load() // 점수 갱신
    } catch (err) {
      setVoteError(err instanceof ApiError ? err.message : '투표에 실패했습니다.')
    } finally {
      setVotingSide(null)
    }
  }

  // 듣기평가 삭제: 호스트 본인 + 도전자 없음 + 모집중일 때만 백엔드가 허용한다.
  // 성공 시 상세 화면이 사라지므로 목록으로 이동한다.
  async function handleDelete() {
    if (!data) return
    if (!window.confirm('이 듣기평가를 삭제할까요? 되돌릴 수 없습니다.')) return

    setAction('delete')
    setActionError(null)
    try {
      await deleteBattle(id)
      navigate('/')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : '듣기평가 삭제에 실패했습니다.')
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/" className="text-base text-white/40 transition-colors hover:text-white">
        ← 목록으로
      </Link>

      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="h-96 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          <div className="h-96 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
        </div>
      )}

      {!loading && error && (
        <div className="glass mt-6 px-6 py-10 text-center">
          <p className="text-sm text-white/60">{error}</p>
          <button onClick={load} className="btn-ghost mt-4">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mb-6 mt-4 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">{data.title}</h1>
            <StatusBadge status={data.matchStatus} />
          </div>

          {isSettled && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-indigo-500/10 px-6 py-5 text-center backdrop-blur-xl">
              <p className="text-xl font-semibold text-white sm:text-2xl">
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
            <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-center text-base text-rose-200">
              {voteError}
            </div>
          )}

          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <EntryCard
              label={data.hostNickname}
              songTitle={data.hostSongTitle}
              videoId={data.hostVideoId}
              score={data.hostScore}
              isWinner={data.matchStatus === 'FINISHED' && data.winner === 'host'}
              dimmed={data.matchStatus === 'FINISHED' && data.winner === 'challenger'}
              onVote={isVoting ? () => handleVote('host') : undefined}
              voting={votingSide === 'host'}
            />

            {data.challengerVideoId && data.challengerSongTitle ? (
              <EntryCard
                label={data.challengerNickname ?? '참가자'}
                songTitle={data.challengerSongTitle}
                videoId={data.challengerVideoId}
                score={data.challengerScore}
                isWinner={data.matchStatus === 'FINISHED' && data.winner === 'challenger'}
                dimmed={data.matchStatus === 'FINISHED' && data.winner === 'host'}
                onVote={isVoting ? () => handleVote('challenger') : undefined}
                voting={votingSide === 'challenger'}
              />
            ) : data.matchStatus === 'RECRUITING' ? (
              // 내 듣기평가에는 참가할 수 없으니, 호스트에게는 폼 대신 대기 안내를 보여준다.
              isHost ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
                  <span className="text-sm font-semibold uppercase tracking-widest text-white/40">
                    참가자
                  </span>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-300" />
                  <p className="text-base text-white/40">플레이어를 기다리는 중…</p>
                </div>
              ) : (
                <ChallengerJoinCard battleId={id} onJoined={load} />
              )
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.04] p-5 text-base text-white/40 backdrop-blur-xl">
                참가자가 없습니다.
              </div>
            )}
          </div>

          {(canDelete || canSurrender) && (
            <div className="mt-6 flex flex-col items-end gap-2">
              {actionError && (
                <p className="w-full rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-center text-base text-rose-200">
                  {actionError}
                </p>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={action !== null}
                  className="rounded-xl border border-white/20 bg-white/[0.04] px-4 py-2 text-base font-semibold text-white/70 transition-colors hover:border-rose-400/60 hover:text-rose-300 disabled:opacity-40"
                >
                  {action === 'delete' ? '삭제 중…' : '듣기평가 삭제'}
                </button>
              )}
              {canSurrender && (
                <button
                  onClick={handleSurrender}
                  disabled={action !== null}
                  className="rounded-xl border border-white/20 bg-white/[0.04] px-4 py-2 text-base font-semibold text-white/70 transition-colors hover:border-rose-400/60 hover:text-rose-300 disabled:opacity-40"
                >
                  {action === 'surrender' ? '항복 처리 중…' : '항복하기'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
