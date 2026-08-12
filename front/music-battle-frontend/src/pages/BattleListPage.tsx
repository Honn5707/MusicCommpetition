import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBattleList } from '../api/battles.ts'
import { ApiError } from '../api/client.ts'
import { BattleCard } from '../components/BattleCard.tsx'
import type { BattleSummaryResponse, PageResponse } from '../types/api.ts'

const PAGE_SIZE = 6

export default function BattleListPage() {
  const [page, setPage] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const [data, setData] = useState<PageResponse<BattleSummaryResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getBattleList(page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) setData(result)
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
  }, [page, retryKey])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">오늘의 듣기평가</h1>
          <p className="mt-1.5 text-sm text-white/50">두 곡을 듣고 더 마음에 드는 쪽에 한 표를 던지세요.</p>
        </div>
        <Link to="/battles/new" className="btn-primary">
          + 듣기평가 만들기
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

      {!loading && !error && data && data.content.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 py-16 text-center">
          <p className="text-sm text-white/40">아직 등록된 듣기평가가 없습니다.</p>
        </div>
      )}

      {!loading && !error && data && data.content.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.content.map((battle) => (
              <BattleCard key={battle.battleId} battle={battle} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost disabled:cursor-not-allowed disabled:opacity-30"
            >
              이전
            </button>
            <span className="text-sm text-white/50">
              <span className="font-semibold text-white">{data.page + 1}</span> /{' '}
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
        </>
      )}
    </div>
  )
}
