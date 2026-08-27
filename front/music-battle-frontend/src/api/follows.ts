import { apiRequest } from './client.ts'
import type { FollowUserResponse, PageResponse } from '../types/api.ts'

// 팔로우. 인증 필요. 성공 시 본문 없음.
// 실패: 409 { error: "이미 팔로우 상태입니다!" } 또는 "자기 자신은 팔로우할 수 없습니다".
export function followMember(targetId: number) {
  return apiRequest<void>(`/api/members/${targetId}/follow`, { method: 'POST' })
}

// 언팔로우. 인증 필요. 실패: 409 { error: "팔로워를 찾을 수 없습니다" }.
export function unfollowMember(targetId: number) {
  return apiRequest<void>(`/api/members/${targetId}/follow`, { method: 'DELETE' })
}

// followerList/followingList 는 로그인한 사용자(JWT) 기준으로 "내 팔로워 / 내 팔로잉"만 조회한다(인증 필요).
export function getFollowers(page: number, size: number) {
  return apiRequest<PageResponse<FollowUserResponse>>(
    `/api/members/followerList?page=${page}&size=${size}`,
  )
}

export function getFollowing(page: number, size: number) {
  return apiRequest<PageResponse<FollowUserResponse>>(
    `/api/members/followingList?page=${page}&size=${size}`,
  )
}
