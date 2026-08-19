import { useEffect, useState } from 'react'
import type { MatchStatus } from '../types/api.ts'

interface Props {
  status: MatchStatus
  // 투표 마감 시각(ISO). 백엔드가 아직 안 내려주면 undefined → VOTING 남은시간은 표시 못 함.
  votingEndsAt?: string | null
  // 조밀한 카드용 축약 표기(아이콘만) 여부.
  compact?: boolean
}

// 남은 시간을 "1일 3시간", "12:34" 형태로 포맷.
function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${minutes}분`
  // 1시간 미만은 mm:ss 로 초 단위까지 보여준다.
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// 배틀의 상태별 "만료시간" 안내.
// - VOTING: votingEndsAt까지 남은 시간을 1초마다 갱신해서 보여준다(없으면 "투표중").
// - RECRUITING: 상대 대기중이라 마감이 없다 → "상대 대기중".
// - CALCULATING/FINISHED: "집계중"/"종료됨".
export default function BattleDeadline({ status, votingEndsAt, compact = false }: Props) {
  const [now, setNow] = useState(() => Date.now())

  // VOTING이고 마감 시각이 있을 때만 1초 타이머를 돌린다.
  const isCountingDown = status === 'VOTING' && !!votingEndsAt
  useEffect(() => {
    if (!isCountingDown) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [isCountingDown])

  let text: string
  let tone: 'live' | 'muted' = 'muted'

  if (status === 'VOTING') {
    if (!votingEndsAt) return null // 마감 시각을 모르면 이 뱃지는 숨긴다(상태 뱃지가 이미 "투표중"을 표시).
    const remaining = new Date(votingEndsAt).getTime() - now
    text = remaining > 0 ? `투표 마감까지 ${formatRemaining(remaining)}` : '곧 마감'
    tone = 'live'
  } else if (status === 'RECRUITING') {
    text = '상대 대기중'
  } else if (status === 'CALCULATING') {
    text = '집계중'
  } else {
    text = '종료됨'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${compact ? 'text-xs' : 'text-sm'} ${
        tone === 'live' ? 'font-medium text-amber-200' : 'text-white/45'
      }`}
      title={votingEndsAt ? new Date(votingEndsAt).toLocaleString() : undefined}
    >
      <span aria-hidden>⏳</span>
      {text}
    </span>
  )
}
