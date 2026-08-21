package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record BattleCommentResponse(@NotNull Long battleId, @NotNull Long memberId, @NotNull String comment, @NotNull
                                    LocalDateTime sendTime) {
}
