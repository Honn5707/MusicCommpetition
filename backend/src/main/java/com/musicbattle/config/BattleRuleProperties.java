package com.musicbattle.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * application.yml 의 battle.* 값을 타입 안전하게 주입받는다.
 * 매직넘버를 코드에 흩뿌리지 않고 한 곳에서 관리 -> 밸런싱 튜닝 시 여기만 보면 됨.
 */
@Configuration
@ConfigurationProperties(prefix = "battle")
@Getter
@Setter
public class BattleRuleProperties {

    private Vote vote = new Vote();
    private Member member = new Member();
    private ExtraVote extraVote = new ExtraVote();
    private Rally rally = new Rally();
    private OneVsOne oneVsOne = new OneVsOne();
    private Recruiting recruiting = new Recruiting();
    private AntiAbuse antiAbuse = new AntiAbuse();
    private Token token = new Token();
    @Getter @Setter
    public static class Vote {
        private int weightAnonymous;
        private int weightMember;
    }

    @Getter @Setter
    public static class Token{
        private Duration refreshTokenDuration;
        private Duration accessTokenDuration;
    }
    @Getter @Setter
    public static class Member{
        private int maxJoinBattle;
    }

    @Getter @Setter
    public static class Recruiting {
        private int expireHours;
    }
    @Getter @Setter
    public static class ExtraVote {
        private int maxPerBattle;
    }

    @Getter @Setter
    public static class Rally {
        private int defaultVoteWindowSeconds;
        private double streakMultiplierPerWin;
        private double streakMultiplierCap;
    }

    @Getter @Setter
    public static class OneVsOne {
        private int defaultVoteWindowSeconds;
    }

    @Getter @Setter
    public static class AntiAbuse {
        private int voteLockTtlSeconds;
    }
}
