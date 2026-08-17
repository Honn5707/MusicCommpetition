import { Link } from 'react-router-dom'
import type { BattleSummaryResponse, MatchStatus } from '../types/api.ts'

// 목록/마이페이지에서 공용으로 쓰는 듣기평가 카드.
// 커서를 올리면(hover) 상세 정보(참가자별 곡·득표·리드 표시)가 아래로 부드럽게 펼쳐진다.

const STATUS_LABEL: Record<MatchStatus, string> = {
  RECRUITING: '모집중',
  VOTING: '투표중',
  CALCULATING: '집계중',
  FINISHED: '종료',
}

export function StatusBadge({ status }: { status: MatchStatus }) {
  const isLive = status === 'RECRUITING' || status === 'VOTING'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${
        isLive
          ? 'border border-indigo-400/40 bg-indigo-500/15 text-indigo-100'
          : status === 'CALCULATING'
            ? 'border border-white/20 text-white/70'
            : 'border border-white/10 text-white/40'
      }`}
    >
      {status === 'VOTING' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export function ScoreBar({ hostScore, challengerScore }: { hostScore: number; challengerScore: number }) {
  const total = hostScore + challengerScore
  const hostPct = total === 0 ? 50 : (hostScore / total) * 100
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full bg-indigo-400 transition-all" style={{ width: `${hostPct}%` }} />
      <div className="h-full bg-rose-400/80 transition-all" style={{ width: `${100 - hostPct}%` }} />
    </div>
  )
}

// 호버 시 펼쳐지는 상세 영역의 한 줄(참가자별).
function DetailRow({
  side,
  nickname,
  songTitle,
  score,
  leading,
}: {
  side: 'host' | 'challenger'
  nickname: string
  songTitle: string
  score: number
  leading: boolean
}) {
  const accent = side === 'host' ? 'text-indigo-300' : 'text-rose-300'
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`max-w-[7rem] shrink-0 truncate text-sm font-semibold ${accent}`}>
          {nickname}
        </span>
        <span className="truncate text-sm text-white/70">{songTitle}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-sm text-white/60">
        {leading && <span className={accent}>▲</span>}
        <span className="tabular-nums">{score}표</span>
      </div>
    </div>
  )
}

export function BattleCard({ battle }: { battle: BattleSummaryResponse }) {
  const hasChallenger = battle.challengerSongTitle != null
  const total = battle.hostScore + battle.challengerScore
  const leader = !hasChallenger
    ? null
    : battle.hostScore === battle.challengerScore
      ? 'tie'
      : battle.hostScore > battle.challengerScore
        ? 'host'
        : 'challenger'

  return (
    <Link
      to={`/battles/${battle.battleId}`}
      className="glass group relative flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-1 text-base font-semibold text-white">{battle.title}</h2>
        <StatusBadge status={battle.matchStatus} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90">{battle.hostSongTitle}</p>
          <p className="mt-0.5 truncate text-xs text-white/45">
            {battle.hostNickname} · {battle.hostScore}표
          </p>
        </div>
        <span className="text-xs font-bold tracking-widest text-white/30">VS</span>
        <div className="min-w-0 text-right">
          {battle.challengerSongTitle ? (
            <>
              <p className="truncate text-sm font-medium text-white/90">{battle.challengerSongTitle}</p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {battle.challengerNickname} · {battle.challengerScore}표
              </p>
            </>
          ) : (
            <p className="text-sm text-white/40">상대 대기중</p>
          )}
        </div>
      </div>

      <ScoreBar hostScore={battle.hostScore} challengerScore={battle.challengerScore} />

      {/* 호버 시 펼쳐지는 상세 미리보기 (grid-rows 0fr→1fr 트릭으로 높이 애니메이션) */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="mt-1 space-y-2 border-t border-white/10 pt-3">
            <DetailRow
              side="host"
              nickname={battle.hostNickname}
              songTitle={battle.hostSongTitle}
              score={battle.hostScore}
              leading={leader === 'host'}
            />
            {hasChallenger ? (
              <DetailRow
                side="challenger"
                nickname={battle.challengerNickname ?? '참가자'}
                songTitle={battle.challengerSongTitle ?? ''}
                score={battle.challengerScore}
                leading={leader === 'challenger'}
              />
            ) : (
              <p className="text-sm text-white/40">아직 상대를 기다리는 중이에요.</p>
            )}
            <div className="flex items-center justify-between pt-1 text-sm text-white/40">
              <span>총 {total}표{leader === 'tie' ? ' · 접전' : ''}</span>
              <span className="font-medium text-indigo-300">자세히 보기 →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
