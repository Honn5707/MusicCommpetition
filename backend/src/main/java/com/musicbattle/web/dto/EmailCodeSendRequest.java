package com.musicbattle.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

public record EmailCodeSendRequest(@Email @NotNull String email) {
}
