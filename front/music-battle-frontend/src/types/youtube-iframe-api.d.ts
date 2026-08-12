// YouTube IFrame Player API의 최소 타입 선언.
// @types/youtube 패키지를 안 쓰는 이유: 우리가 쓰는 건 Player 생성 + getDuration() 뿐이라 과함.
export {}

declare global {
  interface Window {
    YT?: typeof YT
    onYouTubeIframeAPIReady?: () => void
  }

  namespace YT {
    class Player {
      constructor(element: string | HTMLElement, options: PlayerOptions)
      getDuration(): number
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
      }
    }
  }
}
