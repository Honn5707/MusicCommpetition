import { apiRequest } from './client.ts'
import type { BattleCommentResponse } from '../types/api.ts'

// 댓글 목록 조회.
// - afterTime 없음: 최근 30개(백엔드는 최신순으로 내려주므로 화면에서 오름차순 정렬해 쓴다)
// - afterTime 있음: 그 시각 이후의 댓글만(증분). 백엔드가 GreaterThanEqual(경계 포함)이라
//   경계 댓글이 중복으로 올 수 있어, 화면에서 id로 중복을 제거한다.
export function getComments(battleId: number, afterTime?: string) {
  const query = afterTime ? `?afterTime=${encodeURIComponent(afterTime)}` : ''
  return apiRequest<BattleCommentResponse[]>(`/api/battles/${battleId}/comments${query}`)
}

// 댓글 작성. 인증 필요(apiRequest가 토큰을 자동으로 실어 보낸다). 성공 시 본문 없음.
// 화면 갱신은 서버가 브로드캐스트하는 웹소켓 신호로 이뤄진다(전송자 본인도 그 신호로 갱신).
export function postComment(battleId: number, comment: string) {
  return apiRequest<void>(`/api/battles/${battleId}/comments`, {
    method: 'POST',
    body: { comment },
  })
}
