package com.musicbattle.service;

import com.musicbattle.config.BattleRuleProperties;
import com.musicbattle.domain.Member;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.util.JwtTokenProvider;
import com.musicbattle.web.dto.LoginRequest;
import com.musicbattle.web.dto.LoginResponse;
import com.musicbattle.web.dto.TokenRefreshRequest;
import com.musicbattle.web.dto.TokenRefreshResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final BattleRuleProperties rules;
    private static final String LOGIN_FAIL_MESSAGE = "아이디 또는 비밀번호가 일치하지 않습니다";

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request, String ipHash){

        Member member = memberRepository.findByProviderId(request.providerId()).orElseThrow(()->
                new IllegalStateException(LOGIN_FAIL_MESSAGE));

        //로그인 횟수 (max=5) - 차단 로직
        String lockKey = "login:lock"+":"+ipHash+":"+request.providerId();
        checkLoginLock(lockKey);//키 확인

        //외부 로그인 인증 방식-> 다른API사용
        if(member.getPassword() == null) throw new IllegalStateException(LOGIN_FAIL_MESSAGE);

        if(!passwordEncoder.matches(request.password(), member.getPassword())) {
            incrementLoginLockCount(lockKey);//value 증가

            throw new IllegalStateException(LOGIN_FAIL_MESSAGE);
        }

        String token = jwtTokenProvider.generateToken(member.getId());
        String refreshToken = createRefreshToken(member.getId());
        //토큰 생성후 redis에서 key 제거
        deleteLoginLockCount(lockKey);

        return new LoginResponse(token,refreshToken, member.getId());
    }

    //키가 유효한지 검사
    private void checkLoginLock(String lockKey){
        String required =redisTemplate.opsForValue().get(lockKey);
        if(required != null && Long.parseLong(required) >= 5) throw new IllegalStateException("로그인을 5회 이상 시도하였습니다. 잠시후 시도해주세요");

    }
    private void incrementLoginLockCount(String lockKey){
        Long required = redisTemplate.opsForValue().increment(lockKey);
        if(required==1) redisTemplate.expire(lockKey, Duration.ofMinutes(1));
        //첫번쨰 시도시 1분 카운트
    }

    private void deleteLoginLockCount(String lockKey){
        if(lockKey != null) redisTemplate.delete(lockKey);
    }

    //토큰갱신 로직
    public TokenRefreshResponse updateAccessToken(TokenRefreshRequest request){

        String refreshKey = "refresh:"+request.refreshToken();
        String refreshValue = redisTemplate.opsForValue().get(refreshKey);
        if(refreshValue == null) throw new IllegalStateException("토큰의 유효기간이 종료되었습니다.");

        redisTemplate.delete(refreshKey);

        Long memberId = Long.parseLong(refreshValue);
        String newAccessToken = jwtTokenProvider.generateToken(memberId);
        String newRefreshToken = createRefreshToken(memberId);
        return new TokenRefreshResponse(newAccessToken, newRefreshToken);

    }

    //refreshToken생성 메서드
    private String createRefreshToken(Long memberId){
        String refreshToken = UUID.randomUUID().toString(); // 랜덤 문자열
        String refreshKey =  "refresh:"+ refreshToken;
        redisTemplate.opsForValue().set(refreshKey, memberId.toString(),rules.getToken().getRefreshTokenDuration());
        return refreshToken;


    }








}

