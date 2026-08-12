package com.musicbattle.service;

import com.musicbattle.domain.Member;
import com.musicbattle.domain.PointTransaction;
import com.musicbattle.domain.enums.PointTransactionType;
import com.musicbattle.repository.MemberRepository;
import com.musicbattle.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 포인트 가감의 유일한 진입점. 다른 서비스는 Member.pointBalance 를 직접 건드리지 않고
 * 반드시 이 서비스를 통해서만 포인트를 움직인다 (원장 패턴 - 실무 결제/포인트 시스템의 기본 룰).
 */
@Service
@RequiredArgsConstructor
public class PointLedgerService {

    private final MemberRepository memberRepository;
    private final PointTransactionRepository pointTransactionRepository;

    //트랜잭션 생성
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void grant(Long memberId, int amount, PointTransactionType type, String refType, Long refId) {
        apply(memberId, amount, type, refType, refId);
    }

    @Transactional
    public void spend(Long memberId, int amount, PointTransactionType type, String refType, Long refId) {
        if (amount <= 0) {
            throw new IllegalArgumentException("차감 금액은 양수로 전달하세요 (내부에서 부호 처리).");
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원: " + memberId));
        if (member.getPointBalance() < amount) {
            throw new IllegalStateException("포인트 잔액 부족");
        }
        apply(memberId, -amount, type, refType, refId);
    }

    private void apply(Long memberId, int signedAmount, PointTransactionType type, String refType, Long refId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원: " + memberId));

        // @Version 낙관적 락 대상. 동시에 여러 지급이 몰려도(연승 보너스+투표보상 등)
        // lost-update 없이 순차적으로 정합성 유지.
        member.applyPointDelta(signedAmount);

        PointTransaction tx = PointTransaction.builder()
                .memberId(memberId)
                .amount(signedAmount)
                .type(type)
                .refType(refType)
                .refId(refId)
                .balanceAfter(member.getPointBalance())
                .build();
        pointTransactionRepository.save(tx);
    }
}
