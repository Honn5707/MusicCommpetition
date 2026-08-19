import { useEffect, useRef, useState } from 'react'
import { loadYoutubeIframeApi } from '../lib/youtubePlayerApi.ts'

interface Props {
  videoId: string
  title: string
}

// 동시에 한 곡만 재생되도록 조율하는 모듈 레벨 레지스트리.
// 한 플레이어가 재생을 시작하면 나머지는 스스로 일시정지한다.
type Pausable = { pause: () => void }
const activePlayers = new Set<Pausable>()

function pauseOthers(except: Pausable) {
  activePlayers.forEach((p) => {
    if (p !== except) p.pause()
  })
}

// 배틀중인 곡 플레이어.
// - 마우스를 올리면 재생. 벗어나도 계속 재생된다.
// - 상대 플레이어에 마우스를 올리면 그쪽이 재생되면서 이쪽은 자동으로 멈춘다(동시 재생 방지).
// - 영상을 클릭하면 재생/일시정지 토글.
// 컨트롤/사운드 오버레이 없이 화면을 깔끔하게 보여준다.
export default function BattleVideoPlayer({ videoId, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const [ready, setReady] = useState(false)
  const [volume, setVolume] = useState(100)

  useEffect(() => {
    let cancelled = false
    // 다른 플레이어가 재생을 시작했을 때 나를 멈추기 위한 핸들.
    const self: Pausable = { pause: () => playerRef.current?.pauseVideo() }
    activePlayers.add(self)

    loadYoutubeIframeApi().then((YTApi) => {
      if (cancelled || !containerRef.current) return

      playerRef.current = new YTApi.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0, // 기본 컨트롤(재생/정지/사운드) 숨김 — 깔끔한 화면
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          disablekb: 1,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return
            event.target.setVolume(volume) // 초기 음량 반영
            setReady(true)
          },
          onStateChange: (event) => {
            if (cancelled) return
            // 내가 재생을 시작하면 다른 플레이어들을 멈춘다(동시 재생 방지).
            if (event.data === YTApi.PlayerState.PLAYING) pauseOthers(self)
          },
        },
      })
    })

    return () => {
      cancelled = true
      activePlayers.delete(self)
      playerRef.current?.destroy()
      playerRef.current = null
    }
    // videoId가 바뀌면 플레이어를 새로 만든다. volume은 onReady 초기값으로만 쓰므로 deps에서 제외.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // 마우스를 올리면 재생. 벗어나도 멈추지 않는다(계속 재생).
  // ※ 브라우저 자동재생 정책상 사운드가 있는 첫 재생은 차단될 수 있는데,
  //   그 경우 영상을 한 번 클릭하면(사용자 제스처) 소리와 함께 재생된다.
  function handleMouseEnter() {
    playerRef.current?.playVideo()
  }

  // 클릭 시 재생/일시정지 토글
  function handleToggle() {
    const player = playerRef.current
    if (!player) return
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
  }

  // 음량만 조절한다(음소거 아이콘 없이 슬라이더만). 0으로 내리면 사실상 무음.
  function handleVolumeChange(next: number) {
    setVolume(next)
    playerRef.current?.setVolume(next)
  }

  return (
    <div
      className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-black/40"
      onMouseEnter={handleMouseEnter}
      onClick={handleToggle}
      role="button"
      aria-label={`${title} 재생/일시정지`}
    >
      {/* 플레이어. 클릭/호버는 위 래퍼가 처리하므로 iframe 자체 포인터 이벤트는 막는다. */}
      <div className="pointer-events-none h-full w-full" ref={containerRef} />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
          불러오는 중…
        </div>
      )}

      {/* 음량 슬라이더(아이콘 없음). 호버 시 우하단에 나타나며, 여기 조작은 재생 토글로 전파되지 않게 막는다. */}
      {ready && (
        <div
          className="absolute bottom-2 right-2 flex items-center rounded-full bg-black/55 px-3 py-1.5 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            aria-label="음량"
            className="h-1 w-24 cursor-pointer accent-indigo-300"
          />
        </div>
      )}
    </div>
  )
}
