import { useEffect, useRef, useState } from 'react'
import { loadYoutubeIframeApi } from '../lib/youtubePlayerApi.ts'

interface Props {
  videoId: string
  onDuration: (durationSec: number) => void
  // 곡 제목/채널명을 영상 자체에서 가져와 넘긴다 (사용자가 직접 입력하지 않음).
  onMeta?: (meta: { title: string; author: string }) => void
}

// 실제 YouTube 플레이어를 붙여서 미리듣기 + 재생시간/곡정보 자동 감지를 동시에 처리한다.
// 사용자가 분/초나 곡 제목을 직접 입력하지 않고, 영상의 실제 값을 그대로 쓴다.
export default function YoutubeDurationPreview({ videoId, onDuration, onMeta }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const onDurationRef = useRef(onDuration)
  const onMetaRef = useRef(onMeta)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    onDurationRef.current = onDuration
    onMetaRef.current = onMeta
  })

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    loadYoutubeIframeApi().then((YTApi) => {
      if (cancelled || !containerRef.current) return

      playerRef.current = new YTApi.Player(containerRef.current, {
        videoId,
        playerVars: { modestbranding: 1, rel: 0 },
        events: {
          onReady: (event) => {
            if (cancelled) return
            const data = event.target.getVideoData?.()
            if (data?.title) {
              onMetaRef.current?.({ title: data.title, author: data.author ?? '' })
            }
            const duration = Math.round(event.target.getDuration())
            if (duration > 0) {
              onDurationRef.current(duration)
              setStatus('ready')
            } else {
              setStatus('error')
            }
          },
          onError: () => {
            if (!cancelled) setStatus('error')
          },
        },
      })
    })

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <div className="aspect-video w-full bg-black/40" ref={containerRef} />
      <div className="px-3 py-2 text-xs text-gray-500">
        {status === 'loading' && '재생 시간 확인 중…'}
        {status === 'error' && (
          <span className="text-gray-600">영상 재생 시간을 가져오지 못했습니다. 링크를 확인해주세요.</span>
        )}
        {status === 'ready' && '재생 시간을 자동으로 반영했습니다.'}
      </div>
    </div>
  )
}
