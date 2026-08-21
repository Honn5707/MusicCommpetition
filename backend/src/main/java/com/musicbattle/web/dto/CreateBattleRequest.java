package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateBattleRequest(
        @NotBlank String title,
        @NotBlank String videoId,
        @NotBlank String songTitle,
        String channelTitle,
        String thumbnailUrl,
        @NotNull Integer durationSec,
        @NotNull Integer voteDurationSec
        ) {}

