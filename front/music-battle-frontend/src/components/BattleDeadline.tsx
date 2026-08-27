import { useEffect, useState } from 'react'
import type { MatchStatus } from '../types/api.ts'

interface Props {
  status: MatchStatus
  // 투표 종료 시각(ISO). null 이면 아직 투표 시작 전(도전자 대기 중).
  voteEndsAt?: string | null
  // 조밀한 카드용 축약 표기 여부.
  compact?: boolean
}

// 남은 시간을 "12:34", "1:02:03", "2일 3시간" 형태로 포맷.
function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')

  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${pad(minutes)}:${pad(seconds)}`
}

// 배틀의 남은 시간/상태 안내.
// - 종료(FINISHED): "종료됨"
// - 집계중(CALCULATING): "집계 중"
// - 그 외(RECRUITING/VOTING)는 voteEndsAt 으로 판단:
//   · null      → "도전자를 기다리는 중입니다"
//   · 미래       → "12:34 남음" (1초마다 재계산)
//   · 이미 지남  → "곧 결과가 집계됩니다"
export default function BattleDeadline({ status, voteEndsAt, compact = false }: Props) {
  const [now, setNow] = useState(() => Date.now())

  const isVoteWindow = status !== 'FINISHED' && status !== 'CALCULATING'
  const hasDeadline = isVoteWindow && !!voteEndsAt

  // 마감 시각이 있을 때만 1초 타이머로 카운트다운을 갱신한다.
  useEffect(() => {
    if (!hasDeadline) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [hasDeadline])

  let text: string
  let tone: 'live' | 'muted' = 'muted'

  if (status === 'FINISHED') {
    text = '종료됨'
  } else if (status === 'CALCULATING') {
    text = '집계 중'
  } else if (!voteEndsAt) {
    text = '도전자를 기다리는 중입니다'
  } else {
    const remaining = new Date(voteEndsAt).getTime() - now
    if (remaining > 0) {
      text = `${formatRemaining(remaining)} 남음`
      tone = 'live'
    } else {
      text = '곧 결과가 집계됩니다'
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${compact ? 'text-xs' : 'text-sm'} ${
        tone === 'live' ? 'font-medium text-amber-600' : 'text-gray-400'
      }`}
      title={voteEndsAt ? new Date(voteEndsAt).toLocaleString() : undefined}
    >
      <span aria-hidden>⏳</span>
      {text}
    </span>
  )
}
