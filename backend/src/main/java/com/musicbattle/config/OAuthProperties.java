package com.musicbattle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties("oauth")
@Getter
@Setter
public class OAuthProperties {
    private String clientId;
    private String clientSecret;
    private String redirectUri;
}
