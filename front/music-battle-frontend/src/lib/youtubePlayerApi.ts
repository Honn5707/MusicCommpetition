// YouTube IFrame Player API 스크립트를 한 번만 로드하고, 로드가 끝나면 window.YT를 리턴한다.
// getDuration()을 쓰려면 이 API가 필요함 (oEmbed는 재생시간을 안 준다).
let apiPromise: Promise<typeof YT> | null = null

export function loadYoutubeIframeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      resolve(window.YT as typeof YT)
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })

  return apiPromise
}
