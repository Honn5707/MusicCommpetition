import { apiRequest } from './client.ts'
import type {
  DeleteAccountRequest,
  MemberPageResponse,
  MemberProfileResponse,
  MemberRegisterRequest,
  MemberRegisterResult,
} from '../types/api.ts'

// 회원 프로필 조회(공개). 로그인 시 isFollowing 판별을 위해 토큰이 자동 첨부된다.
export function getMemberProfile(targetId: number) {
  return apiRequest<MemberProfileResponse>(`/api/members/${targetId}/profile`)
}

export function registerMember(request: MemberRegisterRequest) {
  return apiRequest<MemberRegisterResult>('/api/members/register', {
    method: 'POST',
    body: request,
  })
}

// 마이페이지: 인증 필요(백엔드가 JWT로 본인 판별). page/size는 종료된 노래대결 목록 페이지네이션용.
export function getMyPage(page: number, size: number) {
  return apiRequest<MemberPageResponse>(`/api/members/mypage?page=${page}&size=${size}`)
}

// 회원탈퇴: 인증 필요. LOCAL 계정은 비밀번호 확인 필요(틀리거나 OAuth 계정이면 409).
export function deleteAccount(request: DeleteAccountRequest) {
  return apiRequest<void>('/api/members/delete-account', {
    method: 'DELETE',
    body: request,
  })
}
