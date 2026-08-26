package com.musicbattle.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BattleCommentRequest(@NotNull @Size(max=30) String comment) {
}
