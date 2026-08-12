package com.musicbattle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // MatchScheduler(@Scheduled) 활성화
public class MusicBattleApplication {
    public static void main(String[] args) {
        SpringApplication.run(MusicBattleApplication.class, args);
    }
}
