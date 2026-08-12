package com.musicbattle.web.dto;

import com.musicbattle.domain.enums.MatchStatus;

public record BattleDetailResponse(
        String title,
        Long matchId,
        MatchStatus matchStatus,
        String hostVideoId,
        String hostSongTitle,
        String challengerVideoId,
        String challengerSongTitle,
        int hostScore,
        int challengerScore,
        String winner,
        Long hostEntryId,
        Long challengerEntryId,
        // 프론트에서 "내가 호스트/도전자인지" 판별해 삭제·항복 버튼을 보여줄지 결정하는 용도.
        // 순전히 UX용이며, 실제 권한 검사는 서버가 @AuthenticationPrincipal로 수행한다.
        Long hostMemberId,
        Long challengerMemberId,
        // 화면에 "호스트/도전자" 대신 실제 참가자 닉네임을 표시하기 위한 값.
        String hostNickname,
        String challengerNickname
) {}
