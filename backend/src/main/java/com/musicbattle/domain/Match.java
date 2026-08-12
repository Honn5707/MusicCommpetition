package com.musicbattle.domain;

import com.musicbattle.domain.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 상태 전이 규칙을 서비스 레이어가 아니라 엔티티 안에 캡슐화한다.
 * (Anemic Domain Model을 피하는 실무 패턴 - "상태가 있는 곳에 전이 로직도 둔다")
 * 잘못된 전이를 시도하면 즉시 예외를 던져 버그를 컴파일 시점이 아니라
 * 최대한 이른 런타임 시점에 잡는다.
 */
@Entity
@Table(name = "matches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "battle_id", nullable = false)
    private Long battleId;

    @Column(name = "round_no", nullable = false)
    private int roundNo;

    @Column(name = "bracket_position")
    private Integer bracketPosition;

    @Column(name = "next_match_id")
    private Long nextMatchId; // 토너먼트 진출 대상

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status = MatchStatus.RECRUITING;

    @Column(name = "voting_starts_at")
    private LocalDateTime votingStartsAt;

    @Column(name = "voting_ends_at")
    private LocalDateTime votingEndsAt;

    @Column(name = "winner_entry_id")
    private Long winnerEntryId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    private Long version;

    @Builder
    public Match(Long battleId, int roundNo, Integer bracketPosition, Long nextMatchId) {
        this.battleId = battleId;
        this.roundNo = roundNo;
        this.bracketPosition = bracketPosition;
        this.nextMatchId = nextMatchId;
        this.createdAt = LocalDateTime.now();
    }

    /** RECRUITING -> VOTING : 양 진영 곡이 채워지면 투표창을 연다 */
    public void openVoting(int voteWindowSec) {
        requireStatus(MatchStatus.RECRUITING);
        this.status = MatchStatus.VOTING;
        this.votingStartsAt = LocalDateTime.now();
        this.votingEndsAt = this.votingStartsAt.plusSeconds(voteWindowSec);
    }

    /** VOTING -> CALCULATING : 스케줄러가 마감 시각 도달을 감지했을 때만 호출 */
    public void closeVoting() {
        requireStatus(MatchStatus.VOTING);
        this.status = MatchStatus.CALCULATING;
    }

    /** CALCULATING -> FINISHED : 집계 완료, 승자 확정 */
    public void finish(Long winnerEntryId) {
        requireStatus(MatchStatus.CALCULATING);
        this.status = MatchStatus.FINISHED;
        this.winnerEntryId = winnerEntryId;
    }

    public void surrender(Long winnerEntryId){
        requireStatus(MatchStatus.VOTING);
        this.status = MatchStatus.FINISHED;
        this.winnerEntryId = winnerEntryId;
    }

    public boolean isVotingExpired() {
        return this.status == MatchStatus.VOTING
                && this.votingEndsAt != null
                && this.votingEndsAt.isBefore(LocalDateTime.now());
    }

    private void requireStatus(MatchStatus expected) {
        if (this.status != expected) {
            throw new IllegalStateException(
                    "잘못된 상태 전이 시도: matchId=" + id + " 현재=" + status + " 기대=" + expected);
        }
    }
}
