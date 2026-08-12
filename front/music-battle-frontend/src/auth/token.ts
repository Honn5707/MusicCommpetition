// JWT 액세스/리프레시 토큰과 로그인 memberId를 localStorage에 보관하는 얇은 계층.
// React 밖(api/client.ts)에서도 토큰을 읽어야 해서, Context가 아니라
// 프레임워크 독립적인 모듈로 분리했다. AuthContext와 client.ts가 함께 사용한다.

const TOKEN_KEY = 'music-battle:token'
const REFRESH_KEY = 'music-battle:refresh-token'
const MEMBER_KEY = 'music-battle:member-id'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function getMemberId(): number | null {
  const raw = localStorage.getItem(MEMBER_KEY)
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

// 로그인 성공 시: 액세스/리프레시 토큰 + memberId 를 모두 저장한다.
export function saveAuth(token: string, refreshToken: string, memberId: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_KEY, refreshToken)
  localStorage.setItem(MEMBER_KEY, String(memberId))
}

// 토큰 재발급(rotation) 시: 액세스/리프레시 토큰만 새 값으로 교체한다(memberId 유지).
// 서버가 기존 refreshToken을 폐기하므로 반드시 새 값으로 덮어써야 한다.
export function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(MEMBER_KEY)
}
