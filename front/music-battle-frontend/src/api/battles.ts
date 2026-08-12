import { apiRequest } from './client.ts'
import type {
  BattleCreateResult,
  BattleDetailResponse,
  BattleSummaryResponse,
  ChallengeRequest,
  CreateBattleRequest,
  PageResponse,
} from '../types/api.ts'

export function createBattle(request: CreateBattleRequest) {
  return apiRequest<BattleCreateResult>('/api/battles', {
    method: 'POST',
    body: request,
  })
}

export function getBattleList(page: number, size: number) {
  return apiRequest<PageResponse<BattleSummaryResponse>>(
    `/api/battles?page=${page}&size=${size}`,
  )
}

export function joinAsChallenger(battleId: number, request: ChallengeRequest) {
  return apiRequest<void>(`/api/battles/${battleId}/challenge`, {
    method: 'POST',
    body: request,
  })
}

export function getBattleDetail(battleId: number) {
  return apiRequest<BattleDetailResponse>(`/api/battles/${battleId}`)
}

// 듣기평가 삭제: 호스트 본인 + 도전자 없음 + 모집중(RECRUITING) 상태에서만 백엔드가 허용한다.
// 그 외 조건은 백엔드가 예외(ApiError)로 막으므로 프론트는 결과만 처리한다.
export function deleteBattle(battleId: number) {
  return apiRequest<void>(`/api/battles/${battleId}`, {
    method: 'DELETE',
  })
}

// 항복: 참가자 본인 + 투표중(VOTING) 상태에서만 가능. 상대에게 승리가 부여된다.
export function surrenderBattle(battleId: number) {
  return apiRequest<void>(`/api/battles/${battleId}/surrender`, {
    method: 'POST',
  })
}
