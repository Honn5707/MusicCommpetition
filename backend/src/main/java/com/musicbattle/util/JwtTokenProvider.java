package com.musicbattle.util;

import com.musicbattle.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;


@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    public String generateToken(Long memberId) {
        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());

        String token = Jwts.builder()
                .subject(String.valueOf(memberId))          // payload에 담을 정보 - memberId를 subject로
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpirationMs()))
                .signWith(key)                                // 여기서 서명이 들어감
                .compact();                                    // 최종 문자열로 조립

        return token;
    }

    public Long validateToken(String token){

        SecretKey key = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.valueOf(claims.getSubject());

    }
}
