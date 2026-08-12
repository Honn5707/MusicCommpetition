import { apiRequest } from './client.ts'
import type { VoteRequest, VoteResult } from '../types/api.ts'

export function vote(matchId: number, request: VoteRequest) {
  return apiRequest<VoteResult>(`/api/matches/${matchId}/votes`, {
    method: 'POST',
    body: request,
  })
}
