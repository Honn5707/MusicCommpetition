import { Link } from 'react-router-dom'
import type { BattleSummaryResponse, MatchStatus } from '../types/api.ts'
import BattleDeadline from './BattleDeadline.tsx'
import { formatDateTime } from '../lib/datetime.ts'

// 목록/마이페이지에서 공용으로 쓰는 노래대결 카드.
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
          ? 'border border-brand-200 bg-brand-50 text-brand-700'
          : status === 'CALCULATING'
            ? 'border border-gray-300 text-gray-600'
            : 'border border-gray-200 text-gray-400'
      }`}
    >
      {status === 'VOTING' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export function ScoreBar({ hostScore, challengerScore }: { hostScore: number; challengerScore: number }) {
  const total = hostScore + challengerScore
  const hostPct = total === 0 ? 50 : (hostScore / total) * 100
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full bg-brand-500 transition-all" style={{ width: `${hostPct}%` }} />
      <div className="h-full bg-blue-500 transition-all" style={{ width: `${100 - hostPct}%` }} />
    </div>
  )
}

// 투표수 전용 파티션 — 호스트(초록)/도전자(파랑) 득표 + 막대 + 남은 시간을 한 칸에 모아 보여준다.
export function VotePartition({
  hostScore,
  challengerScore,
  status,
  voteEndsAt,
  compact = false,
}: {
  hostScore: number
  challengerScore: number
  status: MatchStatus
  voteEndsAt?: string | null
  compact?: boolean
}) {
  const total = hostScore + challengerScore
  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 ${compact ? 'px-3 py-2.5' : 'p-4'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`font-bold uppercase tracking-wider text-gray-400 ${compact ? 'text-[11px]' : 'text-xs'}`}
        >
          투표 현황
        </span>
        <BattleDeadline status={status} voteEndsAt={voteEndsAt} compact={compact} />
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`shrink-0 font-extrabold tabular-nums text-brand-700 ${compact ? 'text-lg' : 'text-3xl'}`}
        >
          {hostScore}
        </span>
        <div className="flex-1">
          <ScoreBar hostScore={hostScore} challengerScore={challengerScore} />
        </div>
        <span
          className={`shrink-0 font-extrabold tabular-nums text-blue-600 ${compact ? 'text-lg' : 'text-3xl'}`}
        >
          {challengerScore}
        </span>
      </div>
      <div className={`mt-1.5 text-center text-gray-400 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        총 {total}표
      </div>
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
  const accent = side === 'host' ? 'text-brand-600' : 'text-blue-600'
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`max-w-[7rem] shrink-0 truncate text-sm font-semibold ${accent}`}>
          {nickname}
        </span>
        <span className="truncate text-sm text-gray-600">{songTitle}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-sm text-gray-500">
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
      className="glass group relative flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-[0_20px_44px_-22px_rgba(13,13,15,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-1 text-base font-semibold text-gray-900">{battle.title}</h2>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={battle.matchStatus} />
          {battle.createdAt && (
            <span className="text-[11px] text-gray-400">{formatDateTime(battle.createdAt)} 생성</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        {/* 호스트 진영 — 그린 강조 */}
        <div className="min-w-0 rounded-xl border border-brand-200 border-l-4 border-l-brand-500 bg-brand-50 px-3 py-2">
          <p className="truncate text-sm font-semibold text-gray-800">{battle.hostSongTitle}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{battle.hostNickname}</p>
        </div>
        <span className="self-center text-xs font-bold tracking-widest text-gray-300">VS</span>
        {/* 도전자 진영 — 블루 */}
        <div className="min-w-0 rounded-xl border border-blue-200 border-r-4 border-r-blue-500 bg-blue-50 px-3 py-2 text-right">
          {battle.challengerSongTitle ? (
            <>
              <p className="truncate text-sm font-semibold text-gray-800">{battle.challengerSongTitle}</p>
              <p className="mt-0.5 truncate text-xs text-gray-500">{battle.challengerNickname}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">상대 대기중</p>
          )}
        </div>
      </div>

      <VotePartition
        hostScore={battle.hostScore}
        challengerScore={battle.challengerScore}
        status={battle.matchStatus}
        voteEndsAt={battle.voteEndsTime}
        compact
      />

      {/* 호버 시 펼쳐지는 상세 미리보기 (grid-rows 0fr→1fr 트릭으로 높이 애니메이션) */}
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
        <div className="overflow-hidden">
          <div className="mt-1 space-y-2 border-t border-gray-200 pt-3">
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
              <p className="text-sm text-gray-400">아직 상대를 기다리는 중이에요.</p>
            )}
            <div className="flex items-center justify-between pt-1 text-sm text-gray-400">
              <span>총 {total}표{leader === 'tie' ? ' · 접전' : ''}</span>
              <span className="font-semibold text-brand-600">자세히 보기 →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
