package com.musicbattle.web.dto;

import java.time.LocalDateTime;

public record BattleCreateResult(
        Long battleId,
        String title,
        LocalDateTime createdAt
){}
