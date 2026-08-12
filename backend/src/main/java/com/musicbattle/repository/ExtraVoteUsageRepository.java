package com.musicbattle.repository;

import com.musicbattle.domain.ExtraVoteUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExtraVoteUsageRepository extends JpaRepository<ExtraVoteUsage, Long> {
    Optional<ExtraVoteUsage> findByMemberIdAndBattleId(Long memberId, Long battleId);
}
