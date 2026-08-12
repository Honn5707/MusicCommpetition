// 백엔드에 YouTube 검색 API가 아직 없어서, 사용자가 붙여넣은 URL에서
// videoId만 뽑아내고 썸네일은 규칙적인 URL로 직접 만든다.
// (곡 제목/재생시간 등 나머지 메타데이터는 폼에서 직접 입력받는다.)

// 지원 형식:
//  - https://www.youtube.com/watch?v=VIDEOID
//  - https://youtu.be/VIDEOID
//  - https://www.youtube.com/shorts/VIDEOID
//  - VIDEOID (11자리 원본)
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // 이미 videoId만 넣은 경우
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const url = new URL(trimmed)
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1)
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
    }
    if (url.hostname.endsWith('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      // /shorts/VIDEOID, /embed/VIDEOID 형태
      const match = url.pathname.match(/\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})/)
      if (match) return match[1]
    }
  } catch {
    return null
  }
  return null
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
