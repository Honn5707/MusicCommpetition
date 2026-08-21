package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotNull;

public record BattleCommentRequest(@NotNull Long battleId, @NotNull Long memberId, @NotNull String comment) {
}
