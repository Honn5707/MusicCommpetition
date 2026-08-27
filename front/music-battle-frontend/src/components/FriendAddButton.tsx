import { useState } from 'react'
import { Link } from 'react-router-dom'
import { followMember } from '../api/follows.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

// 참가자 옆에 붙는 "팔로우" 버튼. 팔로우 전용 — 취소는 프로필 하트에서 한다.
// - 본인에게는 렌더하지 않음
// - 비로그인은 로그인 유도
// - 이미 팔로우 상태(409)면 "팔로잉 ✓"로 처리
export default function FriendAddButton({ targetId }: { targetId: number }) {
  const { memberId, isAuthenticated } = useAuth()
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  // 본인 카드에는 표시하지 않는다.
  if (memberId != null && memberId === targetId) return null

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
      >
        팔로우
      </Link>
    )
  }

  if (added) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
        팔로잉 ✓
      </span>
    )
  }

  async function add() {
    setLoading(true)
    setNote(null)
    try {
      await followMember(targetId)
      setAdded(true)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '요청에 실패했습니다.'
      // 이미 팔로우 상태면 팔로잉으로 간주한다.
      if (err instanceof ApiError && msg.includes('이미 팔로우')) {
        setAdded(true)
      } else {
        setNote(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={add}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:scale-[1.03] hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
      >
        {loading ? '처리 중…' : '팔로우'}
      </button>
      {note && <span className="max-w-[10rem] text-right text-[11px] text-gray-400">{note}</span>}
    </div>
  )
}
