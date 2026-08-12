package com.musicbattle.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RedisConfig {

    // 값 타입이 전부 단순 String/Hash라 StringRedisTemplate로 충분.
    // 복잡한 객체 직렬화가 필요해지면 그때 RedisTemplate<String,Object> + Jackson 추가.
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
