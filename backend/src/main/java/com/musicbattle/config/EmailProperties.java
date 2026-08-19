package com.musicbattle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Getter
@Setter
@Configuration
@ConfigurationProperties("email")
public class EmailProperties {
    private Duration keyExpirationMs;
    private Duration verifyExpirationMs;
}
