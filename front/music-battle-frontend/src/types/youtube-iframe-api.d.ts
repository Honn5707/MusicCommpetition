// YouTube IFrame Player API의 최소 타입 선언.
// @types/youtube 패키지를 안 쓰는 이유: 우리가 쓰는 건 Player 생성 + 재생 제어 정도라 과함.
export {}

declare global {
  interface Window {
    YT?: typeof YT
    onYouTubeIframeAPIReady?: () => void
  }

  namespace YT {
    // 플레이어 상태 상수 (onStateChange 이벤트의 event.data 값과 비교용)
    const PlayerState: {
      UNSTARTED: number
      ENDED: number
      PLAYING: number
      PAUSED: number
      BUFFERING: number
      CUED: number
    }

    class Player {
      constructor(element: string | HTMLElement, options: PlayerOptions)
      getDuration(): number
      // 곡 제목/채널명을 영상 자체에서 가져온다 (사용자 입력 대신 사용).
      getVideoData(): { video_id: string; title: string; author: string }
      playVideo(): void
      pauseVideo(): void
      mute(): void
      unMute(): void
      isMuted(): boolean
      setVolume(volume: number): void
      getVolume(): number
      getPlayerState(): number
      destroy(): void
    }

    interface PlayerEvent {
      target: Player
      data: number
    }

    interface PlayerOptions {
      videoId?: string
      width?: string | number
      height?: string | number
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (event: PlayerEvent) => void
        onError?: (event: PlayerEvent) => void
        onStateChange?: (event: PlayerEvent) => void
      }
    }
  }
}
