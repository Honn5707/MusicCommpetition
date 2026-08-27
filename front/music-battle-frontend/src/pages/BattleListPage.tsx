import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { getBattleList } from '../api/battles.ts'
import { ApiError } from '../api/client.ts'
import { BattleCard } from '../components/BattleCard.tsx'
import type { BattleSummaryResponse, MatchStatus } from '../types/api.ts'

// 상태별 페이지 필터. (완료 탭은 집계중까지 포함해 투표가 끝난 배틀을 모은다)
export type BattleFilter = 'VOTING' | 'RECRUITING' | 'FINISHED'

// 검색 대상: 방 제목 / 닉네임(호스트·도전자).
type SearchBy = 'title' | 'nickname'
const SEARCH_LABELS: Record<SearchBy, string> = { title: '방제목', nickname: '닉네임' }

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
    title: '투표중인 노래대결',
    subtitle: '두 곡을 듣고 더 마음에 드는 쪽에 한 표를 던지세요.',
    empty: '지금 투표중인 노래대결이 없습니다.',
  },
  RECRUITING: {
    title: '모집중인 노래대결',
    subtitle: '도전자를 기다리는 중이에요. 내 곡으로 참가해보세요.',
    empty: '모집중인 노래대결이 없습니다.',
  },
  FINISHED: {
    title: '완료된 노래대결',
    subtitle: '지난 대결의 결과를 확인하세요.',
    empty: '완료된 노래대결이 없습니다.',
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
  // 검색어 + 검색 대상(방제목/닉네임).
  const [query, setQuery] = useState('')
  const [searchBy, setSearchBy] = useState<SearchBy>('title')
  // 검색 대상 커스텀 드롭다운 열림 상태.
  const [typeOpen, setTypeOpen] = useState(false)
  const typeRef = useRef<HTMLDivElement>(null)

  // 탭(필터)·검색어·검색 대상이 바뀌면 페이지를 처음으로 되돌린다.
  useEffect(() => {
    setPage(0)
  }, [filter, query, searchBy])

  // 드롭다운 바깥 클릭 / ESC 로 닫기.
  useEffect(() => {
    if (!typeOpen) return
    const onDown = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTypeOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [typeOpen])

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
        setError(err instanceof ApiError ? err.message : '노래대결 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [retryKey])

  const filtered = useMemo(() => {
    // 1) 상태 필터
    const base = (all ?? []).filter((b) => matchesFilter(b.matchStatus, filter))
    // 2) 검색 — 선택한 대상(방제목/닉네임)에서만 매칭
    const q = query.trim().toLowerCase()
    const searched = q
      ? base.filter((b) =>
          searchBy === 'nickname'
            ? b.hostNickname.toLowerCase().includes(q) ||
              (b.challengerNickname ?? '').toLowerCase().includes(q)
            : b.title.toLowerCase().includes(q),
        )
      : base
    // 3) 정렬 — 완료: 최근 종료순(voteEndsTime), 그 외: 최근 시작순(createdAt).
    //    시각이 없으면 battleId가 큰(=최근) 순으로 폴백.
    const timeKey = (b: BattleSummaryResponse) =>
      filter === 'FINISHED' ? b.voteEndsTime : b.createdAt
    return [...searched].sort((a, b) => {
      const ta = timeKey(a) ? Date.parse(timeKey(a) as string) : NaN
      const tb = timeKey(b) ? Date.parse(timeKey(b) as string) : NaN
      if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return tb - ta
      return b.battleId - a.battleId
    })
  }, [all, filter, query, searchBy])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const heading = HEADINGS[filter]

  return (
    <div className="mx-auto max-w-none px-[2%] py-8">
      {/* 상태별 필터 — 투표중/모집중은 크게, 완료된 대결은 작게 */}
      <div className="mb-6 flex items-stretch gap-2.5">
        {TABS.filter((t) => t.key !== 'FINISHED').map((tab) => (
          // 활성 시: 헤더 보더라인과 동일한 그라데이션 테두리(채움 없음).
          // 라운드-풀이라 얇은 패딩(그라데이션) + 안쪽 배경(바디색) 트릭으로 테두리를 만든다.
          <NavLink key={tab.key} to={tab.to} end className="flex-1">
            {({ isActive }) => (
              <span
                className={`block rounded-full p-[2px] shadow-[0_6px_16px_-8px_rgba(59,130,246,0.35)] transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500 via-sky-400 to-blue-600 shadow-[0_8px_22px_-8px_rgba(59,130,246,0.55)]'
                    : 'bg-gray-200 hover:bg-gradient-to-r hover:from-brand-500 hover:via-sky-400 hover:to-blue-600 hover:shadow-[0_8px_22px_-8px_rgba(59,130,246,0.45)]'
                }`}
              >
                <span
                  className={`block rounded-full px-5 py-2.5 text-center text-base transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-blue-50 font-extrabold text-gray-900'
                      : 'bg-[#f5f6f4] font-bold text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </span>
              </span>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/finished"
          end
          className={({ isActive }) =>
            `rounded-full border-2 px-4 py-3 text-center text-sm transition-all ${
              isActive
                ? 'border-gray-800 bg-white font-bold text-gray-900'
                : 'border-gray-200 bg-white font-semibold text-gray-400 hover:border-gray-300 hover:text-gray-700'
            }`
          }
        >
          완료된 대결
        </NavLink>
      </div>

      {/* 제목 · 검색 · 노래대결 만들기 — 한 줄 */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <h2 className="shrink-0 text-2xl font-bold tracking-tight text-gray-500">
          {heading.title}
          {query && (
            <span className="ml-2 align-middle text-sm font-semibold text-gray-400">
              검색 {filtered.length}건
            </span>
          )}
        </h2>

        {/* 검색 대상(커스텀 드롭다운) + 입력 */}
        <div className="flex flex-1 items-center gap-2">
          <div ref={typeRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setTypeOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={typeOpen}
              className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
            >
              {SEARCH_LABELS[searchBy]}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {typeOpen && (
              <ul
                role="listbox"
                className="absolute left-0 top-full z-20 mt-2 w-32 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
              >
                {(['title', 'nickname'] as SearchBy[]).map((k) => (
                  <li key={k} role="option" aria-selected={searchBy === k}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchBy(k)
                        setTypeOpen(false)
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                        searchBy === k ? 'font-bold text-brand-700' : 'text-gray-600'
                      }`}
                    >
                      {SEARCH_LABELS[k]}
                      {searchBy === k && <span className="text-brand-600">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchBy === 'title' ? '방 제목으로 검색' : '닉네임으로 검색'}
              aria-label="배틀 검색"
              className="glass-input rounded-full pl-11 pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <Link to="/battles/new" className="btn-primary shrink-0">
          + 노래대결 만들기
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="glass px-6 py-10 text-center">
          <p className="text-sm text-gray-500">{error}</p>
          <button onClick={() => setRetryKey((k) => k + 1)} className="btn-ghost mt-4">
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
          <p className="text-sm text-gray-400">
            {query ? `'${query}'에 해당하는 노래대결이 없어요.` : heading.empty}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{safePage + 1}</span> / {totalPages}
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
