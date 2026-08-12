package com.musicbattle.domain;

import com.musicbattle.domain.enums.Provider;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 실무 습관: 엔티티에 public setter를 열어두지 않는다.
 * 상태 변경은 의미 있는 도메인 메서드(addPoints 등)로만 하도록 강제해서
 * "어디서 값이 바뀌었는지 추적 불가" 문제를 원천 차단한다.
 */
@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    private Provider provider; // LOCAL / GOOGLE / KAKAO

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column(name="password", nullable = true)
    private String password;

    @Column(nullable = false, unique = true)
    private String nickname;

    /**
     * point_transaction 원장 합계의 캐시. 진실의 원천은 절대 이 필드가 아니다.
     * PointLedgerService 를 통해서만 변경되어야 한다.
     */
    @Column(name = "point_balance", nullable = false)
    private int pointBalance = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MemberStatus status = MemberStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 동시성 제어: 여러 요청이 동시에 포인트를 갱신할 때 lost-update 방지
    @Version
    private Long version;

    @Builder
    public Member(Provider provider, String providerId, String nickname, String password) {
        this.provider = provider;
        this.providerId = providerId;
        this.nickname = nickname;
        this.createdAt = LocalDateTime.now();
        this.password = password;
    }

    /** PointLedgerService 내부에서만 호출되어야 하는 잔액 캐시 갱신 메서드 */
    public void applyPointDelta(int delta) {
        this.pointBalance += delta;
    }

    public enum MemberStatus {
        ACTIVE, SUSPENDED
    }
}
