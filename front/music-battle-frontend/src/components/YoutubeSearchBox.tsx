import { useEffect, useRef, useState } from 'react'
import { searchYoutube, type YoutubeSearchResult } from '../lib/youtubeSearch.ts'

// 유튜브 검색창 + 결과 리스트. 검색 버튼 없이 '입력하는 대로' 자동 검색해 밑에 목록으로 보여준다.
// 결과를 고르면 onSelect로 넘긴다. (실제 검색은 lib/youtubeSearch.ts, 키가 있을 때만 렌더한다.)
export default function YoutubeSearchBox({
  onSelect,
}: {
  onSelect: (result: YoutubeSearchResult) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YoutubeSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  // 결과를 선택하면 query를 곡 제목으로 채우는데, 이때 다시 검색이 돌지 않도록 한 번 건너뛴다.
  const skipNextRef = useRef(false)

  // 입력이 멈춘 뒤(디바운스 350ms) 자동 검색한다. 매 타이핑마다 요청하면 API 쿼터가 금방 소진되므로.
  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false
      return
    }

    const q = query.trim()
    if (!q) {
      setResults([])
      setSearched(false)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      searchYoutube(q)
        .then((r) => {
          if (cancelled) return
          setResults(r)
          setSearched(true)
          setError(null)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : '검색에 실패했습니다.')
          setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  function handlePick(r: YoutubeSearchResult) {
    skipNextRef.current = true
    setQuery(r.title)
    setResults([])
    setSearched(false)
    setLoading(false)
    onSelect(r)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="곡 제목 / 아티스트를 입력하세요"
          className="glass-input py-2.5 pr-16"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
            검색 중…
          </span>
        )}
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {searched && !loading && !error && results.length === 0 && (
        <p className="text-sm text-white/40">검색 결과가 없습니다. 다른 키워드로 시도해보세요.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {results.map((r) => (
            <li key={r.videoId}>
              <button
                type="button"
                onClick={() => handlePick(r)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition-colors hover:border-indigo-400/50 hover:bg-white/[0.06]"
              >
                <img
                  src={r.thumbnailUrl}
                  alt=""
                  className="h-12 w-20 shrink-0 rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{r.title}</p>
                  <p className="truncate text-xs text-white/45">{r.channelTitle}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
