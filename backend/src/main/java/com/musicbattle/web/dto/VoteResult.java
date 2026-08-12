package com.musicbattle.web.dto;

public record VoteResult(Long matchId, Long matchEntryId, Long voterMemberId, int score) {
}
