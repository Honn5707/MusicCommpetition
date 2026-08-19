import { apiRequest } from './client.ts'
import type { EmailCodeConfirmRequest, EmailCodeSendRequest } from '../types/api.ts'

// 인증코드 발송. 성공 시 200(본문 없음), 실패 시 409 { error: "..." }.
// 코드는 발급 후 10분간 유효하다(만료 관리는 백엔드).
export function sendEmailCode(request: EmailCodeSendRequest) {
  return apiRequest<void>('/api/email/code-send', {
    method: 'POST',
    body: request,
  })
}

// 인증코드 확인. 성공 시 200(본문 없음), 실패 시 409
// { error: "인증번호가 틀립니다..." } 또는 { error: "인증번호가 만료되었습니다." }.
export function confirmEmailCode(request: EmailCodeConfirmRequest) {
  return apiRequest<void>('/api/email/code-confirm', {
    method: 'POST',
    body: request,
  })
}
