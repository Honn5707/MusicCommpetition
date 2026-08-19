package com.musicbattle.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EmailCodeConfirmRequest(@NotBlank String code, @NotNull String email) {
}
