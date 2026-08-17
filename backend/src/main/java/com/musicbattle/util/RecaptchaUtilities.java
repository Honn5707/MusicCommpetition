package com.musicbattle.util;

import com.musicbattle.config.RecaptchaProperties;
import com.musicbattle.web.dto.RecaptchaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class RecaptchaUtilities {
    private final RestClient restClient = RestClient.create();
    private final RecaptchaProperties properties;
    public void certify(String token){
        RecaptchaResponse response = restClient.post()
                .uri("https://www.google.com/recaptcha/api/siteverify")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("secret=" + properties.getSecret() + "&response=" + token)
                .retrieve()
                .body(RecaptchaResponse.class);

        if(!response.success()){
            throw new IllegalStateException("CAPTCHA 인증 실패");
        }
    }
}
