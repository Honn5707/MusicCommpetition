package com.musicbattle.web;

import com.musicbattle.service.AuthService;
import com.musicbattle.service.OauthService;
import com.musicbattle.util.IpUtilities;
import com.musicbattle.web.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final OauthService oauthService;
    private final IpUtilities ipUtilities;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest httpServletRequest){

        //ip중복 접근 방지를 위한 인스턴스
        String clientIp = ipUtilities.extractClientIp(httpServletRequest);
        String ipHash = ipUtilities.sha256(clientIp);//해시값으로 변환(sha 256)

        return ResponseEntity.ok( authService.login(request, ipHash));

    }

    //토큰이 만료되었을때 -> refreshToken이 존재하면 refreshToken과 accessToken을 리턴시킴.
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> tokenRefresh(@Valid @RequestBody TokenRefreshRequest request){
        TokenRefreshResponse response = authService.updateAccessToken(request);
        return ResponseEntity.ok(response);
    }
    @GetMapping("google/callback")
    public ResponseEntity<OauthResponse> oauthLogin(String code){
       return ResponseEntity.ok(oauthService.googleAuth(code));


    }
    @PostMapping("/oauth-register")
    public ResponseEntity<LoginResponse> oauthRegister(@Valid @RequestBody OauthRegisterRequest request){
        return ResponseEntity.ok(oauthService.OauthRegister(request));


    }

}
