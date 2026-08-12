import { useEffect, useRef, useState } from 'react'
import { loadYoutubeIframeApi } from '../lib/youtubePlayerApi.ts'

interface Props {
  videoId: string
  onDuration: (durationSec: number) => void
}

// 실제 YouTube 플레이어를 붙여서 미리듣기 + 재생시간 자동 감지를 동시에 처리한다.
// 사용자가 분/초를 직접 입력하지 않고, 영상의 실제 길이를 그대로 쓴다.
export default function YoutubeDurationPreview({ videoId, onDuration }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const onDurationRef = useRef(onDuration)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    onDurationRef.current = onDuration
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
      <div className="aspect-video w-full bg-black/40" ref={containerRef} />
      <div className="px-3 py-2 text-xs text-white/50">
        {status === 'loading' && '재생 시간 확인 중…'}
        {status === 'error' && (
          <span className="text-rose-300">영상 재생 시간을 가져오지 못했습니다. 링크를 확인해주세요.</span>
        )}
        {status === 'ready' && '재생 시간을 자동으로 반영했습니다.'}
      </div>
    </div>
  )
}
