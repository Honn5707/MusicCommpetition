import { useState } from 'react'
import { followMember, unfollowMember } from '../api/follows.ts'
import { ApiError } from '../api/client.ts'

interface Props {
  targetId: number
  // 초기 팔로우 상태(부모가 내 팔로잉 목록으로 판단해 넘겨준다).
  initialFollowing: boolean
  onChange?: (following: boolean) => void
}

// 팔로우/언팔로우 토글 버튼. 자기 자신·중복 팔로우 등은 백엔드가 막으므로 에러 메시지만 표시한다.
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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={
          following
            ? 'rounded-lg border border-white/30 bg-transparent px-4 py-1.5 text-sm font-semibold text-white/80 transition-colors hover:border-rose-400/60 hover:text-rose-300 disabled:opacity-40'
            : 'btn-primary px-4 py-1.5 text-sm disabled:opacity-40'
        }
      >
        {loading ? '처리 중…' : following ? '언팔로우' : '팔로우'}
      </button>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  )
}
