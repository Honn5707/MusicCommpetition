import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { getBattleList } from '../api/battles.ts'
import { ApiError } from '../api/client.ts'
import { BattleCard } from '../components/BattleCard.tsx'
import type { BattleSummaryResponse, MatchStatus } from '../types/api.ts'

// 상태별 페이지 필터. (완료 탭은 집계중까지 포함해 투표가 끝난 배틀을 모은다)
export type BattleFilter = 'VOTING' | 'RECRUITING' | 'FINISHED'

// 백엔드 목록 API에 상태 필터가 없어, 한 번에 넉넉히 받아 클라이언트에서 분류·페이지네이션한다.
// (앱 규모가 작아 충분. 배틀이 이보다 많아지면 백엔드에 status 필터 파라미터가 필요하다.)
const FETCH_SIZE = 100
const PAGE_SIZE = 6

const TABS: { key: BattleFilter; label: string; to: string }[] = [
  { key: 'VOTING', label: '투표중', to: '/' },
  { key: 'RECRUITING', label: '모집중', to: '/recruiting' },
  { key: 'FINISHED', label: '완료', to: '/finished' },
]

const HEADINGS: Record<BattleFilter, { title: string; subtitle: string; empty: string }> = {
  VOTING: {
    title: '투표중인 듣기평가',
    subtitle: '두 곡을 듣고 더 마음에 드는 쪽에 한 표를 던지세요.',
    empty: '지금 투표중인 듣기평가가 없습니다.',
  },
  RECRUITING: {
    title: '모집중인 듣기평가',
    subtitle: '도전자를 기다리는 중이에요. 내 곡으로 참가해보세요.',
    empty: '모집중인 듣기평가가 없습니다.',
  },
  FINISHED: {
    title: '완료된 듣기평가',
    subtitle: '지난 대결의 결과를 확인하세요.',
    empty: '완료된 듣기평가가 없습니다.',
  },
}

function matchesFilter(status: MatchStatus, filter: BattleFilter): boolean {
  if (filter === 'FINISHED') return status === 'FINISHED' || status === 'CALCULATING'
  return status === filter
}

export default function BattleListPage({ filter = 'VOTING' }: { filter?: BattleFilter }) {
  const [all, setAll] = useState<BattleSummaryResponse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [page, setPage] = useState(0)

  // 탭(필터)이 바뀌면 페이지를 처음으로 되돌린다.
  useEffect(() => {
    setPage(0)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getBattleList(0, FETCH_SIZE)
      .then((result) => {
        if (!cancelled) setAll(result.content)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : '듣기평가 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [retryKey])

  const filtered = useMemo(
    () => (all ?? []).filter((b) => matchesFilter(b.matchStatus, filter)),
    [all, filter],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const heading = HEADINGS[filter]

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* 상태별 탭 */}
      <div className="mb-5 flex gap-1 rounded-xl border border-white/15 bg-white/[0.03] p-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            end
            className={({ isActive }) =>
              `flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors ${
                isActive ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{heading.title}</h1>
          <p className="mt-1 text-sm text-white/50">{heading.subtitle}</p>
        </div>
        <Link to="/battles/new" className="btn-primary text-sm px-4 py-1.5">
          + 듣기평가 만들기
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass px-6 py-10 text-center">
          <p className="text-sm text-white/60">{error}</p>
          <button onClick={() => setRetryKey((k) => k + 1)} className="btn-ghost mt-4">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-sm text-white/40">{heading.empty}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            {pageItems.map((battle) => (
              <BattleCard key={battle.battleId} battle={battle} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-white/50">
                <span className="font-semibold text-white">{safePage + 1}</span> / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
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
