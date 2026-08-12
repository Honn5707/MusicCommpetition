package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String providerId, @NotBlank String password) {}

