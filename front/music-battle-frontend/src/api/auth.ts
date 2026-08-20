import { apiRequest } from './client.ts'
import type {
  LoginRequest,
  LoginResponse,
  OauthRegisterRequest,
  OauthResponse,
} from '../types/api.ts'

export function login(request: LoginRequest) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: request,
  })
}

// 소셜 로그인 콜백: 프론트 콜백 페이지가 구글에서 받은 code를 백엔드에 넘겨 처리한다.
// 응답으로 기존 회원이면 토큰(loginResponse), 신규면 tempToken을 받는다.
export function oauthCallback(provider: string, code: string) {
  return apiRequest<OauthResponse>(
    `/api/auth/${provider}/callback?code=${encodeURIComponent(code)}`,
  )
}

// 소셜 신규 회원 닉네임 확정. 성공 시 로그인 토큰을 받는다.
// (백엔드 실제 경로는 /api/auth/oauth-register)
export function oauthRegister(request: OauthRegisterRequest) {
  return apiRequest<LoginResponse>('/api/auth/oauth-register', {
    method: 'POST',
    body: request,
  })
}
