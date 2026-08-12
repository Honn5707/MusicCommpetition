// YouTube Data API v3 검색. VITE_YOUTUBE_API_KEY 가 설정돼 있을 때만 동작한다.
// 키가 없으면 hasYoutubeSearch()가 false를 돌려주고, 폼은 기존 '링크 붙여넣기'로 폴백한다.

export interface YoutubeSearchResult {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
}

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined

export function hasYoutubeSearch(): boolean {
  return !!API_KEY
}

// YouTube가 내려주는 제목은 HTML 이스케이프(&amp;, &#39; 등)되어 있어 사람이 읽기 좋게 되돌린다.
function decodeHtml(text: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

export async function searchYoutube(query: string): Promise<YoutubeSearchResult[]> {
  if (!API_KEY) throw new Error('YouTube 검색이 설정되어 있지 않습니다.')

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '8')
  url.searchParams.set('q', query)
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) {
    // 쿼터 초과/키 오류 등. 사용자에겐 링크 붙여넣기로 안내한다.
    throw new Error('유튜브 검색에 실패했습니다. 잠시 후 다시 시도하거나 링크를 직접 붙여넣어 주세요.')
  }

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string }
      snippet?: {
        title?: string
        channelTitle?: string
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } }
      }
    }>
  }

  return (data.items ?? [])
    .filter((it) => it.id?.videoId)
    .map((it) => ({
      videoId: it.id!.videoId!,
      title: decodeHtml(it.snippet?.title ?? ''),
      channelTitle: it.snippet?.channelTitle ?? '',
      thumbnailUrl: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url ?? '',
    }))
}
