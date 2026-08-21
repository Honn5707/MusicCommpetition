package com.musicbattle.web.dto;

import com.musicbattle.domain.enums.MatchStatus;

import java.time.LocalDateTime;

public record BattleSummaryResponse(Long battleId,
                                    String title,
                                    String hostSongTitle,
                                    String challengerSongTitle,
                                    int hostScore,
                                    int challengerScore,
                                    MatchStatus matchStatus,
                                    // 목록/마이페이지에서 "호스트/도전자" 대신 닉네임을 표시하기 위한 값.
                                    String hostNickname,
                                    String challengerNickname,
                                    LocalDateTime voteEndsTime,
                                    LocalDateTime createdAt) {
}
