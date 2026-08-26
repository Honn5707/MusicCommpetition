package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record BattleCommentResponse(
        Long id,
        String comment,
        String nickname,
        LocalDateTime sendTime
) {}
