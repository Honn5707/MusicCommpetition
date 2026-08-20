package com.musicbattle.service;

import com.musicbattle.config.OAuthProperties;
import com.musicbattle.domain.Member;
import com.musicbattle.domain.enums.Provider;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.util.JwtTokenProvider;
import com.musicbattle.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OauthService {
    private final RestClient restClient = RestClient.create();
    private final OAuthProperties properties;
    private final ObjectMapper objectMapper;
    private final MemberRepository memberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthService authService;
    private final MemberService memberService;
    private final StringRedisTemplate redisTemplate;
    //구글 로그인
    public OauthResponse googleAuth(String code){

        //토큰교환 restClient
        OauthTokenResponse response = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("code=" + code
                        + "&client_id=" + properties.getClientId()
                        + "&client_secret=" + properties.getClientSecret()
                        + "&redirect_uri=" + properties.getRedirectUri()
                        + "&grant_type=authorization_code")
                .retrieve()
                .body(OauthTokenResponse.class);


        String accessToken = response.access_token();

        OauthUserInfoResponse userInfo = restClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(OauthUserInfoResponse.class);

        return oauthLogin("GOOGLE", userInfo.sub(), userInfo.email());

    }



    private OauthResponse oauthLogin(String provider, String providerId, String email){
        Optional<Member> memberExist = memberRepository.findByProviderId(providerId);

        //회원가입상태->
        if(memberExist.isPresent()){
            Member member = memberExist.get();
            String token = jwtTokenProvider.generateToken(member.getId());
            String refreshToken = authService.createRefreshToken(member.getId());
            return new OauthResponse(false, new LoginResponse(token,refreshToken, member.getId()),null);
        }

        //회원가입이 안되어있따면 ->
        String tempToken = UUID.randomUUID().toString();

         OauthTempInfo oauthTempInfo = new OauthTempInfo(provider, providerId, email);

        String json;
        try {
            json = objectMapper.writeValueAsString(oauthTempInfo);
        } catch (JacksonException e) {
            throw new IllegalStateException("OAuth 정보 처리 중 오류가 발생했습니다", e);
        }
        redisTemplate.opsForValue().set("oauth-pending:" + tempToken, json, Duration.ofMinutes(10));

        return new OauthResponse(true, null, tempToken);
    }

    @Transactional
    public LoginResponse OauthRegister(OauthRegisterRequest request){
        String nickname = request.name();
        String json = redisTemplate.opsForValue().get("oauth-pending:" +request.tempToken());
        OauthTempInfo oauthTempInfo;

        if(!redisTemplate.hasKey("oauth-pending:" + request.tempToken())) throw new IllegalStateException("인증 기간이 만료되었습니다");

        try {
            oauthTempInfo = objectMapper.readValue(json, OauthTempInfo.class);
        }catch (JacksonException e){
            throw new IllegalStateException("JSON데이터를 읽는데 실패하였습니다" + e);
        };

        if(memberRepository.findByNickname(nickname).isPresent()) throw new IllegalStateException("이미 존재하는 닉네임:"+nickname);

        Member newMember = Member.builder().provider(Provider.valueOf(oauthTempInfo.provider())).providerId(oauthTempInfo.providerId()).nickname(nickname).password(null).email(oauthTempInfo.email()).build();
        memberRepository.save(newMember);
        redisTemplate.delete("oauth-pending:" + request.tempToken());

        String token = jwtTokenProvider.generateToken(newMember.getId());
        String refreshToken = authService.createRefreshToken(newMember.getId());
        return new LoginResponse(token, refreshToken, newMember.getId());
    }
}
