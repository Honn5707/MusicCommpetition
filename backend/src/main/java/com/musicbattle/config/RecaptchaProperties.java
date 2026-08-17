package com.musicbattle.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties("recaptcha")
@Getter
@Setter
public class RecaptchaProperties {
    private String secret;
}
