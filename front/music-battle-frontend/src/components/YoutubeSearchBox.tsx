import { useState } from 'react'
import { searchYoutube, type YoutubeSearchResult } from '../lib/youtubeSearch.ts'

// 유튜브 검색창 + 결과 리스트. 결과를 고르면 onSelect로 넘긴다.
// (실제 검색은 lib/youtubeSearch.ts, 키가 있을 때만 이 컴포넌트를 렌더한다.)
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

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    try {
      setResults(await searchYoutube(q))
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder="곡 제목 / 아티스트로 검색"
          className="glass-input py-2.5"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="btn-primary shrink-0 px-4 py-2.5"
        >
          {loading ? '검색 중…' : '검색'}
        </button>
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
                onClick={() => onSelect(r)}
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
