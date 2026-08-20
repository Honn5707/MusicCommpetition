package com.musicbattle.web.dto;

import com.musicbattle.domain.enums.Provider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MemberRegisterRequest(
//        @NotBlank String recaptchaToken,
        @NotNull Provider provider,
        @NotNull String providerId,
        @NotNull String email,
        //추후 https로 해쉬화
        @NotBlank @Size(min = 8, max = 16) String password,
        @NotNull @Size(min = 2, max = 20) String nickname){}

