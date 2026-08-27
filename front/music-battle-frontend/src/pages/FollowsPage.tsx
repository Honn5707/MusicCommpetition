import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFollowers, getFollowing } from '../api/follows.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import type { FollowUserResponse, PageResponse } from '../types/api.ts'

type Tab = 'followers' | 'following'
const SIZE = 20

// 내 팔로워 / 팔로잉 목록. (라우트: /follows)
// ※ 백엔드 followerList/followingList가 로그인 사용자 기준으로만 동작하므로 "내 목록"만 보여준다.
export default function FollowsPage() {
  const { memberId, isAuthenticated } = useAuth()
  const [tab, setTab] = useState<Tab>('followers')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<FollowUserResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPage(0)
  }, [tab])

  useEffect(() => {
    if (!isAuthenticated || memberId == null) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const fetcher = tab === 'followers' ? getFollowers : getFollowing
    fetcher(page, SIZE)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, page, isAuthenticated, memberId])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-gray-500">팔로우 목록은 로그인 후 볼 수 있어요.</p>
        <Link to="/login" state={{ from: '/follows' }} className="btn-primary mt-6 inline-block">
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-gray-900">팔로우</h1>

      <div className="mb-5 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(['followers', 'following'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
              tab === t ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t === 'followers' ? '팔로워' : '팔로잉'}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass px-6 py-10 text-center">
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      )}

      {!loading && !error && data && data.content.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <p className="text-sm text-gray-400">
            {tab === 'followers' ? '아직 팔로워가 없어요.' : '아직 팔로우한 사람이 없어요.'}
          </p>
        </div>
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <ul className="space-y-2">
            {data.content.map((u) => (
              <li key={u.memberId}>
                <Link
                  to={`/members/${u.memberId}`}
                  state={{ nickname: u.nickname }}
                  className="glass flex items-center gap-3 p-3.5 transition-colors hover:border-gray-300 hover:bg-gray-100"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 font-bold text-brand-700">
                    {u.nickname.slice(0, 1)}
                  </span>
                  <span className="truncate font-semibold text-gray-900">{u.nickname}</span>
                </Link>
              </li>
            ))}
          </ul>

          {(page > 0 || data.hasNext) && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{data.page + 1}</span> /{' '}
                {Math.max(data.totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasNext}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
