import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createBattle } from '../api/battles.ts'
import { ApiError } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import YoutubeDurationPreview from '../components/YoutubeDurationPreview.tsx'
import YoutubeSearchBox from '../components/YoutubeSearchBox.tsx'
import { parseYoutubeVideoId, youtubeThumbnailUrl } from '../lib/youtube.ts'
import { hasYoutubeSearch, type YoutubeSearchResult } from '../lib/youtubeSearch.ts'

export default function CreateBattlePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [channelTitle, setChannelTitle] = useState('')
  const [durationSec, setDurationSec] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 키가 있으면 '검색' 탭을 기본으로, 없으면 링크 붙여넣기만 노출.
  const searchEnabled = hasYoutubeSearch()
  const [source, setSource] = useState<'search' | 'link'>(searchEnabled ? 'search' : 'link')

  const videoId = parseYoutubeVideoId(videoUrl)

  // 검색 결과 선택 시: videoId를 URL 형태로 넣어 기존 파싱/재생시간 로직을 그대로 태우고,
  // 곡 제목/채널명을 미리 채워준다(사용자가 이어서 수정 가능).
  function handlePickFromSearch(r: YoutubeSearchResult) {
    setVideoUrl(`https://youtu.be/${r.videoId}`)
    setSongTitle(r.title)
    setChannelTitle(r.channelTitle)
  }

  // 링크가 바뀌면 이전 영상의 재생시간을 그대로 들고 있으면 안 되니 초기화한다.
  useEffect(() => {
    setDurationSec(0)
  }, [videoId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      setError('듣기평가 제목을 입력해주세요.')
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
        channelTitle: channelTitle.trim() || undefined,
        thumbnailUrl: youtubeThumbnailUrl(videoId),
        durationSec,
      })
      navigate(`/battles/${result.battleId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '듣기평가 생성에 실패했습니다.')
      setSubmitting(false)
    }
  }

  // 로그인하지 않았으면 로그인 페이지로 안내한다 (듣기평가 생성은 JWT 필요).
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">로그인이 필요합니다</h1>
        <p className="mt-2 text-sm text-white/50">듣기평가를 만들려면 먼저 로그인해주세요.</p>
        <Link to="/login" state={{ from: '/battles/new' }} className="btn-primary mt-8 inline-block">
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">듣기평가 만들기</h1>
        <p className="mt-1.5 text-sm text-white/50">대표곡을 등록하면 듣기평가가 시작됩니다.</p>
      </div>

      <form onSubmit={handleCreate} className="glass space-y-6 p-6 sm:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">듣기평가 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 2000년대 발라드 최강곡은?"
            className="glass-input"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-white/80">곡 (YouTube)</label>
            {searchEnabled && (
              <div className="flex gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                <button
                  type="button"
                  onClick={() => setSource('search')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    source === 'search' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  검색
                </button>
                <button
                  type="button"
                  onClick={() => setSource('link')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    source === 'link' ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white'
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
            <p className="mt-1.5 text-xs text-rose-300">링크에서 영상 ID를 찾지 못했습니다.</p>
          )}
          {videoId && (
            <div className="mt-3">
              <YoutubeDurationPreview key={videoId} videoId={videoId} onDuration={setDurationSec} />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">곡 제목</label>
          <input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="곡 제목을 입력하세요"
            className="glass-input"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/80">
            채널명 <span className="font-normal text-white/30">(선택)</span>
          </label>
          <input
            value={channelTitle}
            onChange={(e) => setChannelTitle(e.target.value)}
            placeholder="아티스트/채널 이름"
            className="glass-input"
          />
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/')} className="btn-ghost">
            취소
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? '만드는 중…' : '듣기평가 만들기'}
          </button>
        </div>
      </form>
    </div>
  )
}
