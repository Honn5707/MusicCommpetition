import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createBattle } from '../api/battles.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import YoutubeDurationPreview from '../components/YoutubeDurationPreview.tsx'
import YoutubeSearchBox from '../components/YoutubeSearchBox.tsx'
import { parseYoutubeVideoId, youtubeThumbnailUrl } from '../lib/youtube.ts'
import { hasYoutubeSearch, type YoutubeSearchResult } from '../lib/youtubeSearch.ts'

// 투표 진행 시간 옵션(초 단위). 도전자가 참가하면 이 시간 동안 투표가 열린다.
const VOTE_DURATION_OPTIONS = [
  { label: '5분', sec: 5 * 60 },
  { label: '30분', sec: 30 * 60 },
  { label: '60분', sec: 60 * 60 },
  { label: '6시간', sec: 6 * 60 * 60 },
  { label: '12시간', sec: 12 * 60 * 60 },
  { label: '24시간', sec: 24 * 60 * 60 },
]

export default function CreateBattlePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [title, setTitle] = useState('')
  const [voteDurationSec, setVoteDurationSec] = useState(60 * 60) // 기본 60분
  const [videoUrl, setVideoUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  // 아티스트: 사용자가 직접 입력한 값(channelTitle)과, 곡 선택 시 자동 제안값(artistSuggestion)을 분리한다.
  // 자동 제안값은 입력칸의 placeholder로만 보여주고, 비워두면 제출 시 이 제안값을 사용한다.
  const [channelTitle, setChannelTitle] = useState('')
  const [artistSuggestion, setArtistSuggestion] = useState('')
  const [durationSec, setDurationSec] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 키가 있으면 '검색' 탭을 기본으로, 없으면 링크 붙여넣기만 노출.
  const searchEnabled = hasYoutubeSearch()
  const [source, setSource] = useState<'search' | 'link'>(searchEnabled ? 'search' : 'link')

  const videoId = parseYoutubeVideoId(videoUrl)

  // 검색 결과 선택 시: videoId를 URL 형태로 넣어 기존 파싱/재생시간 로직을 그대로 태우고,
  // 곡 제목은 채워주되 아티스트는 placeholder 제안값으로만 넣는다(값은 비워 둠).
  function handlePickFromSearch(r: YoutubeSearchResult) {
    setVideoUrl(`https://youtu.be/${r.videoId}`)
    setSongTitle(r.title)
    setArtistSuggestion(r.channelTitle)
  }

  // 링크가 바뀌면 이전 영상의 재생시간/아티스트 입력을 그대로 들고 있으면 안 되니 초기화한다.
  useEffect(() => {
    setDurationSec(0)
    setChannelTitle('')
  }, [videoId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setError('노래대결 제목을 입력해주세요.')
      return
    }
    if (!videoId) {
      setError('올바른 YouTube 링크를 입력해주세요.')
      return
    }
    if (!songTitle.trim()) {
      setError('곡 제목을 입력해주세요.')
      return
    }
    if (durationSec <= 0) {
      setError('영상 재생 시간을 아직 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      // hostMemberId는 보내지 않는다 — 백엔드가 JWT로 판별한다.
      const result = await createBattle({
        title: title.trim(),
        videoId,
        songTitle: songTitle.trim(),
        // 직접 입력값이 있으면 그것을, 없으면 자동 제안(아티스트)값을 사용한다.
        channelTitle: channelTitle.trim() || artistSuggestion.trim() || undefined,
        thumbnailUrl: youtubeThumbnailUrl(videoId),
        durationSec,
        voteDurationSec,
      })
      navigate(`/battles/${result.battleId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '노래대결 생성에 실패했습니다.')
      setSubmitting(false)
    }
  }

  // 로그인하지 않았으면 로그인 페이지로 안내한다 (노래대결 생성은 JWT 필요).
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">로그인이 필요합니다</h1>
        <p className="mt-2 text-sm text-gray-500">노래대결을 만들려면 먼저 로그인해주세요.</p>
        <Link to="/login" state={{ from: '/battles/new' }} className="btn-primary mt-8 inline-block">
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">노래대결 만들기</h1>
        <p className="mt-1.5 text-sm text-gray-500">대표곡을 등록하면 노래대결이 시작됩니다.</p>
      </div>

      <form onSubmit={handleCreate} className="glass space-y-6 p-6 sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">노래대결 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 2000년대 발라드 최강곡은?"
            className="glass-input"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">투표 시간</label>
          <div className="flex flex-wrap gap-2">
            {VOTE_DURATION_OPTIONS.map((o) => (
              <button
                key={o.sec}
                type="button"
                onClick={() => setVoteDurationSec(o.sec)}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  voteDurationSec === o.sec
                    ? 'border-gray-400 bg-gray-100 text-gray-900'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">도전자가 참가하면 이 시간 동안 투표가 진행됩니다.</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">곡 (YouTube)</label>
            {searchEnabled && (
              <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setSource('search')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    source === 'search' ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  검색
                </button>
                <button
                  type="button"
                  onClick={() => setSource('link')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    source === 'link' ? 'bg-brand-500 text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  링크
                </button>
              </div>
            )}
          </div>

          {searchEnabled && source === 'search' ? (
            <YoutubeSearchBox onSelect={handlePickFromSearch} />
          ) : (
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="glass-input"
            />
          )}
          {videoUrl && !videoId && source === 'link' && (
            <p className="mt-1.5 text-xs text-gray-600">링크에서 영상 ID를 찾지 못했습니다.</p>
          )}
          {videoId && (
            <div className="mt-3">
              <YoutubeDurationPreview
                key={videoId}
                videoId={videoId}
                onDuration={setDurationSec}
                onMeta={(m) => {
                  setSongTitle(m.title)
                  setArtistSuggestion(m.author)
                }}
              />
            </div>
          )}
        </div>

        {(songTitle || videoId) && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">곡 제목</label>
              <input
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="곡 제목"
                className="glass-input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">아티스트</label>
              <input
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                placeholder={artistSuggestion || '아티스트 (선택)'}
                className="glass-input"
              />
            </div>
            <p className="text-xs text-gray-400">
              곡을 선택하면 아티스트가 안내(placeholder)로 채워져요. 비워두면 그대로 사용되고, 직접 입력하면 그 값이 쓰여요.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-gray-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/')} className="btn-ghost">
            취소
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? '만드는 중…' : '노래대결 만들기'}
          </button>
        </div>
      </form>
    </div>
  )
}
