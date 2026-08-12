package com.musicbattle.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;


@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");//토큰 꺼내기(헤더에서)

        if(header!=null && header.startsWith("Bearer ")){ //bearer<< token인증을 원하는 클라이언트 헤더메세지
            String token = header.substring(7);
            try{
                Long memberId = jwtTokenProvider.validateToken(token);
                UsernamePasswordAuthenticationToken authentication =
                      new UsernamePasswordAuthenticationToken(memberId, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
            }catch (Exception e){}
        }

        filterChain.doFilter(request, response);

    }



}
