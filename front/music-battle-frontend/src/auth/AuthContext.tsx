import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/auth.ts'
import { registerMember } from '../api/members.ts'
import { clearAuth, getMemberId, getToken, saveAuth } from './token.ts'

interface AuthContextValue {
  memberId: number | null
  isAuthenticated: boolean
  // providerId(아이디) + password 로 로그인. 성공 시 토큰을 저장하고 상태를 갱신한다.
  login: (providerId: string, password: string) => Promise<void>
  // 회원가입 후 곧바로 같은 자격증명으로 로그인까지 처리한다.
  // email 은 사전에 이메일 인증(code-send → code-confirm)을 마친 주소여야 한다.
  register: (providerId: string, password: string, nickname: string, email: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // 새로고침해도 로그인 상태가 유지되도록 앱 시작 시 localStorage에서 복원한다.
  const [memberId, setMemberId] = useState<number | null>(() => (getToken() ? getMemberId() : null))

  const login = useCallback(async (providerId: string, password: string) => {
    const res = await loginRequest({ providerId, password })
    saveAuth(res.token, res.refreshToken, res.memberId)
    setMemberId(res.memberId)
  }, [])

  const register = useCallback(
    async (providerId: string, password: string, nickname: string, email: string) => {
      await registerMember({ provider: 'LOCAL', providerId, password, nickname, email })
      // 가입 직후 자동 로그인해서 토큰을 확보한다.
      await login(providerId, password)
    },
    [login],
  )

  const logout = useCallback(() => {
    clearAuth()
    setMemberId(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ memberId, isAuthenticated: memberId !== null, login, register, logout }),
    [memberId, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
