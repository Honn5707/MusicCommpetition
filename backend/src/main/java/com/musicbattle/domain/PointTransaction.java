package com.musicbattle.domain;

import com.musicbattle.domain.enums.PointTransactionType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 포인트는 "잔액 필드 하나"로 관리하지 않는다.
 * 모든 가감을 이 원장에 기록하고 balanceAfter 로 스냅샷을 남긴다.
 * -> "포인트가 왜 이렇게 됐는지" 를 항상 재구성할 수 있어야
 *    실서비스에서 CS/어뷰징 분쟁을 감당할 수 있다.
 */
@Entity
@Table(name = "point_transaction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private int amount; // 부호 있음 (+획득 / -사용)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PointTransactionType type;

    @Column(name = "ref_type")
    private String refType; // "MATCH", "BATTLE", "COSMETIC_ITEM" 등

    @Column(name = "ref_id")
    private Long refId;

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public PointTransaction(Long memberId, int amount, PointTransactionType type,
                             String refType, Long refId, int balanceAfter) {
        this.memberId = memberId;
        this.amount = amount;
        this.type = type;
        this.refType = refType;
        this.refId = refId;
        this.balanceAfter = balanceAfter;
        this.createdAt = LocalDateTime.now();
    }
}
