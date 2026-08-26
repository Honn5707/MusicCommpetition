import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getFollowing } from '../api/follows.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import FollowButton from '../components/FollowButton.tsx'

interface LocationState {
  nickname?: string
}

// 회원 프로필 + 팔로우 버튼. (라우트: /members/:memberId)
// ※ 백엔드에 "회원 조회" 공개 API가 없어, 닉네임은 목록에서 넘어올 때 state로 받고
//   없으면 "회원 #id"로 대체한다.
export default function MemberProfilePage() {
  const { memberId } = useParams()
  const location = useLocation()
  const { memberId: myId, isAuthenticated } = useAuth()

  const targetId = Number(memberId)
  const nickname = (location.state as LocationState | null)?.nickname
  const isSelf = myId != null && myId === targetId

  // 'loading' | true | false — 초기 팔로우 상태.
  const [followState, setFollowState] = useState<'loading' | boolean>('loading')

  useEffect(() => {
    if (!isAuthenticated || isSelf || !Number.isFinite(targetId) || myId == null) {
      setFollowState(false)
      return
    }
    let cancelled = false
    // isFollowing 전용 API가 없어, 내 팔로잉 목록을 넉넉히 받아 포함 여부로 판단한다.
    getFollowing(myId, 0, 1000)
      .then((page) => {
        if (!cancelled) setFollowState(page.content.some((u) => u.memberId === targetId))
      })
      .catch(() => {
        if (!cancelled) setFollowState(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isSelf, targetId, myId])

  if (!Number.isFinite(targetId)) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center text-white/60">
        잘못된 프로필 주소입니다.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <Link to="/" className="text-sm text-white/40 transition-colors hover:text-white">
        ← 목록으로
      </Link>

      <div className="glass mt-6 flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 text-3xl font-bold text-indigo-200">
          {(nickname ?? '?').slice(0, 1)}
        </div>
        <h1 className="text-2xl font-bold text-white">{nickname ?? `회원 #${targetId}`}</h1>

        {isSelf ? (
          <Link to="/follows" className="btn-ghost text-sm">
            내 팔로워 · 팔로잉 보기
          </Link>
        ) : isAuthenticated ? (
          followState === 'loading' ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <FollowButton targetId={targetId} initialFollowing={followState} />
          )
        ) : (
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="btn-primary px-4 py-1.5 text-sm"
          >
            로그인하고 팔로우
          </Link>
        )}
      </div>
    </div>
  )
}
