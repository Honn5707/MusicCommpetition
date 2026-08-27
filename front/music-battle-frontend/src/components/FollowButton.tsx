import { useState } from 'react'
import { followMember, unfollowMember } from '../api/follows.ts'
import { ApiError } from '../api/client.ts'

interface Props {
  targetId: number
  // 초기 팔로우 상태(프로필 API의 isFollowing).
  initialFollowing: boolean
  onChange?: (following: boolean) => void
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? '#ec4899' : 'none'}
      stroke={filled ? '#ec4899' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-.99-1a5.5 5.5 0 1 0-7.78 7.78l.99.99L12 21l7.78-7.63.99-.99a5.5 5.5 0 0 0-.01-7.78z" />
    </svg>
  )
}

// 하트 팔로우/언팔로우 토글. 빈 하트(회색)=미팔로우, 채워진 핑크 하트=팔로우.
// 자기 자신·중복 등은 백엔드가 막으므로 에러 메시지만 표시한다.
export default function FollowButton({ targetId, initialFollowing, onChange }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setLoading(true)
    setError(null)
    try {
      if (following) {
        await unfollowMember(targetId)
        setFollowing(false)
        onChange?.(false)
      } else {
        await followMember(targetId)
        setFollowing(true)
        onChange?.(true)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '요청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={following}
        aria-label={following ? '언팔로우' : '팔로우'}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
          following
            ? 'border-rose-400 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
        }`}
      >
        <HeartIcon filled={following} />
        {following ? '팔로잉' : '팔로우'}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}
