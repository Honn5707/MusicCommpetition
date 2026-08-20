package com.musicbattle.web.dto;

public record OauthResponse(
        boolean isNewMember,
        LoginResponse loginResponse,   // 기존 회원이면 여기 채움
        String tempToken
) {
}
