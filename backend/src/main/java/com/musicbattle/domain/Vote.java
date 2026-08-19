package com.musicbattle.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vote")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "match_entry_id", nullable = false)
    private Long matchEntryId;

    @Column(name = "voter_member_id")
    private Long voterMemberId; // null = 비로그인

    @Column(nullable = false)
    private int weight;

    @Column(name = "is_extra_vote", nullable = false)
    private boolean extraVote;

    // 원본 IP를 그대로 저장하지 않는다 - 해시만 보관 (개인정보 최소화 원칙)
    @Column(name = "ip_hash", nullable = false)
    private String ipHash;



    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Vote(Long matchId, Long matchEntryId, Long voterMemberId, int weight,
                boolean extraVote, String ipHash) {
        this.matchId = matchId;
        this.matchEntryId = matchEntryId;
        this.voterMemberId = voterMemberId;
        this.weight = weight;
        this.extraVote = extraVote;
        this.ipHash = ipHash;
//        this.fingerprintId = fingerprintId;
        this.createdAt = LocalDateTime.now();
    }
}
