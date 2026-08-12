package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChallengeRequest(
        @NotBlank String videoId,
        @NotBlank String songTitle,
        String channelTitle,
        String thumbnailUrl,
        @NotNull Integer durationSec
) {}
