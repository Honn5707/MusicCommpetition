package com.musicbattle.web.dto;

public record LoginResponse(String token,  String refreshToken, Long memberId) {}


