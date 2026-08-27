import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getMemberProfile } from '../api/members.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import FollowButton from '../components/FollowButton.tsx'
import { BattleCard } from '../components/BattleCard.tsx'
import type { MemberProfileResponse } from '../types/api.ts'

interface LocationState {
  nickname?: string
}

// 회원 프로필. (라우트: /members/:memberId)
// GET /api/members/{id}/profile 로 닉네임·팔로워/팔로잉 수·isFollowing·진행 중 대결을 받아온다.
export default function MemberProfilePage() {
  const { memberId } = useParams()
  const location = useLocation()
  const { memberId: myId, isAuthenticated } = useAuth()

  const targetId = Number(memberId)
  const isSelf = myId != null && myId === targetId
  const fallbackNickname = (location.state as LocationState | null)?.nickname

  const [data, setData] = useState<MemberProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 팔로우 토글 시 즉시 반영하기 위한 로컬 카운트.
  const [followerCount, setFollowerCount] = useState(0)

  const load = useCallback(() => {
    if (!Number.isFinite(targetId)) {
      setError('잘못된 프로필 주소입니다.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getMemberProfile(targetId)
      .then((res) => {
        setData(res)
        setFollowerCount(res.followerCount)
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : '프로필을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [targetId])

  useEffect(() => {
    load()
  }, [load])

  const nickname = data?.nickname ?? fallbackNickname ?? `회원 #${targetId}`

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/" className="text-sm text-gray-400 transition-colors hover:text-gray-900">
        ← 목록으로
      </Link>

      {loading && <div className="glass mt-6 h-44 animate-pulse" />}

      {!loading && error && (
        <div className="glass mt-6 px-6 py-10 text-center text-sm text-gray-500">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="glass mt-6 flex flex-col items-center gap-4 p-8 text-center">
            {/* 프로필 이미지 자리 — 아직 백엔드 이미지 필드 없어 이니셜로 대체 */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/15 text-3xl font-bold text-brand-700">
              {nickname.slice(0, 1)}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{nickname}</h1>

            <div className="flex gap-6 text-sm">
              <span>
                <b className="font-bold text-gray-900">{followerCount}</b>{' '}
                <span className="text-gray-500">팔로워</span>
              </span>
              <span>
                <b className="font-bold text-gray-900">{data.followingCount}</b>{' '}
                <span className="text-gray-500">팔로잉</span>
              </span>
            </div>

            {isSelf ? (
              <span className="text-xs text-gray-400">내 프로필</span>
            ) : isAuthenticated ? (
              <FollowButton
                targetId={targetId}
                initialFollowing={data.isFollowing}
                onChange={(f) => setFollowerCount((c) => Math.max(0, c + (f ? 1 : -1)))}
              />
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

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              진행 중인 노래대결
              <span className="ml-2 text-sm font-semibold text-gray-400">
                {(data.currentBattleSummaryResponse ?? []).length}
              </span>
            </h2>
            {(data.currentBattleSummaryResponse ?? []).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.currentBattleSummaryResponse.map((b) => (
                  <BattleCard key={b.battleId} battle={b} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                <p className="text-sm text-gray-400">진행 중인 노래대결이 없어요.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
