package com.musicbattle.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "extra_vote_usage", uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "battle_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExtraVoteUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "battle_id", nullable = false)
    private Long battleId;

    @Column(name = "used_count", nullable = false)
    private int usedCount = 0;

    @Version
    private Long version;

    public ExtraVoteUsage(Long memberId, Long battleId) {
        this.memberId = memberId;
        this.battleId = battleId;
    }

    public void increment() {
        this.usedCount += 1;
    }
}
