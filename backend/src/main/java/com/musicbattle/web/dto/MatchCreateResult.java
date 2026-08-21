package com.musicbattle.web.dto;

import java.time.LocalDateTime;

public record MatchCreateResult(LocalDateTime voteEndsAt) {
}
