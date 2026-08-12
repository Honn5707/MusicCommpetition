package com.musicbattle.domain;

import com.musicbattle.domain.enums.BattleMode;
import com.musicbattle.domain.enums.BattleStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "battle")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Battle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BattleMode mode;

    @Column(nullable = false)
    private String title;

    @Column(name = "host_member_id", nullable = false)
    private Long hostMemberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BattleStatus status = BattleStatus.SCHEDULED;

    // 1vs1은 12~24h, 렐리는 짧게 - 하드코딩하지 않고 배틀 생성 시 설정값에서 주입
    @Column(name = "vote_window_sec", nullable = false)
    private int voteWindowSec;

    @Column(name = "bracket_size")
    private Integer bracketSize; // 토너먼트 전용

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Version
    private Long version;

    @Builder
    public Battle(BattleMode mode, String title, Long hostMemberId,
                  int voteWindowSec, Integer bracketSize) {


        this.mode = mode;
        this.title = title;
        this.hostMemberId = hostMemberId;
        this.voteWindowSec = voteWindowSec;
        this.bracketSize = bracketSize;
    }

    public void goLive() {
        this.status = BattleStatus.LIVE;
        this.startedAt = LocalDateTime.now();
    }

    public void end() {
        this.status = BattleStatus.ENDED;
        this.endedAt = LocalDateTime.now();
    }
}
