import type { ApiErrorBody, RefreshResponse } from '../types/api.ts'
import { clearAuth, getRefreshToken, getToken, saveTokens } from '../auth/token.ts'

// 백엔드가 GlobalExceptionHandler에서 항상 { "error": "..." } 형식으로
// 에러를 내려주기로 약속했으니, 프론트도 그 형식을 신뢰하고 파싱한다.
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

// 진행 중인 재발급 요청. 여러 요청이 동시에 401을 받아도 refresh는 한 번만 호출되도록,
// 첫 요청이 만든 Promise를 나머지가 함께 기다렸다가 새 토큰을 재사용한다.
let refreshPromise: Promise<string> | null = null

// refreshToken 으로 새 액세스 토큰을 발급받는다(single-flight).
// 성공 시 새 토큰들을 저장하고 accessToken을 반환. 실패 시 로그아웃 처리 후 throw.
function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new ApiError(401, '로그인이 필요합니다.')

    // apiRequest 를 쓰면 재귀(401→refresh→401…)에 빠지므로 여기서는 raw fetch 를 쓴다.
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      // 리프레시 토큰마저 만료/폐기됨 → 세션 종료.
      const body = (await res.json().catch(() => null)) as ApiErrorBody | null
      throw new ApiError(res.status, body?.error ?? '세션이 만료되었습니다. 다시 로그인해주세요.')
    }

    const data = (await res.json()) as RefreshResponse
    saveTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  })()

  // 성공/실패와 무관하게 다음 401을 위해 in-flight 표식을 비운다.
  refreshPromise.finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

// baseURL을 안 붙이는 이유: vite.config.ts의 proxy 설정 덕분에
// '/api/...' 로 그냥 요청하면 Vite 개발 서버가 백엔드(8080)로 대신 전달해준다.
async function doFetch(path: string, options: RequestOptions, token: string | null) {
  // 인증이 필요한 API는 저장된 JWT를 Authorization 헤더에 자동으로 실어 보낸다.
  // 토큰이 없으면 헤더를 붙이지 않고, 백엔드가 익명으로 처리할지 401을 낼지 결정한다.
  const headers: Record<string, string> = {}
  if (options.body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

async function parse<TResponse>(response: Response): Promise<TResponse> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(response.status, body?.error ?? '알 수 없는 오류가 발생했습니다.')
  }
  // 본문이 비어있는 응답(204 No Content, 그리고 삭제/항복처럼 200 + 빈 본문)은
  // json() 파싱이 실패하므로, 먼저 텍스트로 읽고 비어있으면 undefined를 돌려준다.
  const text = await response.text()
  if (!text) return undefined as TResponse
  return JSON.parse(text) as TResponse
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const token = getToken()
  const response = await doFetch(path, options, token)

  // 401(액세스 토큰 만료)이고, 리프레시 토큰이 있으며, auth 엔드포인트가 아닐 때만
  // 자동 재발급 후 원래 요청을 한 번 더 시도한다. (login/refresh 자체는 대상 아님)
  const isAuthEndpoint = path.startsWith('/api/auth/')
  if (response.status === 401 && !isAuthEndpoint && getRefreshToken()) {
    try {
      const newToken = await refreshAccessToken()
      const retried = await doFetch(path, options, newToken)
      return parse<TResponse>(retried)
    } catch (err) {
      // 재발급 실패 → 세션 종료: 토큰 정리 후 로그인 페이지로 이동.
      clearAuth()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
      throw err instanceof ApiError ? err : new ApiError(401, '세션이 만료되었습니다.')
    }
  }

  return parse<TResponse>(response)
}
