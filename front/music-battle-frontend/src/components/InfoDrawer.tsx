import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.tsx'
import { getMyPage } from '../api/members.ts'
import { getFollowers, getFollowing } from '../api/follows.ts'
import type { FollowUserResponse } from '../types/api.ts'

type Tab = 'followers' | 'following'

// 우측 상단 햄버거로 여는 "내 정보" 드로어. 오른쪽에서 슬라이드된다.
// 프로필(닉네임/포인트) + 마이페이지 이동 + 팔로워/팔로잉 탭 목록을 담는다.
export default function InfoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<{ nickname: string; points: number } | null>(null)
  const [tab, setTab] = useState<Tab>('followers')
  const [list, setList] = useState<FollowUserResponse[]>([])
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [listLoading, setListLoading] = useState(false)

  // ESC로 닫기.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 프로필(닉네임/포인트) — 열릴 때 조회.
  useEffect(() => {
    if (!open || !isAuthenticated) return
    let cancelled = false
    getMyPage(0, 1)
      .then((res) => {
        if (!cancelled) setProfile({ nickname: res.nickname, points: res.pointBalance })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open, isAuthenticated])

  // 팔로워/팔로잉 목록 — 열려 있고 탭이 바뀔 때 첫 페이지부터.
  useEffect(() => {
    if (!open || !isAuthenticated) return
    let cancelled = false
    setListLoading(true)
    setList([])
    setPage(0)
    const fetcher = tab === 'followers' ? getFollowers : getFollowing
    fetcher(0, 20)
      .then((res) => {
        if (cancelled) return
        setList(res.content)
        setHasNext(res.hasNext)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, isAuthenticated, tab])

  async function loadMore() {
    const next = page + 1
    const fetcher = tab === 'followers' ? getFollowers : getFollowing
    try {
      const res = await fetcher(next, 20)
      setList((prev) => [...prev, ...res.content])
      setPage(next)
      setHasNext(res.hasNext)
    } catch {
      /* 무시 — 다시 시도 가능 */
    }
  }

  function goProfile(u: FollowUserResponse) {
    onClose()
    navigate(`/members/${u.memberId}`, { state: { nickname: u.nickname } })
  }

  function handleLogout() {
    logout()
    onClose()
    navigate('/')
  }

  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* 딤 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 우측 패널 */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">내 정보</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        {/* 프로필 */}
        <div className="flex items-center gap-3 px-5 py-5">
          {/* 프로필 이미지 자리(백엔드 이미지 필드 추가 전까지 이니셜) */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xl font-bold text-brand-700">
            {profile?.nickname?.slice(0, 1) ?? '·'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-900">{profile?.nickname ?? '…'}</p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-brand-600">
                {profile ? profile.points.toLocaleString() : '—'}
              </span>{' '}
              P
            </p>
          </div>
        </div>

        <div className="space-y-2 px-5">
          <button
            onClick={() => {
              onClose()
              navigate('/battles/new')
            }}
            className="btn-primary w-full"
          >
            + 노래대결 만들기
          </button>
          <button
            onClick={() => {
              onClose()
              navigate('/mypage')
            }}
            className="btn-ghost w-full"
          >
            마이페이지
          </button>
        </div>

        {/* 팔로워 / 팔로잉 탭 */}
        <div className="mx-5 mt-5 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {(['followers', 'following'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
                tab === t ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t === 'followers' ? '팔로워' : '팔로잉'}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="mt-3 flex-1 overflow-y-auto px-5 pb-5">
          {listLoading ? (
            <div className="space-y-2 pt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-50" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="pt-6 text-center text-sm text-gray-400">
              {tab === 'followers' ? '아직 팔로워가 없어요.' : '아직 팔로우한 사람이 없어요.'}
            </p>
          ) : (
            <>
              <ul className="space-y-1.5">
                {list.map((u) => (
                  <li key={u.memberId}>
                    <button
                      onClick={() => goProfile(u)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-100"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                        {u.nickname.slice(0, 1)}
                      </span>
                      <span className="truncate font-medium text-gray-900">{u.nickname}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {hasNext && (
                <button
                  onClick={loadMore}
                  className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  더 보기
                </button>
              )}
            </>
          )}
        </div>

        <div className="border-t border-gray-200 px-5 py-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            로그아웃
          </button>
        </div>
      </aside>
    </div>
  )
}
