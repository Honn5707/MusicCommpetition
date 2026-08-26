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

// ⚠️ 백엔드 주의: followerList/followingList 는 경로의 {memberId}를 무시하고
// 로그인한 사용자(JWT) 기준으로 조회한다. 즉 "내 팔로워 / 내 팔로잉"만 볼 수 있고 인증이 필요하다.
// (경로 세그먼트는 라우팅용으로만 필요 — 로그인한 memberId를 넣어 호출한다.)
export function getFollowers(memberId: number, page: number, size: number) {
  return apiRequest<PageResponse<FollowUserResponse>>(
    `/api/members/${memberId}/followerList?page=${page}&size=${size}`,
  )
}

export function getFollowing(memberId: number, page: number, size: number) {
  return apiRequest<PageResponse<FollowUserResponse>>(
    `/api/members/${memberId}/followingList?page=${page}&size=${size}`,
  )
}
