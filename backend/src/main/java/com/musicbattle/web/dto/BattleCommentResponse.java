package com.musicbattle.web.dto;

import java.time.LocalDateTime;

public record BattleCommentResponse(
        Long id,
        String comment,
        String nickname,
        LocalDateTime sendTime
) {}
