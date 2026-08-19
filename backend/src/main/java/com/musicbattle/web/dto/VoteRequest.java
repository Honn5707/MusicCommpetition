package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotNull;

/**
 * voterMemberId 는 null 허용 (비로그인 투표).
 * fingerprintId 는 프론트 LocalStorage 1차 방어벽을 통과한 요청에만 실려온다는 전제.
 * ip는 컨트롤러에서 요청(HttpServletRequest)으로부터 직접 추출하고 여기엔 담지 않는다
 * (클라이언트가 IP를 자기 마음대로 써서 보낼 수 없게 - 스푸핑 방지).
 */
public record VoteRequest(
        @NotNull Long matchEntryId,
        boolean useExtraVote
) {
}
